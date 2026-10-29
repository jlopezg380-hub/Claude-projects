// Pasarela de generación de imágenes y vídeo por API (fal.ai) con presupuesto y registro de gasto.
// - Los modelos, endpoints y precios viven en modelos.json (se confirman en la calibración del día 1).
// - Los topes viven en presupuesto.json y se pueden sobrescribir con TOPE_TAREA_USD, TOPE_DIARIO_USD y TOPE_MENSUAL_USD.
// - Cada generación queda anotada en logs/gasto.json con su coste estimado: la herramienta frena antes de superar un tope.
// - Sin FAL_KEY en motor/.env la pasarela no está configurada: los agentes trabajan en modo prompts.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const GASTO_FILE = join(ROOT, 'logs', 'gasto.json')
const FAL_QUEUE = 'https://queue.fal.run'

// ---------- configuración ----------
export function cargarEnv() {
  const env = {}
  try {
    for (const raw of readFileSync(join(ROOT, '.env'), 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
      const m = raw.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
  return { ...env, ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v !== '')) }
}

export function claveFal() {
  const k = cargarEnv().FAL_KEY || ''
  return k && !k.startsWith('PEGA_AQUI') ? k : ''
}

export function catalogoModelos() {
  try { return JSON.parse(readFileSync(join(ROOT, 'modelos.json'), 'utf8')) } catch (e) { throw new Error('No pude leer motor/modelos.json: ' + e.message) }
}

export function presupuesto() {
  let p = { topePorTareaUSD: 3, topeDiarioUSD: 5, topeMensualUSD: 60 }
  try { p = { ...p, ...JSON.parse(readFileSync(join(ROOT, 'presupuesto.json'), 'utf8')) } } catch {}
  const env = cargarEnv()
  if (env.TOPE_TAREA_USD) p.topePorTareaUSD = +env.TOPE_TAREA_USD
  if (env.TOPE_DIARIO_USD) p.topeDiarioUSD = +env.TOPE_DIARIO_USD
  if (env.TOPE_MENSUAL_USD) p.topeMensualUSD = +env.TOPE_MENSUAL_USD
  delete p._ayuda
  return p
}

// ---------- registro de gasto ----------
export function gastos() {
  try { return JSON.parse(readFileSync(GASTO_FILE, 'utf8')) } catch { return [] }
}

export function registrarGasto(entrada) {
  const lista = gastos()
  lista.push({ fecha: new Date().toISOString(), tarea: process.env.AGENTES_TAREA || '', agente: process.env.AGENTES_AGENTE || '', ...entrada })
  mkdirSync(dirname(GASTO_FILE), { recursive: true })
  writeFileSync(GASTO_FILE, JSON.stringify(lista, null, 2))
}

export function resumenGasto(tareaId = process.env.AGENTES_TAREA || '') {
  const hoy = new Date().toISOString().slice(0, 10)
  const mes = hoy.slice(0, 7)
  let dia = 0, mesTotal = 0, tarea = 0
  for (const g of gastos()) {
    const c = +g.costoUSD || 0
    if (g.fecha.startsWith(hoy)) dia += c
    if (g.fecha.startsWith(mes)) mesTotal += c
    if (tareaId && g.tarea === tareaId) tarea += c
  }
  const p = presupuesto()
  return {
    topes: p,
    gastadoHoyUSD: +dia.toFixed(3), gastadoMesUSD: +mesTotal.toFixed(3), gastadoTareaUSD: +tarea.toFixed(3),
    restanteHoyUSD: +(p.topeDiarioUSD - dia).toFixed(3), restanteMesUSD: +(p.topeMensualUSD - mesTotal).toFixed(3),
    restanteTareaUSD: +(p.topePorTareaUSD - tarea).toFixed(3),
  }
}

// ¿Cabe este coste en los topes? Devuelve { ok, motivo }
export function comprobarTope(costoUSD) {
  const r = resumenGasto()
  if (costoUSD > r.restanteTareaUSD) return { ok: false, motivo: `Supera el tope por tarea (${r.topes.topePorTareaUSD} USD): llevas ${r.gastadoTareaUSD} y esto cuesta ${costoUSD.toFixed(3)}. Responde con NECESITO: para pedir más presupuesto.`, resumen: r }
  if (costoUSD > r.restanteHoyUSD) return { ok: false, motivo: `Supera el tope diario (${r.topes.topeDiarioUSD} USD): hoy van ${r.gastadoHoyUSD}.`, resumen: r }
  if (costoUSD > r.restanteMesUSD) return { ok: false, motivo: `Supera el tope mensual (${r.topes.topeMensualUSD} USD): este mes van ${r.gastadoMesUSD}.`, resumen: r }
  return { ok: true, resumen: r }
}

// ---------- estimación ----------
export function estimar({ clips = [], imagenes = [] }) {
  const cat = catalogoModelos()
  const lineas = []
  let total = 0
  for (const c of clips) {
    const m = cat.videos?.[c.modelo]
    if (!m) { lineas.push({ error: `Modelo de vídeo desconocido: ${c.modelo}` }); continue }
    const seg = +c.segundos || m.duracionPorDefecto || 5
    const costo = +(m.precioPorSegundo * seg * (c.cantidad || 1)).toFixed(3)
    total += costo
    lineas.push({ modelo: c.modelo, segundos: seg, cantidad: c.cantidad || 1, costoUSD: costo })
  }
  for (const i of imagenes) {
    const m = cat.imagenes?.[i.modelo]
    if (!m) { lineas.push({ error: `Modelo de imagen desconocido: ${i.modelo}` }); continue }
    const costo = +(m.precioPorImagen * (i.cantidad || 1)).toFixed(3)
    total += costo
    lineas.push({ modelo: i.modelo, cantidad: i.cantidad || 1, costoUSD: costo })
  }
  return { lineas, totalUSD: +total.toFixed(3), tope: comprobarTope(total) }
}

// ---------- fal.ai ----------
async function falFetch(url, key, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } })
  const text = await r.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  if (!r.ok) throw new Error(`fal ${r.status}: ${(json && (json.detail || json.message)) ? JSON.stringify(json.detail || json.message).slice(0, 400) : text.slice(0, 400)}`)
  return json
}

async function falEnviar(endpoint, input, key) {
  return falFetch(`${FAL_QUEUE}/${endpoint}`, key, { method: 'POST', body: JSON.stringify(input) })
}

async function falEsperar(envio, key, timeoutMs) {
  const inicio = Date.now()
  const statusUrl = envio.status_url, responseUrl = envio.response_url
  if (!statusUrl || !responseUrl) throw new Error('La pasarela no devolvió status_url/response_url')
  while (Date.now() - inicio < timeoutMs) {
    const s = await falFetch(statusUrl, key)
    if (s.status === 'COMPLETED') return falFetch(responseUrl, key)
    if (s.status === 'FAILED' || s.status === 'ERROR') throw new Error('La generación falló en la pasarela: ' + JSON.stringify(s).slice(0, 400))
    await new Promise(r => setTimeout(r, 5000))
  }
  throw new Error('Tiempo de espera agotado; la petición sigue en la pasarela con request_id ' + envio.request_id)
}

function primeraUrl(res) {
  if (!res || typeof res !== 'object') return null
  if (res.video?.url) return res.video.url
  if (Array.isArray(res.videos) && res.videos[0]?.url) return res.videos[0].url
  if (Array.isArray(res.images) && res.images[0]?.url) return res.images[0].url
  if (res.image?.url) return res.image.url
  if (res.output?.url) return res.output.url
  for (const v of Object.values(res)) { const u = primeraUrl(v); if (u) return u }
  return null
}

export async function descargar(url, dest) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10 * 60 * 1000) })
  if (!r.ok) throw new Error(`No pude descargar el resultado (${r.status})`)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()))
  return dest
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
export function archivoADataUri(ruta) {
  const ext = extname(ruta).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  return `data:${mime};base64,${readFileSync(ruta).toString('base64')}`
}

function formatearDuracion(m, segundos) {
  switch (m.formatoDuracion) {
    case 'texto': return String(segundos)
    case 'texto_s': return `${segundos}s`
    default: return segundos
  }
}

// Genera un vídeo. imagenInicio: ruta local o URL https. Devuelve { ruta, costoUSD, request_id, modelo }
export async function generarVideo({ modelo, prompt, imagenInicio, duracion, resolucion, audio, aspecto, rutaDestino }) {
  const key = claveFal()
  if (!key) throw new Error('La pasarela de generación no está configurada (falta FAL_KEY en motor/.env). Trabaja en modo prompts.')
  const cat = catalogoModelos()
  const m = cat.videos?.[modelo]
  if (!m) throw new Error(`Modelo de vídeo desconocido: ${modelo}. Usa modelos_disponibles.`)
  const seg = +duracion || m.duracionPorDefecto || 5
  if (m.duraciones?.length && !m.duraciones.includes(seg)) throw new Error(`Duraciones válidas para ${modelo}: ${m.duraciones.join(', ')} s`)
  const endpoint = imagenInicio && m.endpointImagen ? m.endpointImagen : m.endpoint
  if (imagenInicio && !m.endpointImagen && !m.campoImagen) throw new Error(`${modelo} no acepta imagen de inicio en este catálogo`)
  const costo = +(m.precioPorSegundo * seg).toFixed(3)
  const tope = comprobarTope(costo)
  if (!tope.ok) throw new Error(tope.motivo)

  const input = { prompt, ...(m.parametros || {}) }
  if (m.campoDuracion !== null) input[m.campoDuracion || 'duration'] = formatearDuracion(m, seg)
  if (m.campoAspecto) input[m.campoAspecto] = aspecto || m.aspectoPorDefecto || '9:16'
  if (m.campoResolucion) input[m.campoResolucion] = resolucion || m.resolucionPorDefecto || '720p'
  if (m.campoAudio) input[m.campoAudio] = audio ?? m.audioPorDefecto ?? false
  if (imagenInicio) input[m.campoImagen || 'image_url'] = /^https?:\/\//i.test(imagenInicio) ? imagenInicio : archivoADataUri(imagenInicio)

  const envio = await falEnviar(endpoint, input, key)
  const res = await falEsperar(envio, key, (m.timeoutMin || 15) * 60 * 1000)
  const url = primeraUrl(res)
  if (!url) throw new Error('La pasarela terminó sin URL de vídeo: ' + JSON.stringify(res).slice(0, 400))
  await descargar(url, rutaDestino)
  registrarGasto({ tipo: 'video', modelo, endpoint, segundos: seg, costoUSD: costo, archivo: rutaDestino, request_id: envio.request_id })
  return { ruta: rutaDestino, costoUSD: costo, request_id: envio.request_id, modelo, endpoint }
}

// Genera una imagen. referencias: rutas locales o URLs para endpoints de edición.
export async function generarImagen({ modelo, prompt, referencias = [], aspecto, rutaDestinoSinExt }) {
  const key = claveFal()
  if (!key) throw new Error('La pasarela de generación no está configurada (falta FAL_KEY en motor/.env). Trabaja en modo prompts.')
  const cat = catalogoModelos()
  const m = cat.imagenes?.[modelo]
  if (!m) throw new Error(`Modelo de imagen desconocido: ${modelo}. Usa modelos_disponibles.`)
  const endpoint = referencias.length && m.endpointEdicion ? m.endpointEdicion : m.endpoint
  const costo = +(m.precioPorImagen).toFixed(3)
  const tope = comprobarTope(costo)
  if (!tope.ok) throw new Error(tope.motivo)

  const input = { prompt, ...(m.parametros || {}) }
  if (m.campoAspecto) input[m.campoAspecto] = aspecto || m.aspectoPorDefecto || 'portrait_16_9'
  if (referencias.length) {
    const urls = referencias.map(r => /^https?:\/\//i.test(r) ? r : archivoADataUri(r))
    if (m.campoReferencias === 'image_url') input.image_url = urls[0]
    else input[m.campoReferencias || 'image_urls'] = urls
  }
  const envio = await falEnviar(endpoint, input, key)
  const res = await falEsperar(envio, key, (m.timeoutMin || 5) * 60 * 1000)
  const url = primeraUrl(res)
  if (!url) throw new Error('La pasarela terminó sin URL de imagen: ' + JSON.stringify(res).slice(0, 400))
  const ext = (extname(new URL(url).pathname) || '.jpg').toLowerCase()
  const ruta = rutaDestinoSinExt + (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg')
  await descargar(url, ruta)
  registrarGasto({ tipo: 'imagen', modelo, endpoint, costoUSD: costo, archivo: ruta, request_id: envio.request_id })
  return { ruta, costoUSD: costo, request_id: envio.request_id, modelo, endpoint }
}
