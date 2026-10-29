// Contenido de las pantallas del campus: dibujos en canvas relacionados con cada oficio.
import * as THREE from 'three'

let seed = 7
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d'); draw(ctx, w, h)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]) }
  return t
}

export const DIBUJOS = {
  radar: (ctx, w, h) => {
    ctx.fillStyle = '#06131a'; ctx.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2, R = h * 0.46
    ctx.strokeStyle = '#1f8f5f'; ctx.lineWidth = 2; for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * i / 4, 0, Math.PI * 2); ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke()
    if (ctx.createConicGradient) { const g = ctx.createConicGradient(-0.4, cx, cy); g.addColorStop(0, 'rgba(52,211,153,0)'); g.addColorStop(0.25, 'rgba(52,211,153,0.55)'); g.addColorStop(0.26, 'rgba(52,211,153,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill() }
    ctx.fillStyle = '#7CFFB2'; for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = rnd() * R * 0.9; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.5, 0, 6.28); ctx.fill() }
    ctx.fillStyle = '#9fe8c8'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('RADAR DE PRODUCTOS', 12, 22); ctx.font = '12px sans-serif'; ctx.fillText('12 candidatos · 3 ganadores', 12, h - 12)
  },
  productos: (ctx, w, h) => {
    ctx.fillStyle = '#f4f5f7'; ctx.fillRect(0, 0, w, h); const cols = 3, rows = 2, cw = w / cols, ch = h / rows
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6']
    for (let i = 0; i < 6; i++) { const x = (i % cols) * cw + 8, y = Math.floor(i / cols) * ch + 8; ctx.fillStyle = '#fff'; ctx.fillRect(x, y, cw - 16, ch - 16); ctx.fillStyle = colors[i]; ctx.fillRect(x + 8, y + 8, cw - 32, ch * 0.45); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x + 8, y + ch * 0.55, cw - 40, 6); ctx.fillRect(x + 8, y + ch * 0.55 + 12, cw - 60, 6); ctx.fillStyle = '#16a34a'; ctx.fillRect(x + 8, y + ch - 30, 46, 14) }
  },
  mapa: (ctx, w, h) => {
    ctx.fillStyle = '#0b1a2a'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#1e3a5f'; for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() } for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    ctx.fillStyle = '#1f4e79'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(rnd() * w, rnd() * h, 40 + rnd() * 60, 25 + rnd() * 40, rnd(), 0, 6.28); ctx.fill() }
    for (let i = 0; i < 12; i++) { const x = rnd() * w, y = rnd() * h; ctx.strokeStyle = 'rgba(245,158,11,0.6)'; ctx.beginPath(); ctx.arc(x, y, 8 + rnd() * 8, 0, 6.28); ctx.stroke(); ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.28); ctx.fill() }
  },
  storyboard: (ctx, w, h) => {
    ctx.fillStyle = '#d9c4a0'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 6; i++) { const x = 12 + (i % 3) * (w / 3), y = 12 + Math.floor(i / 3) * (h / 2); const cw = w / 3 - 24, ch = h / 2 - 24; ctx.fillStyle = '#fffdf7'; ctx.fillRect(x, y, cw, ch); ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.strokeRect(x + 8, y + 8, cw - 16, ch * 0.55); ctx.beginPath(); ctx.arc(x + cw * 0.5, y + ch * 0.3, ch * 0.12, 0, 6.28); ctx.stroke(); ctx.fillStyle = '#94a3b8'; ctx.fillRect(x + 8, y + ch * 0.7, cw - 24, 4); ctx.fillRect(x + 8, y + ch * 0.7 + 9, cw - 40, 4); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x + cw / 2, y + 3, 4, 0, 6.28); ctx.fill() }
    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('GANCHO → PROBLEMA → DEMO → OFERTA → CTA', 14, h - 8)
  },
  moodboard: (ctx, w, h) => {
    ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, w, h); const cs = ['#f97316', '#fde68a', '#0ea5e9', '#1e293b', '#a3e635', '#f472b6', '#ffffff', '#64748b']
    for (let i = 0; i < 8; i++) { ctx.fillStyle = cs[i]; ctx.fillRect(10 + i * (w / 8), 10, w / 8 - 10, h * 0.28); ctx.strokeStyle = '#e2e8f0'; ctx.strokeRect(10 + i * (w / 8), 10, w / 8 - 10, h * 0.28) }
    for (let i = 0; i < 4; i++) { const x = 10 + i * (w / 4), y = h * 0.42; ctx.fillStyle = ['#fed7aa', '#bae6fd', '#e9d5ff', '#d9f99d'][i]; ctx.fillRect(x, y, w / 4 - 14, h * 0.5); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x + w / 8 - 7, y + h * 0.25, 18, 0, 6.28); ctx.fill() }
  },
  dashboard: (ctx, w, h) => {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h)
    const kpis = [['CPA', '$3,1'], ['ENTREGA', '71 %'], ['ROAS', '2,4'], ['VENTAS', '38']]
    kpis.forEach((k, i) => { const x = 10 + i * (w / 4); ctx.fillStyle = '#1e293b'; ctx.fillRect(x, 10, w / 4 - 16, h * 0.3); ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.fillText(k[0], x + 8, 28); ctx.fillStyle = i === 1 ? '#34d399' : '#f8fafc'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(k[1], x + 8, h * 0.3) })
    const bx = 14, by = h * 0.45, bw = w * 0.5, bh = h * 0.5; ctx.fillStyle = '#1e293b'; ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8)
    for (let i = 0; i < 7; i++) { const v = 0.3 + rnd() * 0.7; ctx.fillStyle = i === 4 ? '#f59e0b' : '#38bdf8'; ctx.fillRect(bx + 8 + i * (bw / 7), by + bh - v * bh, bw / 7 - 10, v * bh) }
    const lx = w * 0.56, lw = w * 0.4; ctx.fillStyle = '#1e293b'; ctx.fillRect(lx - 4, by - 4, lw + 8, bh + 8); ctx.strokeStyle = '#34d399'; ctx.lineWidth = 3; ctx.beginPath()
    for (let i = 0; i <= 10; i++) { const x = lx + i * (lw / 10), y = by + bh - (0.2 + i * 0.06 + rnd() * 0.15) * bh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke()
  },
  timeline: (ctx, w, h) => {
    ctx.fillStyle = '#15171c'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#000'; ctx.fillRect(w * 0.3, 8, w * 0.4, h * 0.42); ctx.fillStyle = '#f59e0b'; ctx.fillRect(w * 0.42, h * 0.15, w * 0.16, h * 0.22)
    const cs = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24']; for (let t = 0; t < 4; t++) { ctx.fillStyle = '#23262e'; ctx.fillRect(6, h * 0.52 + t * (h * 0.11), w - 12, h * 0.09); let x = 8; while (x < w - 20) { const cw = 20 + rnd() * 60; ctx.fillStyle = cs[t]; ctx.fillRect(x, h * 0.53 + t * (h * 0.11), cw, h * 0.07); x += cw + 6 } }
    ctx.fillStyle = '#ef4444'; ctx.fillRect(w * 0.47, h * 0.5, 2, h * 0.48)
  },
  chat: (ctx, w, h) => {
    ctx.fillStyle = '#e5ddd5'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#075e54'; ctx.fillRect(0, 0, w, h * 0.12); ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('Cliente · pedido 1042', 12, h * 0.08)
    const rows = [[0, 0.55], [1, 0.7], [0, 0.45], [1, 0.8], [0, 0.6]]; rows.forEach((r, i) => { const y = h * 0.16 + i * (h * 0.16), bw = w * r[1]; const x = r[0] ? w - bw - 10 : 10; ctx.fillStyle = r[0] ? '#dcf8c6' : '#ffffff'; ctx.beginPath(); ctx.roundRect(x, y, bw, h * 0.12, 8); ctx.fill(); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x + 10, y + h * 0.04, bw - 30, 4); ctx.fillRect(x + 10, y + h * 0.075, bw - 60, 4) })
  },
  pedidos: (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, 26); ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('PEDIDOS DE HOY · 24', 10, 18)
    const st = ['#16a34a', '#f59e0b', '#ef4444', '#16a34a', '#3b82f6', '#16a34a', '#f59e0b']
    for (let i = 0; i < 7; i++) { const y = 34 + i * ((h - 40) / 7); ctx.fillStyle = i % 2 ? '#f8fafc' : '#fff'; ctx.fillRect(0, y, w, (h - 40) / 7); ctx.fillStyle = '#334155'; ctx.fillRect(10, y + 8, 60, 6); ctx.fillRect(84, y + 8, 110, 6); ctx.fillStyle = st[i]; ctx.beginPath(); ctx.roundRect(w - 70, y + 4, 60, 14, 7); ctx.fill() }
  },
  kanban: (ctx, w, h) => {
    ctx.fillStyle = '#f1f3f6'; ctx.fillRect(0, 0, w, h); const cols = ['#64748b', '#3b82f6', '#f59e0b', '#16a34a']
    for (let c = 0; c < 4; c++) { const x = 8 + c * (w / 4); ctx.fillStyle = cols[c]; ctx.fillRect(x, 8, w / 4 - 14, 10); const n = 2 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(x, 26 + i * 36, w / 4 - 14, 28); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x + 6, 34 + i * 36, w / 4 - 40, 5); ctx.fillStyle = cols[c]; ctx.fillRect(x + 6, 44 + i * 36, 18, 5) } }
  },
  pizarra: (ctx, w, h) => {
    ctx.fillStyle = '#fbfbfb'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.25); ctx.lineTo(w * 0.4, h * 0.25); ctx.lineTo(w * 0.3, h * 0.75); ctx.lineTo(w * 0.2, h * 0.75); ctx.closePath(); ctx.stroke()
    ctx.strokeStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.3); ctx.lineTo(w * 0.9, h * 0.3); ctx.moveTo(w * 0.5, h * 0.5); ctx.lineTo(w * 0.85, h * 0.5); ctx.moveTo(w * 0.5, h * 0.7); ctx.lineTo(w * 0.8, h * 0.7); ctx.stroke()
    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('SEMANA · 2 productos', 12, 22)
  },
  madera: (ctx, w, h) => { const base = ['#b98a5e', '#c2956a', '#ad7f55', '#c99e74']; for (let i = 0; i < 6; i++) { ctx.fillStyle = base[i % 4]; ctx.fillRect(0, i * (h / 6), w, h / 6); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, i * (h / 6), w, 2); for (let k = 0; k < 20; k++) { ctx.fillStyle = 'rgba(255,220,180,0.05)'; ctx.fillRect(rnd() * w, i * (h / 6) + rnd() * (h / 6), 40 + rnd() * 80, 1) } } },
  cesped: (ctx, w, h) => { ctx.fillStyle = '#7fb15a'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { ctx.fillStyle = rnd() < 0.5 ? '#6ea04e' : '#8fc168'; ctx.fillRect(rnd() * w, rnd() * h, 3, 3) } },
  piedra: (ctx, w, h) => { ctx.fillStyle = '#bfb39c'; ctx.fillRect(0, 0, w, h); const n = 6; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x0 = i * w / n + (rnd() - 0.5) * 10, y0 = j * h / n + (rnd() - 0.5) * 10; ctx.fillStyle = ['#e6dcc8', '#dcd1bb', '#d2c7b0', '#ebe2d0', '#d8ccb4'][Math.floor(rnd() * 5)]; ctx.beginPath(); ctx.roundRect(x0 + 5, y0 + 5, w / n - 10, h / n - 10, 14); ctx.fill() } },
}

const cache = new Map()
export function textura(nombre, repeat) {
  const key = nombre + (repeat ? repeat.join('x') : '')
  if (!cache.has(key)) { seed = 7 + nombre.length; cache.set(key, canvasTex(384, 240, DIBUJOS[nombre], repeat)) }
  return cache.get(key)
}
export const pantallaMat = (nombre) => new THREE.MeshBasicMaterial({ map: textura(nombre), toneMapped: false })

// Iconos simples para las bandas de los módulos
export function glifo(ctx, kind, cx, cy, r, color) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  switch (kind) {
    case 'lupa': ctx.beginPath(); ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.5, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + r * 0.22, cy + r * 0.22); ctx.lineTo(cx + r * 0.65, cy + r * 0.65); ctx.stroke(); break
    case 'pluma': ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy + r * 0.55); ctx.lineTo(cx + r * 0.35, cy - r * 0.35); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + r * 0.2, cy - r * 0.6); ctx.lineTo(cx + r * 0.65, cy - r * 0.15); ctx.lineTo(cx + r * 0.45, cy - r * 0.45); ctx.closePath(); ctx.fill(); break
    case 'paleta': ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.65, r * 0.52, 0, 0, 6.28); ctx.stroke(); for (const [dx, dy, c] of [[-0.3, -0.2, '#f97316'], [0.05, -0.3, '#22c55e'], [0.35, -0.05, '#3b82f6'], [-0.25, 0.2, '#ef4444']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + dx * r, cy + dy * r, r * 0.11, 0, 6.28); ctx.fill() } break
    case 'claqueta': ctx.fillRect(cx - r * 0.6, cy - r * 0.1, r * 1.2, r * 0.7); ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r * 0.12); ctx.lineTo(cx + r * 0.6, cy - r * 0.12); ctx.lineTo(cx + r * 0.5, cy - r * 0.5); ctx.lineTo(cx - r * 0.7, cy - r * 0.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.08; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - r * 0.55 + i * r * 0.4, cy - r * 0.5); ctx.lineTo(cx - r * 0.4 + i * r * 0.4, cy - r * 0.12); ctx.stroke() } break
    case 'barras': for (let i = 0; i < 3; i++) { const h = [0.5, 0.9, 0.7][i] * r; ctx.fillRect(cx - r * 0.6 + i * r * 0.45, cy + r * 0.5 - h, r * 0.3, h) } break
    case 'caja': ctx.strokeRect(cx - r * 0.5, cy - r * 0.35, r, r * 0.85); ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy - r * 0.1); ctx.lineTo(cx + r * 0.5, cy - r * 0.1); ctx.moveTo(cx, cy - r * 0.35); ctx.lineTo(cx, cy - r * 0.1); ctx.stroke(); break
    case 'chat': ctx.beginPath(); ctx.roundRect(cx - r * 0.6, cy - r * 0.5, r * 1.2, r * 0.85, r * 0.3); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - r * 0.35, cy + r * 0.3); ctx.lineTo(cx - r * 0.5, cy + r * 0.65); ctx.lineTo(cx - r * 0.05, cy + r * 0.35); ctx.fill(); break
    case 'play': ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - r * 0.2, cy - r * 0.32); ctx.lineTo(cx + r * 0.36, cy); ctx.lineTo(cx - r * 0.2, cy + r * 0.32); ctx.closePath(); ctx.fill(); break
    case 'estrella': ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r * 0.7; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) } ctx.closePath(); ctx.fill(); break
    case 'maletin': ctx.fillRect(cx - r * 0.6, cy - r * 0.25, r * 1.2, r * 0.8); ctx.strokeRect(cx - r * 0.25, cy - r * 0.55, r * 0.5, r * 0.3); break
    case 'taza': ctx.beginPath(); ctx.roundRect(cx - r * 0.5, cy - r * 0.3, r * 0.85, r * 0.75, [0, 0, r * 0.25, r * 0.25]); ctx.fill(); ctx.beginPath(); ctx.arc(cx + r * 0.45, cy + r * 0.05, r * 0.22, -1.5, 1.5); ctx.stroke(); break
    case 'gente': for (const [dx, s] of [[-0.42, 0.75], [0, 1], [0.42, 0.75]]) { ctx.beginPath(); ctx.arc(cx + dx * r, cy - r * 0.25 * s, r * 0.2 * s, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.arc(cx + dx * r, cy + r * 0.45, r * 0.35 * s, Math.PI, 0); ctx.fill() } break
    case 'control': ctx.beginPath(); ctx.roundRect(cx - r * 0.65, cy - r * 0.3, r * 1.3, r * 0.6, r * 0.3); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.08, r * 0.08, 0, 6.28); ctx.arc(cx + r * 0.45, cy + r * 0.08, r * 0.08, 0, 6.28); ctx.fill(); ctx.fillRect(cx - r * 0.5, cy - r * 0.05, r * 0.3, r * 0.1); ctx.fillRect(cx - r * 0.4, cy - r * 0.15, r * 0.1, r * 0.3); break
    case 'hoja': ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy + r * 0.55); ctx.quadraticCurveTo(cx - r * 0.6, cy - r * 0.6, cx + r * 0.6, cy - r * 0.6); ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.6, cx - r * 0.55, cy + r * 0.55); ctx.fill(); break
    case 'puerta': ctx.strokeRect(cx - r * 0.4, cy - r * 0.6, r * 0.8, r * 1.2); ctx.beginPath(); ctx.arc(cx + r * 0.2, cy, r * 0.07, 0, 6.28); ctx.fill(); break
    default: ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, 6.28); ctx.fill()
  }
}

// Banda de un módulo: icono, nombre y rol; el texto se encoge hasta caber
export function texturaBanda(name, role, color, icon, { light = false, w = 1400, h = 220 } = {}) {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, w, h)
    const fg = light ? '#2b2420' : '#ffffff'
    ctx.fillStyle = light ? 'rgba(43,36,32,0.08)' : 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(120, h / 2, 74, 0, 6.28); ctx.fill()
    glifo(ctx, icon, 120, h / 2, 60, light ? '#2b2420' : color)
    const fit = (txt, px, weight, maxW) => { let size = px; do { ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`; size -= 4 } while (ctx.measureText(txt).width > maxW && size > 20) }
    ctx.fillStyle = fg; ctx.textBaseline = 'alphabetic'; fit(name.toUpperCase(), 96, 'bold', w - 260); ctx.fillText(name.toUpperCase(), 230, h / 2 + 12)
    ctx.globalAlpha = 0.9; fit(role || '', 44, '500', w - 260); ctx.fillText(role || '', 232, h / 2 + 68); ctx.globalAlpha = 1
  })
}
