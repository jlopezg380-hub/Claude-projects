// Centro de mando: núcleo holográfico (el coordinador) rodeado de estaciones con figuras futuristas.
// Misma interfaz que OfficeScene: constructor(container, {onHover, onSelect}), setCharacters(list),
// arrived(id), select(id), resetView(), dispose(). Añade pulse(fromId, toId, {color, label}).
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const BG = 0x070b14
const CYAN = 0x22d3ee, AMBER = 0xf5b942
const RING_R = 7.4, RESERVE_R = 11, CORE_Y = 2.6
const COMMAND = new THREE.Vector3(0, 0, 6.2)
const LOUNGE = new THREE.Vector3(-7.4, 0, 6.2)
const GLIDE = 3.2

const basic = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra })
const metal = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, ...extra })
const flat = (x, z, y = 0) => new THREE.Vector3(x, y, z)

function makeFigure(look, statusColor) {
  const g = new THREE.Group()
  const body = new THREE.Group()
  g.add(body)
  const torso = look.torso || '#22d3ee'
  const skinMat = metal(torso)
  const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 18), skinMat)
  t.position.y = 0.98
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), basic(look.emblem || look.accent || '#7dd3fc'))
  chest.position.set(0, 1.08, 0.19)
  const armMat = metal(look.arms || torso)
  const arms = {}
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.3, 1.2, 0)
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), armMat)
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.34, 4, 12), armMat)
    arm.position.set(side * 0.03, -0.26, 0)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), basic('#9fb3c8', 0.9))
    hand.position.set(side * 0.03, -0.5, 0)
    pivot.add(sh, arm, hand)
    pivot.rotation.z = side * 0.12
    body.add(pivot)
    arms[side < 0 ? 'L' : 'R'] = pivot
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.175, 26, 18), metal('#0f172a', { metalness: 0.75, roughness: 0.18 }))
  head.position.y = 1.58
  const visorMat = basic(statusColor || '#22d3ee')
  const visor = new THREE.Mesh(new THREE.TorusGeometry(0.178, 0.024, 8, 40, Math.PI * 0.9), visorMat)
  visor.position.set(0, 1.6, 0)
  visor.rotation.set(Math.PI / 2, 0, Math.PI * 0.05)
  const hoverMat = basic(statusColor || '#22d3ee', 0.75)
  const hover = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 40), hoverMat)
  hover.rotation.x = -Math.PI / 2
  hover.position.y = 0.06
  const selMat = basic('#ffffff', 0.0)
  const sel = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 48), selMat)
  sel.rotation.x = -Math.PI / 2
  sel.position.y = 0.05
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 12), basic(AMBER, 0.9))
  cup.position.set(0.03, -0.5, 0.08); cup.visible = false
  arms.R.add(cup)
  const doc = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), basic(CYAN, 0.7, { side: THREE.DoubleSide }))
  doc.position.set(0.03, -0.5, 0.14); doc.rotation.x = -0.4; doc.visible = false
  arms.R.add(doc)
  body.add(t, chest, head, visor)
  g.add(hover, sel)
  g.userData.parts = { body, arms, visorMat, hoverMat, selMat, cup, doc, mats: [skinMat, armMat] }
  g.traverse(o => { if (o.isMesh) o.castShadow = false })
  return g
}

export class CommandScene {
  constructor(container, { onHover, onSelect } = {}) {
    this.container = container
    this.onHover = onHover; this.onSelect = onSelect
    this.chars = new Map(); this.selectedId = null
    this.clock = new THREE.Clock(); this.keys = new Set()
    this.pulses = []; this.stations = []; this.reserveSpots = []; this.deskKeys = []
    const w = container.clientWidth, h = container.clientHeight
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(BG, 1)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(w, h)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)

    this.labels = new CSS2DRenderer()
    this.labels.setSize(w, h)
    Object.assign(this.labels.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' })
    container.appendChild(this.labels.domElement)

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(BG, 0.022)
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 300)
    this.userMoved = false
    this.camera.position.copy(this.homePosition())
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.06, enablePan: false, minDistance: 7, maxDistance: 44, minPolarAngle: 0.45, maxPolarAngle: 1.38, autoRotate: !reduced, autoRotateSpeed: 0.3 })
    this.controls.target.set(0, 1.2, 0)
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; this.userMoved = true })

    this.scene.add(new THREE.HemisphereLight(0x27456b, 0x02050a, 0.9))
    const key = new THREE.DirectionalLight(0xcfe3ff, 0.9); key.position.set(6, 14, 8); this.scene.add(key)
    const fill = new THREE.DirectionalLight(0x8fb3ff, 0.35); fill.position.set(-8, 6, 14); this.scene.add(fill)
    this.coreLight = new THREE.PointLight(CYAN, 60, 40, 1.8); this.coreLight.position.set(0, CORE_Y, 0); this.scene.add(this.coreLight)
    const cmdLight = new THREE.PointLight(AMBER, 12, 14, 2); cmdLight.position.set(COMMAND.x, 2.2, COMMAND.z); this.scene.add(cmdLight)

    this.world = new THREE.Group(); this.scene.add(this.world)
    this.charGroup = new THREE.Group(); this.scene.add(this.charGroup)
    this.fxGroup = new THREE.Group(); this.scene.add(this.fxGroup)
    this.buildFloor(); this.buildCore(); this.buildCommand(); this.buildLounge(); this.buildStars()

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.95, 0.55, 0.32)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())

    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.downAt = null
    const el = this.renderer.domElement
    this._onMove = (e) => this.handlePointer(e, false)
    this._onDown = (e) => { this.downAt = [e.clientX, e.clientY] }
    this._onUp = (e) => { if (e.button === 0 && this.downAt && Math.hypot(e.clientX - this.downAt[0], e.clientY - this.downAt[1]) < 6) this.handlePointer(e, true); this.downAt = null }
    this._onLeave = () => this.onHover?.(null)
    el.addEventListener('pointermove', this._onMove); el.addEventListener('pointerdown', this._onDown)
    el.addEventListener('pointerup', this._onUp); el.addEventListener('pointerleave', this._onLeave)
    const typing = () => { const a = document.activeElement; return a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable) }
    const KEYS = { q: 'rotL', e: 'rotR', arrowleft: 'rotL', arrowright: 'rotR', '+': 'in', '=': 'in', '-': 'out', arrowup: 'in', arrowdown: 'out', r: 'reset' }
    this._onKeyDown = (e) => { const k = KEYS[e.key.toLowerCase()]; if (!k || typing()) return; if (k === 'reset') return this.resetView(); this.keys.add(k); this.controls.autoRotate = false; if (e.key.startsWith('Arrow')) e.preventDefault() }
    this._onKeyUp = (e) => { const k = KEYS[e.key.toLowerCase()]; if (k) this.keys.delete(k) }
    window.addEventListener('keydown', this._onKeyDown); window.addEventListener('keyup', this._onKeyUp)
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container)
    this.running = true; this.animate = this.animate.bind(this); requestAnimationFrame(this.animate)
  }

  buildFloor() {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 72), new THREE.MeshStandardMaterial({ color: 0x0a1120, roughness: 0.95, metalness: 0.1 }))
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; this.world.add(floor)
    const grid = new THREE.GridHelper(90, 90, 0x173a52, 0x0f2a3d)
    grid.material.transparent = true; grid.material.opacity = 0.32; grid.position.y = 0.005; this.world.add(grid)
    const ring = new THREE.Mesh(new THREE.RingGeometry(RING_R - 0.04, RING_R + 0.04, 160), basic(0x1e6fa5, 0.45))
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; this.world.add(ring)
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(RESERVE_R - 0.03, RESERVE_R + 0.03, 180), basic(0x334155, 0.35))
    ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.02; this.world.add(ring2)
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.06, i % 3 === 0 ? 0.5 : 0.25), basic(0x1e6fa5, 0.5, { side: THREE.DoubleSide }))
      tick.rotation.x = -Math.PI / 2; tick.rotation.z = -a
      tick.position.set(Math.cos(a) * (RING_R + 0.5), 0.02, Math.sin(a) * (RING_R + 0.5))
      this.world.add(tick)
    }
  }

  buildCore() {
    const g = new THREE.Group(); this.world.add(g); this.coreGroup = g
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.3, 0.28, 72), metal(0x0f1b2e, { metalness: 0.85, roughness: 0.3 }))
    dais.position.y = 0.14; g.add(dais)
    const step = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 4.1, 0.12, 72), metal(0x0b1424, { metalness: 0.8, roughness: 0.4 }))
    step.position.y = 0.06; g.add(step)
    const glow = new THREE.Mesh(new THREE.RingGeometry(3.05, 3.32, 72), basic(CYAN, 0.8)); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.29; g.add(glow)
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(1.2 + i * 0.55, 1.26 + i * 0.55, 96), basic(CYAN, 0.18 + i * 0.05)); r.rotation.x = -Math.PI / 2; r.position.y = 0.3; g.add(r)
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, CORE_Y - 0.3, 24, 1, true), basic(CYAN, 0.35, { side: THREE.DoubleSide }))
    beam.position.y = (CORE_Y - 0.3) / 2 + 0.3; g.add(beam)
    const core = new THREE.Group(); core.position.y = CORE_Y; g.add(core); this.core = core
    this.coreMat = new THREE.MeshStandardMaterial({ color: 0x083344, emissive: CYAN, emissiveIntensity: 2.2, roughness: 0.3 })
    core.add(new THREE.Mesh(new THREE.SphereGeometry(0.72, 48, 32), this.coreMat))
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), basic(0x7dd3fc, 0.3, { wireframe: true })); core.add(shell); this.shell = shell
    const shell2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1), basic(CYAN, 0.12, { wireframe: true })); core.add(shell2); this.shell2 = shell2
    this.rings = []
    const ringSpecs = [[1.7, 0.028, CYAN, [0.9, 0, 0.3]], [2.05, 0.022, 0x7dd3fc, [0.3, 0.8, 0]], [2.4, 0.018, AMBER, [1.2, 0.4, 0.9]]]
    for (const [rad, tube, col, rot] of ringSpecs) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, tube, 10, 120), basic(col, 0.9))
      ring.rotation.set(rot[0], rot[1], rot[2]); core.add(ring); this.rings.push(ring)
    }
    const n = 700, pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 1.4 + Math.random() * 1.9, y = (Math.random() - 0.5) * 1.1
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * r
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9ae6ff, size: 0.045, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }))
    core.add(this.particles)
    const labelEl = document.createElement('div'); labelEl.className = 'hud-label hud-core'
    const label = new CSS2DObject(labelEl); label.position.set(0, 2.7, 0); core.add(label)
    this.coreLabelEl = labelEl; this.coreLabel = label; labelEl.style.display = 'none'
  }

  buildCommand() {
    const g = new THREE.Group(); g.position.copy(COMMAND); this.world.add(g)
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.3, 48), metal(0x16213a, { metalness: 0.8, roughness: 0.35 })); dais.position.y = 0.15; g.add(dais)
    const glow = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.55, 48), basic(AMBER, 0.7)); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.31; g.add(glow)
    const console_ = this.holoConsole(1.9, 0.9, AMBER, 0.14); console_.position.set(0, 1.35, -1.25); console_.rotation.x = -0.25; g.add(console_)
    this.commandConsole = console_
  }

  buildLounge() {
    const g = new THREE.Group(); g.position.copy(LOUNGE); this.world.add(g)
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.12, 6), metal(0x111a2c, { metalness: 0.7, roughness: 0.45 })); pad.position.y = 0.06; g.add(pad)
    const glow = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.55, 6), basic(AMBER, 0.45)); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.13; g.add(glow)
    const el = document.createElement('div'); el.className = 'hud-zone'; el.textContent = 'ZONA DE DESCANSO'
    const label = new CSS2DObject(el); label.position.set(0, 0.2, 0); g.add(label)
  }

  buildStars() {
    const n = 1600, pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const u = Math.random(), v = Math.random(), th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1), r = 90 + Math.random() * 40
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.6 + 2; pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xbfd7ff, size: 0.35, transparent: true, opacity: 0.55, depthWrite: false, fog: false }))
    this.scene.add(this.stars)
  }

  holoConsole(w, h, color, opacity) {
    const g = new THREE.Group()
    const mat = basic(color, opacity, { side: THREE.DoubleSide })
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); g.add(pane)
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })); g.add(edges)
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(w * (0.35 + Math.random() * 0.45), 0.035), basic(color, 0.6, { side: THREE.DoubleSide }))
      bar.position.set(-w / 2 + bar.geometry.parameters.width / 2 + 0.08, h / 2 - 0.12 - i * 0.14, 0.01); g.add(bar)
    }
    g.userData.mat = mat
    return g
  }

  ensureStations(count) {
    const n = Math.max(6, count)
    if (this.stations.length === n) return
    for (const s of this.stations) this.world.remove(s.group)
    this.stations = []
    for (let i = 0; i < n; i++) {
      const gap = Math.PI * 0.2
      const a = Math.PI * 0.5 + gap + (n > 1 ? i * (Math.PI * 2 - 2 * gap) / (n - 1) : 0) // deja libre el sur, donde está el puesto de mando
      const x = Math.cos(a) * RING_R, z = Math.sin(a) * RING_R
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z) // mira al núcleo
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.02, 0.1, 6), metal(0x101a2e, { metalness: 0.8, roughness: 0.4 })); pad.position.y = 0.05; g.add(pad)
      const glowMat = basic(0x38bdf8, 0.7)
      const glow = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.1, 6), glowMat); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.11; g.add(glow)
      const cons = this.holoConsole(1.3, 0.75, CYAN, 0.12); cons.position.set(0, 1.3, 1.05); cons.rotation.x = 0.2; g.add(cons)
      this.world.add(g)
      this.stations.push({ group: g, pos: new THREE.Vector3(x, 0, z), rot: g.rotation.y, glowMat, cons })
    }
    const m = Math.max(4, count)
    this.reserveSpots = []
    for (let i = 0; i < m; i++) {
      const a = Math.PI * 1.15 + (i / m) * Math.PI * 0.7
      this.reserveSpots.push({ pos: new THREE.Vector3(Math.cos(a) * RESERVE_R, 0, Math.sin(a) * RESERVE_R), rot: Math.atan2(-Math.cos(a), -Math.sin(a)) })
    }
  }

  spotFor(place, list) {
    switch (place.type) {
      case 'coordinator': return null
      case 'office': { const off = [0, -1.7, 1.7][(place.index || 0) % 3]; return { pos: COMMAND.clone().add(flat(off, 0)), rot: Math.PI, station: null, seatY: 0.3 } }
      case 'kitchen': case 'bathroom': return { pos: LOUNGE.clone().add(flat((place.index || 0) * 0.9 - 0.45, 0)), rot: Math.atan2(-LOUNGE.x, -LOUNGE.z), station: null, seatY: 0.12 }
      case 'garden': { const s = this.reserveSpots[(place.index || 0) % this.reserveSpots.length]; return { pos: s.pos.clone(), rot: s.rot, station: null, seatY: 0 } }
      case 'visit': {
        const target = this.chars.get(place.targetId)
        const tp = target ? target.root.position.clone() : new THREE.Vector3(0, 0, 3.4)
        const toCore = tp.clone().setY(0); const len = toCore.length(); if (len > 1e-3) toCore.multiplyScalar(-1 / len)
        const pos = target ? tp.clone().add(toCore.multiplyScalar(1.3)) : tp
        return { pos, rot: target ? Math.atan2(tp.x - pos.x, tp.z - pos.z) : Math.PI, station: null, seatY: 0 }
      }
      default: { const k = `${place.zone || ''}:${place.index || 0}`; let i = this.deskKeys.indexOf(k); if (i < 0) { this.deskKeys.push(k); i = this.deskKeys.length - 1 }
        const s = this.stations[i % this.stations.length]; return { pos: s.pos.clone(), rot: s.rot, station: s, seatY: 0.1 } }
    }
  }

  setCharacters(list) {
    const labCount = list.filter(c => !['coordinator', 'office'].includes(c.place.type)).length
    this.ensureStations(labCount)
    const seen = new Set()
    this.coordinatorId = list.find(c => c.place.type === 'coordinator')?.id || null
    for (const s of this.stations) s.busy = false
    for (const c of list) {
      seen.add(c.id)
      if (c.place.type === 'coordinator') {
        this.coreLabelEl.style.display = ''
        this.coreLabelEl.innerHTML = `<span class="hud-dot" style="background:${c.statusColor}"></span>${c.name}<span class="hud-sub">NÚCLEO</span>`
        this.coreStatus = c.statusColor; this.coreActivity = c.activity
        continue
      }
      let ch = this.chars.get(c.id)
      const lookKey = JSON.stringify(c.look)
      if (ch && ch.lookKey !== lookKey) { this.removeChar(c.id); ch = null }
      const spot = this.spotFor(c.place, list)
      const placeKey = `${c.place.type}:${c.place.index}:${c.place.targetId || ''}`
      if (!ch) {
        const root = makeFigure(c.look, c.statusColor)
        root.userData.charId = c.id
        const labelEl = document.createElement('div'); labelEl.className = 'hud-label'
        const label = new CSS2DObject(labelEl); label.position.set(0, 2.05, 0); root.add(label)
        root.position.copy(spot.pos); root.rotation.y = spot.rot; root.scale.setScalar(1.18)
        this.charGroup.add(root)
        ch = { root, labelEl, lookKey, placeKey, spot, phase: Math.random() * 6 }
        this.chars.set(c.id, ch)
      } else if (ch.placeKey !== placeKey) { ch.placeKey = placeKey; ch.spot = spot }
      ch.activity = c.activity; ch.place = c.place; ch.statusColor = c.statusColor
      const p = ch.root.userData.parts
      p.visorMat.color.set(c.statusColor); p.hoverMat.color.set(c.statusColor)
      if (spot.station) { spot.station.busy = true; spot.station.glowMat.color.set(c.statusColor); spot.station.activity = c.activity }
      const dim = c.activity === 'relax'
      for (const m of p.mats) { m.transparent = dim; m.opacity = dim ? 0.55 : 1 }
      ch.labelEl.innerHTML = `<span class="hud-dot" style="background:${c.statusColor}"></span>${c.name}`
      ch.labelEl.classList.toggle('is-dim', dim)
    }
    for (const s of this.stations) if (!s.busy) { s.glowMat.color.set(0x1e3a5f); s.activity = null }
    for (const id of [...this.chars.keys()]) if (!seen.has(id)) this.removeChar(id)
    this.applySelection()
  }

  posOf(id) {
    if (id === this.coordinatorId) return new THREE.Vector3(0, CORE_Y, 0)
    const ch = this.chars.get(id); if (!ch) return null
    return ch.root.position.clone().add(new THREE.Vector3(0, 1.45, 0))
  }

  // Pulso de luz entre dos puntos (tarea asignada o entregada), con etiqueta opcional
  pulse(fromId, toId, { color = CYAN, label = '', duration = 1.6 } = {}) {
    const a = this.posOf(fromId), b = this.posOf(toId)
    if (!a || !b) return
    const mid = a.clone().lerp(b, 0.5); mid.y += 2.2 + a.distanceTo(b) * 0.12
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
    const pts = curve.getPoints(48)
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat)
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), basic(color, 1))
    const trail = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), basic(color, 0.25))
    orb.add(trail)
    let labelObj = null
    if (label) { const el = document.createElement('div'); el.className = 'hud-pulse'; el.textContent = label; el.style.borderColor = '#' + new THREE.Color(color).getHexString(); labelObj = new CSS2DObject(el); labelObj.position.set(0, 0.35, 0); orb.add(labelObj) }
    this.fxGroup.add(line, orb)
    this.pulses.push({ curve, line, lineMat, orb, labelObj, t: 0, duration, fade: 0.6 })
  }

  arrived(id) {
    const ch = this.chars.get(id); if (!ch) return true
    return ch.root.position.distanceTo(ch.spot.pos) < 0.15
  }
  removeChar(id) {
    const ch = this.chars.get(id); if (!ch) return
    ch.labelEl.remove(); this.charGroup.remove(ch.root)
    ch.root.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(m => m.dispose()) } })
    this.chars.delete(id)
  }
  select(id, focus = true) { this.selectedId = id; this.applySelection() }
  applySelection() {
    for (const [id, ch] of this.chars) ch.root.userData.parts.selMat.opacity = id === this.selectedId ? 0.9 : 0
    this.shell.material.opacity = this.selectedId && this.selectedId === this.coordinatorId ? 0.7 : 0.3
  }
  hitCharacter(e) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects([...this.charGroup.children, this.core], true)
    for (const h of hits) {
      let o = h.object
      while (o && !o.userData.charId && o !== this.core) o = o.parent
      if (o === this.core) return this.coordinatorId
      if (o) return o.userData.charId
    }
    return null
  }
  handlePointer(e, isClick) {
    if (!isClick && e.buttons) return
    const id = this.hitCharacter(e)
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'
    if (isClick) { if (id) this.onSelect?.(id) } else this.onHover?.(id, e.clientX, e.clientY)
  }
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight
    if (!w || !h) return
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h); this.composer.setSize(w, h); this.labels.setSize(w, h)
    if (!this.userMoved) this.camera.position.copy(this.homePosition())
  }
  homePosition() { const aspect = this.camera.aspect || 1; const k = aspect < 1.2 ? Math.min(1.9, 1.2 / aspect) : 1; return new THREE.Vector3(0, 9.6 * k, 16.8 * k) }
  resetView() { this.userMoved = false; this.camera.position.copy(this.homePosition()); this.controls.target.set(0, 1.2, 0); this.controls.autoRotate = true }

  animateChar(ch, dt, t) {
    const p = ch.root.userData.parts
    const root = ch.root, target = ch.spot.pos
    const d = root.position.distanceTo(target)
    const moving = d > 0.05
    if (moving) {
      const step = Math.min(d, GLIDE * dt)
      root.position.lerp(target, step / d)
      const dir = target.clone().sub(root.position)
      if (dir.lengthSq() > 1e-4) { const want = Math.atan2(dir.x, dir.z); let diff = want - root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); root.rotation.y += diff * Math.min(1, dt * 8) }
    } else {
      let diff = ch.spot.rot - root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); root.rotation.y += diff * Math.min(1, dt * 6)
    }
    const bob = Math.sin(t * 1.6 + ch.phase) * 0.035
    p.body.position.y = (ch.spot.seatY || 0) + 0.08 + bob + (moving ? 0.12 : 0)
    p.cup.visible = ch.activity === 'drink' && !moving
    p.doc.visible = ch.activity === 'carry' || moving
    const { L, R } = p.arms
    switch (moving ? 'carry' : ch.activity) {
      case 'typing': L.rotation.x = -1.05 + Math.sin(t * 14 + ch.phase) * 0.08; R.rotation.x = -1.05 + Math.sin(t * 14 + ch.phase + 1.9) * 0.08; break
      case 'drink': L.rotation.x = -0.2; R.rotation.x = -1.9 + Math.sin(t * 1.3 + ch.phase) * 0.15; break
      case 'carry': L.rotation.x = -0.25; R.rotation.x = -1.2; break
      case 'paused': L.rotation.x = -0.9; R.rotation.x = -0.9; break
      case 'relax': L.rotation.x = 0.1 + Math.sin(t * 0.9 + ch.phase) * 0.04; R.rotation.x = 0.1 - Math.sin(t * 0.9 + ch.phase) * 0.04; break
      default: L.rotation.x = Math.sin(t * 1.2 + ch.phase) * 0.08 - 0.15; R.rotation.x = -Math.sin(t * 1.2 + ch.phase) * 0.08 - 0.15
    }
    p.visorMat.opacity = ch.activity === 'relax' ? 0.5 : 0.85 + Math.sin(t * 3 + ch.phase) * 0.15
    p.visorMat.transparent = true
  }

  animate() {
    if (!this.running) return
    requestAnimationFrame(this.animate)
    const dtReal = this.clock.getDelta(), dt = Math.min(dtReal, 0.05), t = this.clock.elapsedTime
    if (this.keys.size) {
      const rot = (this.keys.has('rotR') ? 1 : 0) - (this.keys.has('rotL') ? 1 : 0)
      if (rot) { const off = this.camera.position.clone().sub(this.controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot * dt * 1.1); this.camera.position.copy(this.controls.target).add(off) }
      const zoom = (this.keys.has('in') ? -1 : 0) + (this.keys.has('out') ? 1 : 0)
      if (zoom) { const off = this.camera.position.clone().sub(this.controls.target); const len = THREE.MathUtils.clamp(off.length() * (1 + zoom * dt * 0.9), this.controls.minDistance, this.controls.maxDistance); this.camera.position.copy(this.controls.target).add(off.setLength(len)) }
    }
    // núcleo
    this.core.rotation.y += dt * 0.25
    this.shell.rotation.y -= dt * 0.35; this.shell.rotation.x += dt * 0.1
    this.shell2.rotation.y += dt * 0.12; this.shell2.rotation.z += dt * 0.07
    this.rings[0].rotation.z += dt * 0.6; this.rings[1].rotation.x += dt * 0.45; this.rings[2].rotation.y += dt * 0.3
    this.particles.rotation.y += dt * 0.18
    const pulse = 1.9 + Math.sin(t * 2.2) * 0.35 + (this.coreActivity === 'typing' ? 0.5 : 0)
    this.coreMat.emissiveIntensity = pulse; this.coreLight.intensity = 50 + Math.sin(t * 2.2) * 12
    this.core.position.y = CORE_Y + Math.sin(t * 1.1) * 0.08
    this.stars.rotation.y += dt * 0.004
    for (const s of this.stations) s.cons.userData.mat.opacity = s.activity === 'typing' ? 0.12 + Math.abs(Math.sin(t * 6 + s.pos.x)) * 0.12 : 0.08
    this.commandConsole.userData.mat.opacity = 0.12 + Math.abs(Math.sin(t * 2)) * 0.06
    for (const ch of this.chars.values()) this.animateChar(ch, dt, t)
    for (const pz of [...this.pulses]) {
      pz.t += Math.min(dtReal, 0.25)
      const k = Math.min(1, pz.t / pz.duration)
      pz.orb.position.copy(pz.curve.getPoint(k))
      pz.lineMat.opacity = k < 1 ? 0.55 * Math.min(1, k * 4) : Math.max(0, 0.55 * (1 - (pz.t - pz.duration) / pz.fade))
      if (k >= 1) { pz.orb.visible = false }
      if (pz.t > pz.duration + pz.fade) { this.fxGroup.remove(pz.line, pz.orb); pz.line.geometry.dispose(); pz.lineMat.dispose(); pz.orb.geometry.dispose(); pz.labelObj?.element.remove(); this.pulses.splice(this.pulses.indexOf(pz), 1) }
    }
    this.controls.update()
    this.composer.render()
    this.labels.render(this.scene, this.camera)
  }

  dispose() {
    this.running = false; this.resizeObserver.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointermove', this._onMove); el.removeEventListener('pointerdown', this._onDown)
    el.removeEventListener('pointerup', this._onUp); el.removeEventListener('pointerleave', this._onLeave)
    window.removeEventListener('keydown', this._onKeyDown); window.removeEventListener('keyup', this._onKeyUp)
    this.controls.dispose()
    this.scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine) { o.geometry?.dispose(); [].concat(o.material || []).forEach(m => m?.dispose?.()) } })
    this.composer.dispose?.(); this.renderer.dispose(); el.remove(); this.labels.domElement.remove()
  }
}
