#!/usr/bin/env node
// Lista los modelos 3D disponibles en app/public/modelos y avisa de los que el catálogo espera y no están.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const base = path.join(raiz, 'app', 'public', 'modelos')
const src = ['modelos.js', 'campus.js', 'personaje.js'].map(f => fs.readFileSync(path.join(raiz, 'app', 'src', 'office', f), 'utf8')).join('\n')
const carpetas = Object.fromEntries([...src.matchAll(/(\w+): \{ carpeta: '([^']+)'/g)].map(m => [m[1], m[2]]))
const modelosPersonaje = [...src.matchAll(/MODELOS_PERSONAJE = \[([^\]]+)\]/g)].flatMap(m => m[1].split(',').map(x => 'personajes:' + x.trim().replace(/'/g, '')))
const esperados = [...new Set([...[...src.matchAll(/'(\w+):([\w.-]+)'/g)].map(m => m[1] + ':' + m[2]), ...modelosPersonaje])].filter(n => carpetas[n.split(':')[0]])
let faltan = 0
for (const [paq, carpeta] of Object.entries(carpetas)) {
  const dir = path.join(base, carpeta)
  const archivos = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.(glb|gltf)$/i.test(f)) : []
  const mb = archivos.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0) / 1048576
  console.log(`${paq.padEnd(14)} ${carpeta.padEnd(18)} ${String(archivos.length).padStart(4)} modelos  ${mb.toFixed(1)} MB`)
}
for (const n of esperados) {
  const [paq, archivo] = n.split(':'); const f = path.join(base, carpetas[paq], archivo + (archivo.endsWith('.gltf') ? '' : '.glb'))
  if (!fs.existsSync(f)) { console.log('  falta: ' + n + '  → ' + path.relative(raiz, f)); faltan++ }
}
console.log(faltan ? `${faltan} modelos del catálogo no están en disco; el campus usará un relleno gris en su lugar.` : `Catálogo completo: los ${esperados.length} modelos esperados están en disco.`)
