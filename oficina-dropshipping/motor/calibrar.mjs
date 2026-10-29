// Calibración de la pasarela de generación: una imagen y un clip por modelo, con coste y archivo de cada uno.
// Uso:  node calibrar.mjs --imagen ../fotos/producto.jpg [--solo hailuo_02_std,kling_turbo] [--sin-imagenes] [--sin-videos] [--voz "Texto en español"]
// No usa Claude: llama a la pasarela directamente. Respeta los topes de presupuesto.json salvo TOPE_TAREA_USD, que
// aquí se fija en 15 USD para que la calibración completa quepa. Deja todo en entregas/Calibracion.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalogoModelos, claveFal, generarImagen, generarVideo, resumenGasto } from './generacion.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? (args[i + 1] ?? true) : def }
const imagenRef = opt('--imagen', '')
const solo = String(opt('--solo', '')).split(',').filter(Boolean)
const sinImagenes = args.includes('--sin-imagenes')
const sinVideos = args.includes('--sin-videos')
const voz = opt('--voz', 'Si tu perro se aleja cuando le das un beso, el problema es el sarro. Con dos aplicaciones al día vuelve a oler a limpio.')

process.env.AGENTES_AGENTE = 'Calibracion'
process.env.AGENTES_TAREA = 'calibracion-' + new Date().toISOString().slice(0, 10)
process.env.TOPE_TAREA_USD = process.env.TOPE_TAREA_USD || '15'

if (!claveFal()) { console.error('Falta FAL_KEY en motor/.env (o aún dice PEGA_AQUI).'); process.exit(1) }
if (imagenRef && !existsSync(imagenRef)) { console.error('No encuentro la imagen de referencia:', imagenRef); process.exit(1) }
const ref = imagenRef ? resolve(imagenRef) : ''
const dir = join(ROOT, 'entregas', 'Calibracion')
mkdirSync(dir, { recursive: true })
const fecha = new Date().toISOString().slice(0, 10)
const cat = catalogoModelos()
const incluir = (id) => !solo.length || solo.includes(id)
const informe = []
const fmt = (n) => (+n).toFixed(3)

console.log(`Calibración ${fecha} · referencia: ${ref || '(sin imagen de producto)'}\n`)

if (!sinImagenes) {
  for (const [id, m] of Object.entries(cat.imagenes || {})) {
    if (!incluir(id)) continue
    const conRef = !!(ref && m.endpointEdicion)
    const prompt = conRef
      ? 'Place the exact product from the reference image on a clean wooden kitchen table, natural window light, handheld phone photo style, keep the label and shape exactly as in the reference, no text, no logos, vertical 9:16'
      : 'A small spray bottle for dogs on a clean wooden kitchen table, natural window light, handheld phone photo style, no text, no logos, vertical 9:16'
    const t0 = Date.now()
    try {
      const r = await generarImagen({ modelo: id, prompt, referencias: conRef ? [ref] : [], rutaDestinoSinExt: join(dir, `${fecha} imagen ${id}`) })
      informe.push({ tipo: 'imagen', modelo: id, ok: true, costoUSD: r.costoUSD, segundos: Math.round((Date.now() - t0) / 1000), archivo: r.ruta })
      console.log(`✔ imagen ${id}: ${fmt(r.costoUSD)} USD · ${Math.round((Date.now() - t0) / 1000)} s · ${r.ruta}`)
    } catch (e) {
      informe.push({ tipo: 'imagen', modelo: id, ok: false, error: e.message })
      console.log(`✖ imagen ${id}: ${e.message}`)
    }
  }
}

if (!sinVideos) {
  for (const [id, m] of Object.entries(cat.videos || {})) {
    if (!incluir(id)) continue
    const habla = !!m.campoAudio
    const conRef = !!(ref && (m.endpointImagen || m.campoImagen))
    const prompt = habla
      ? `A friendly Latina woman in her early thirties sits on a sofa in a bright living room and talks to the camera with natural lip movements, relaxed and warm, handheld phone footage. She says in neutral Latin American Spanish: "${voz}". No text, no logos.`
      : conRef
        ? 'The product from the image stands on a clean white surface and stays exactly as shown: same label, same colors, same shape. Locked-off camera with a very slow subtle push-in, the whole product stays visible and in focus, soft studio light. No text, no logos.'
        : 'Handheld phone footage of a french bulldog yawning into its owner face in a sunny living room; the owner recoils and laughs. Natural light, realistic, vertical 9:16, no text, no logos.'
    const dur = m.duracionPorDefecto || (m.duraciones || [5])[0]
    const t0 = Date.now()
    try {
      const r = await generarVideo({ modelo: id, prompt, imagenInicio: conRef && !habla ? ref : undefined, duracion: dur, resolucion: m.campoResolucion ? '720p' : undefined, audio: habla ? true : undefined, rutaDestino: join(dir, `${fecha} video ${id}.mp4`) })
      informe.push({ tipo: 'video', modelo: id, ok: true, costoUSD: r.costoUSD, duracion: dur, segundos: Math.round((Date.now() - t0) / 1000), archivo: r.ruta })
      console.log(`✔ video ${id} (${dur} s): ${fmt(r.costoUSD)} USD estimado · ${Math.round((Date.now() - t0) / 1000)} s · ${r.ruta}`)
    } catch (e) {
      informe.push({ tipo: 'video', modelo: id, ok: false, error: e.message })
      console.log(`✖ video ${id}: ${e.message}`)
    }
  }
}

const total = informe.reduce((a, r) => a + (r.costoUSD || 0), 0)
const md = [
  `# Calibración ${fecha}`, '',
  `Referencia: ${ref || 'ninguna'}`, `Coste estimado total: ${fmt(total)} USD`, '',
  '| Tipo | Modelo | Resultado | Coste estimado | Tiempo | Archivo / error |', '|---|---|---|---|---|---|',
  ...informe.map(r => `| ${r.tipo} | ${r.modelo} | ${r.ok ? 'ok' : 'FALLÓ'} | ${r.ok ? fmt(r.costoUSD) + ' USD' : ''} | ${r.ok ? r.segundos + ' s' : ''} | ${r.ok ? r.archivo : r.error.replace(/\|/g, '/')} |`),
  '', '## Qué hacer ahora', '',
  '1. Abre cada archivo y califica de 1 a 5: fidelidad del producto, naturalidad del movimiento, labios si hay voz.',
  '2. Compara el coste estimado con el cargo real en tu cuenta de fal.ai y corrige `precioPorSegundo` / `precioPorImagen` en `motor/modelos.json`.',
  '3. Si un modelo FALLÓ con 404 o parámetros inválidos, corrige su endpoint o parámetros en `motor/modelos.json` mirando su página en fal.ai.',
  '4. Decide los modelos por tipo de bloque y escríbelos en la skill `produccion-anuncios` si cambian respecto a la tabla por defecto.',
].join('\n')
writeFileSync(join(dir, `${fecha} informe-calibracion.md`), md)
console.log(`\nInforme: ${join(dir, `${fecha} informe-calibracion.md`)}`)
console.log('Gasto registrado:', JSON.stringify(resumenGasto(process.env.AGENTES_TAREA)))
