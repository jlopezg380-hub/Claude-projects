// Campus de módulos: oficina 3D al aire libre con modelos CC0 (Kenney, KayKit, Quaternius).
// Misma interfaz que OfficeScene: constructor(container, {onHover, onSelect}), setCharacters(list),
// arrived(id), select(id, focus), resetView(), dispose(). Cada agente ocupa un módulo con el nombre y el rol en la banda,
// el coordinador el pabellón central y la dirección la oficina de vidrio. Los personajes caminan por el campus con A*.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { NavGrid } from './navgrid.js'
import { Modelos } from './modelos.js'
import { Personaje, modeloPara, ALTURA } from './personaje.js'
import { canvasTex, textura, pantallaMat, texturaBanda } from './pantallas.js'

const B = { x0: -19, z0: -15.5, x1: 19, z1: 15.5 }
const WALK_SPEED = 1.9
const W = 34, D = 27
let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

// ---------- utilidades de geometría ----------
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...extra })
function add(parent, geo, mat, x, y, z, { rx = 0, ry = 0, rz = 0, cast = true, recv = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m
}
const box = (p, w, h, d, mat, x, y, z, o) => add(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z, o)
const rbox = (p, w, h, d, mat, x, y, z, o = {}, r = 0.06) => add(p, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z, o)
const cyl = (p, rt, rb, h, mat, x, y, z, o, seg = 20) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, o)
const sph = (p, r, mat, x, y, z, o) => add(p, new THREE.SphereGeometry(r, 18, 12), mat, x, y, z, o)
function sector(rIn, rOut, a0, a1, h, mat) {
  const s = new THREE.Shape(); s.absarc(0, 0, rOut, a0, a1, false); s.absarc(0, 0, rIn, a1, a0, true)
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 18 }); geo.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m
}
const lighten = (hex, k) => { const c = new THREE.Color(hex); c.lerp(new THREE.Color('#ffffff'), k); return '#' + c.getHexString() }
function colorBanda(hex) { const c = new THREE.Color(hex || '#3d5a99'); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, Math.max(0.3, Math.min(0.75, hsl.s)), Math.min(0.36, hsl.l)); return '#' + c.getHexString() }

const MAT = {
  cream: std('#f6f1e8', { roughness: 0.9 }), rim: std('#ffffff', { roughness: 0.8 }), post: std('#3a3632', { roughness: 0.7 }), metal: std('#6b6f76', { metalness: 0.5, roughness: 0.4 }),
  dark: std('#2b2f36'), wood: std('#c99a66'), woodDark: std('#8a5a3a'), soil: std('#5b4330', { roughness: 1 }), water: new THREE.MeshPhysicalMaterial({ color: 0x4fa3c7, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.88 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: 0.05, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  bulb: new THREE.MeshBasicMaterial({ color: '#ffd38a' }), leaf: std('#4f9a4a'), leaf3: std('#7cc06a'),
}

// Tema del módulo según el rol del agente
export function temaDe(role = '') {
  const r = role.toLowerCase()
  if (/cazador|producto|radar|investig/.test(r)) return 'radar'
  if (/guion|estrateg|copy|redes/.test(r)) return 'pluma'
  if (/arte|dise|imagen|visual/.test(r)) return 'lienzo'
  if (/v[ií]deo|productor|rodaje/.test(r)) return 'rodaje'
  if (/editor|montaj|corte/.test(r)) return 'corte'
  if (/whatsapp|vend|venta|cliente|lanzam/.test(r)) return 'cierre'
  if (/operaci|pedido|bodega|log[ií]st/.test(r)) return 'bodega'
  if (/anal|anuncio|ads|m[eé]trica|rendimiento/.test(r)) return 'metrica'
  return 'generico'
}
const ICONOS = { radar: 'lupa', pluma: 'pluma', lienzo: 'paleta', rodaje: 'claqueta', corte: 'play', cierre: 'chat', bodega: 'caja', metrica: 'barras', generico: 'estrella' }

// Módulos de agentes: 8 posiciones alrededor de la plaza (fila norte y laterales)
const PODS_LAB = [{ x: -12, z: -10 }, { x: -4, z: -10 }, { x: 4, z: -10 }, { x: 12, z: -10 }, { x: -12, z: -4 }, { x: 12.5, z: -4 }, { x: -12, z: 2.2 }, { x: 12.5, z: 2.2 }]
const NOVA = { x: -2.5, z: -3.6 }, DIRECCION = { x: 5.5, z: -4 }, SALA = { x: -3.0, z: 8.6 }, CAFE = { x: -11.5, z: 8.6 }, DESCANSO = { x: 5.5, z: 8.6 }, TERRAZA = { x: 12.5, z: 8.6 }

// Modelos que el campus necesita antes de construirse
const LISTA = [
  'kenney:desk', 'kenney:chairdesk', 'kenney:chair', 'kenney:chaircushion', 'kenney:chairrounded', 'kenney:stoolbar', 'kenney:laptop', 'kenney:computerscreen', 'kenney:computerkeyboard', 'kenney:televisionmodern', 'kenney:cabinettelevision',
  'kenney:bookcaseopen', 'kenney:bookcaseopenlow', 'kenney:books', 'kenney:plantsmall1', 'kenney:plantsmall2', 'kenney:plantsmall3', 'kenney:pottedplant', 'kenney:lamproundfloor', 'kenney:lamproundtable', 'kenney:lampsquarefloor',
  'kenney:loungesofa', 'kenney:loungechair', 'kenney:loungechairrelax', 'kenney:tablecoffee', 'kenney:tableround', 'kenney:kitchencoffeemachine', 'kenney:kitchenfridge', 'kenney:kitchenbar', 'kenney:kitchenbarend', 'kenney:kitchenmicrowave',
  'kenney:speakersmall', 'kenney:radio', 'kenney:cardboardboxclosed', 'kenney:cardboardboxopen', 'kenney:rugrectangle', 'kenney:ruground', 'kenney:rugrounded', 'kenney:pillow', 'kenney:pillowblue', 'kenney:sidetable', 'kenney:coatrackstanding', 'kenney:trashcan', 'kenney:doorway', 'kenney:bench',
  'kaykit:couch', 'kaykit:couch-pillows', 'kaykit:armchair-pillows', 'kaykit:shelf-b-small-decorated', 'kaykit:shelf-b-large-decorated', 'kaykit:shelf-a-small', 'kaykit:cabinet-small-decorated', 'kaykit:lamp-standing', 'kaykit:table-low', 'kaykit:cactus-medium-a', 'kaykit:book-set', 'kaykit:pictureframe-standing-a', 'kaykit:rug-oval-a',
  'naturaleza:tree-default', 'naturaleza:tree-detailed', 'naturaleza:tree-fat', 'naturaleza:tree-oak', 'naturaleza:tree-tall', 'naturaleza:tree-palm', 'naturaleza:tree-palmdetailedshort', 'naturaleza:plant-bush', 'naturaleza:plant-bushdetailed', 'naturaleza:plant-bushlarge', 'naturaleza:plant-bushsmall', 'naturaleza:plant-flattall',
  'naturaleza:flower-purplea', 'naturaleza:flower-reda', 'naturaleza:flower-yellowa', 'naturaleza:grass', 'naturaleza:grass-large', 'naturaleza:rock-smalla', 'naturaleza:rock-smallb', 'naturaleza:rock-smallflata', 'naturaleza:stone-smalla', 'naturaleza:bridge-woodround', 'naturaleza:campfire-stones', 'naturaleza:lily-large', 'naturaleza:lily-small', 'naturaleza:pot-large', 'naturaleza:pot-small', 'naturaleza:log', 'naturaleza:stump-round',
  'kaykitCiudad:streetlight.gltf', 'kaykitCiudad:bench.gltf', 'ciudad:planter', 'personajes:Pug',
]

export class CampusScene {
  constructor(container, { onHover, onSelect, modelosBase = '/modelos/' } = {}) {
    this.container = container; this.onHover = onHover; this.onSelect = onSelect; this.modelosBase = modelosBase
    this.chars = new Map(); this.selectedId = null; this.hoverId = null
    this.timer = new THREE.Timer(); this.keys = new Set(); this.mixers = []; this.lamparas = []
    this.listo = false; this.pendientes = null
    const w = container.clientWidth, h = container.clientHeight
    this.highQuality = window.__campusCalidad ? window.__campusCalidad === 'alta' : window.innerWidth > 900

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.highQuality ? 1.75 : 1.25))
    this.renderer.setSize(w, h); this.renderer.setClearColor(0x9fbf7a, 1)
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0
    container.appendChild(this.renderer.domElement)
    this.labels = new CSS2DRenderer(); this.labels.setSize(w, h)
    Object.assign(this.labels.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' })
    container.appendChild(this.labels.domElement)
    this.overlay = document.createElement('div'); this.overlay.className = 'office-loading'; this.overlay.textContent = 'Cargando el campus…'; container.appendChild(this.overlay)

    this.scene = new THREE.Scene(); this.scene.fog = new THREE.Fog(0xcfd9b8, 55, 110)
    this.camera = new THREE.PerspectiveCamera(39, w / h, 0.1, 300)
    this.home = { pos: new THREE.Vector3(0, 26, 21.5), target: new THREE.Vector3(0, 0, -0.8) }
    this.camera.position.copy(this.home.pos)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, screenSpacePanning: false, minDistance: 8, maxDistance: 48, minPolarAngle: 0.3, maxPolarAngle: 1.25, zoomToCursor: false })
    this.controls.target.copy(this.home.target)
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
    this.targetFocus = null

    this.scene.add(new THREE.HemisphereLight(0xffe3c6, 0x7f8f6a, 0.95))
    const sun = new THREE.DirectionalLight(0xffc999, 1.45); sun.position.set(18, 20, 14); sun.castShadow = true
    sun.shadow.mapSize.set(this.highQuality ? 4096 : 2048, this.highQuality ? 4096 : 2048)
    Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04
    this.scene.add(sun)
    const fill = new THREE.DirectionalLight(0xc9d6ff, 0.45); fill.position.set(-14, 16, -8); this.scene.add(fill)

    this.nav = new NavGrid(B.x0, B.z0, B.x1, B.z1, 0.25)
    this.world = new THREE.Group(); this.scene.add(this.world)
    this.charGroup = new THREE.Group(); this.scene.add(this.charGroup)
    this.modelos = new Modelos(this.modelosBase)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    if (this.highQuality) {
      this.gtao = new GTAOPass(this.scene, this.camera, w, h)
      this.gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1, scale: 1 }); this.gtao.blendIntensity = 0.75
      this.composer.addPass(this.gtao)
    }
    this.composer.addPass(new OutputPass())

    // Interacción
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.downAt = null
    const el = this.renderer.domElement
    this._onMove = (e) => this.handlePointer(e, false)
    this._onDown = (e) => { this.downAt = [e.clientX, e.clientY] }
    this._onUp = (e) => { if (e.button === 0 && this.downAt && Math.hypot(e.clientX - this.downAt[0], e.clientY - this.downAt[1]) < 6) this.handlePointer(e, true); this.downAt = null }
    this._onLeave = () => { this.setHover(null); this.onHover?.(null) }
    this._onContext = (e) => e.preventDefault()
    el.addEventListener('pointermove', this._onMove); el.addEventListener('pointerdown', this._onDown); el.addEventListener('pointerup', this._onUp); el.addEventListener('pointerleave', this._onLeave); el.addEventListener('contextmenu', this._onContext)
    const typing = () => { const a = document.activeElement; return a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable) || document.querySelector('.modal-overlay') }
    const KEYS = { w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', q: 'rotL', e: 'rotR', '+': 'in', '=': 'in', '-': 'out', r: 'reset' }
    this._onKeyDown = (e) => { const k = KEYS[e.key.toLowerCase()]; if (!k || typing()) return; if (k === 'reset') return this.resetView(); this.keys.add(k); if (e.key.startsWith('Arrow')) e.preventDefault() }
    this._onKeyUp = (e) => { const k = KEYS[e.key.toLowerCase()]; if (k) this.keys.delete(k) }
    this._onBlur = () => this.keys.clear()
    window.addEventListener('keydown', this._onKeyDown); window.addEventListener('keyup', this._onKeyUp); window.addEventListener('blur', this._onBlur)
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container)

    this.running = true; this.animate = this.animate.bind(this); requestAnimationFrame(this.animate)
    this.cargar()
  }

  async cargar() {
    await this.modelos.precargar(LISTA, (n, t) => { this.overlay.textContent = `Cargando el campus… ${Math.round(n / t * 100)} %` })
    if (!this.running) return
    this.construir()
    this.listo = true
    this.overlay.remove()
    if (this.pendientes) { const l = this.pendientes; this.pendientes = null; this.setCharacters(l) }
  }

  // ---------- construcción del campus ----------
  construir() {
    const g = this.world, M = this.modelos
    const inst = (nombre, x, z, o = {}) => { const m = M.instancia(nombre, o); m.position.set(x, o.y || 0, z); m.rotation.y = o.ry || 0; g.add(m); return m }
    this.inst = inst
    // suelo: césped alrededor, losa de piedra
    add(g, new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: textura('cesped', [48, 48]), roughness: 1 }), 0, -0.05, 0, { rx: -Math.PI / 2, cast: false })
    add(g, new RoundedBoxGeometry(W, 0.3, D, 4, 0.5), new THREE.MeshStandardMaterial({ map: textura('piedra', [22, 17]), roughness: 0.9 }), 0, -0.15, 0, { cast: false })
    add(g, new RoundedBoxGeometry(W + 0.8, 0.22, D + 0.8, 4, 0.5), std('#cdbfa6', { roughness: 0.9 }), 0, -0.27, 0, { cast: false })

    // módulos de agentes (etiqueta provisional; se completa cuando llegan los agentes)
    this.podsLab = PODS_LAB.map((p, i) => this.pod({ x: p.x, z: p.z, color: '#6b7280', name: `Puesto ${i + 1}`, role: 'Libre', icon: 'estrella' }))
    // pabellón de Nova, dirección y zonas comunes
    this.novaPod = this.pabellon(NOVA.x, NOVA.z)
    this.direccionPod = this.pod({ x: DIRECCION.x, z: DIRECCION.z, w: 6.0, color: '#2b3a55', name: 'Dirección', role: 'Gerencia general', icon: 'maletin', glass: true })
    this.temaDireccion(this.direccionPod)
    this.colaborativa(-2.5, 2.6)
    this.estanque(-7.7, 3.3, 4.2, 2.6)
    this.cafeteria()
    this.salaReuniones()
    this.descanso()
    this.terraza()
    this.jardines()

    // asientos por tipo de lugar (rot 0 = mirando al sur)
    const salaSeats = []
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.5; const x = SALA.x + Math.cos(a) * 1.9, z = SALA.z + 0.2 + Math.sin(a) * 1.35; salaSeats.push({ x, z, rot: Math.atan2(SALA.x - x, SALA.z + 0.2 - z), seat: true }) }
    const cafeSeats = []
    for (const [tx, tz] of [[CAFE.x - 1.6, CAFE.z + 0.9], [CAFE.x + 1.0, CAFE.z + 0.9]]) for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.5; const x = tx + Math.cos(a) * 0.75, z = tz + Math.sin(a) * 0.75; cafeSeats.push({ x, z, rot: Math.atan2(tx - x, tz - z), seat: true }) }
    cafeSeats.push({ x: CAFE.x - 0.6, z: CAFE.z - 0.3, rot: Math.PI, seat: false }, { x: CAFE.x + 0.4, z: CAFE.z - 0.3, rot: Math.PI, seat: false })
    this.seats = {
      lab: PODS_LAB.map(p => ({ x: p.x, z: p.z - 0.05, rot: 0, seat: true })),
      coordinator: [{ x: NOVA.x, z: NOVA.z - 1.85, rot: 0, seat: true }],
      office: [{ x: DIRECCION.x, z: DIRECCION.z - 0.05, rot: 0, seat: true }, { x: DIRECCION.x - 1.6, z: DIRECCION.z + 1.5, rot: Math.PI / 2, seat: true }, ...salaSeats.slice(0, 2)],
      team: [...salaSeats, { x: SALA.x - 3.6, z: SALA.z + 1.2, rot: Math.PI, seat: false }, { x: SALA.x + 3.6, z: SALA.z + 1.2, rot: Math.PI, seat: false }],
      kitchen: cafeSeats,
      bathroom: [{ x: CAFE.x + 3.9, z: CAFE.z + 0.4, rot: -Math.PI / 2, seat: false }, { x: CAFE.x + 3.9, z: CAFE.z + 1.4, rot: -Math.PI / 2, seat: false }],
      garden: [{ x: TERRAZA.x - 0.8, z: TERRAZA.z - 0.6, rot: 0, seat: true }, { x: TERRAZA.x + 0.6, z: TERRAZA.z - 0.6, rot: 0, seat: true }, { x: TERRAZA.x + 1.9, z: TERRAZA.z + 0.9, rot: -Math.PI / 2, seat: true }, { x: TERRAZA.x - 2.0, z: TERRAZA.z + 1.4, rot: 0.6, seat: false }, { x: TERRAZA.x + 0.4, z: TERRAZA.z + 1.8, rot: Math.PI, seat: false }],
    }
  }

  // Módulo en U con esquinas redondas y banda de etiqueta
  pod({ x, z, w = 6.4, d = 4.8, color, name, role, icon, light = false, glass = false, sideLen = null }) {
    const g = new THREE.Group(); g.position.set(x, 0, z); this.world.add(g)
    const t = 0.34, r = 1.0, hWall = 2.1, hBand = 0.85
    const wallMat = glass ? MAT.glass : MAT.cream
    const zBack = -d / 2, len = sideLen ?? (d - r - 0.3)
    const bandSide = std(color, { roughness: 0.8 })
    const bandMat = new THREE.MeshStandardMaterial({ map: texturaBanda(name, role, color, icon, { light }), roughness: 0.8 })
    box(g, w - 2 * r, hWall, t, wallMat, 0, hWall / 2, zBack + t / 2)
    const band = new THREE.Mesh(new THREE.BoxGeometry(w - 2 * r + 0.02, hBand, t + 0.04), [bandSide, bandSide, bandSide, bandSide, bandMat, bandSide]); band.position.set(0, hWall + hBand / 2, zBack + t / 2); band.castShadow = true; g.add(band)
    if (!glass) add(g, new THREE.PlaneGeometry(w - 2 * r, hWall - 0.05), new THREE.MeshStandardMaterial({ map: textura('madera', [3, 1]), roughness: 0.85, color: 0xf2d9b8 }), 0, hWall / 2, zBack + t + 0.01, { cast: false })
    const esquinas = []
    for (const s of [-1, 1]) { const cx = s * (w / 2 - r), cz = zBack + r; const a0 = s < 0 ? Math.PI / 2 : 0, a1 = s < 0 ? Math.PI : Math.PI / 2; const lo = sector(r - t, r, a0, a1, hWall, wallMat); lo.position.set(cx, 0, cz); g.add(lo); const hi = sector(r - t, r, a0, a1, hBand, bandSide); hi.position.set(cx, hWall, cz); g.add(hi); esquinas.push(hi) }
    for (const s of [-1, 1]) { const sx = s * (w / 2 - t / 2); box(g, t, hWall, len, wallMat, sx, hWall / 2, zBack + r + len / 2); cyl(g, t / 2, t / 2, hWall, wallMat, sx, hWall / 2, zBack + r + len, {}, 16); rbox(g, t + 0.1, 0.12, len + t, MAT.rim, sx, hWall + 0.06, zBack + r + len / 2 - t / 2, {}, 0.05) }
    add(g, new THREE.PlaneGeometry(w - 2 * t - 0.6, d - t - 0.8), std(lighten(color, 0.82), { roughness: 1 }), 0, 0.012, 0.2, { rx: -Math.PI / 2, cast: false })
    if (!glass) { this.lampara(g, 0, 0.4, 1.95); const pl = new THREE.PointLight(0xffc48a, 4.5, 6.5, 2); pl.position.set(0, 1.9, 0.2); if (this.highQuality) g.add(pl) }
    // navegación: muro trasero, esquinas y laterales bloqueados
    this.nav.blockRect(x, z + zBack + t / 2, w - 2 * r + 0.4, t, 0, 0.3)
    for (const s of [-1, 1]) { this.nav.blockRect(x + s * (w / 2 - t / 2), z + zBack + r + len / 2, t, len + 0.3, 0, 0.3); this.nav.blockRect(x + s * (w / 2 - r * 0.55), z + zBack + r * 0.45, r, r, 0, 0.25) }
    const pod = { group: g, x, z, w, d, color, band, bandSide, esquinas, props: null, tema: null,
      setEtiqueta: (name2, role2, color2, icon2) => {
        const mat = new THREE.MeshStandardMaterial({ map: texturaBanda(name2, role2, color2, icon2, { light }), roughness: 0.8 })
        band.material[4].map?.dispose(); band.material[4].dispose(); band.material[4] = mat
        const side = std(color2, { roughness: 0.8 }); for (let i = 0; i < 6; i++) if (i !== 4) band.material[i] = side
        for (const e of esquinas) e.material = side
        pod.color = color2
      } }
    return pod
  }

  lampara(g, x, z, h = 2.0) { cyl(g, 0.008, 0.008, 1.0, MAT.dark, x, h + 0.5, z); cyl(g, 0.05, 0.2, 0.2, std('#f3efe8', { side: THREE.DoubleSide }), x, h, z); add(g, new THREE.SphereGeometry(0.07, 12, 8), MAT.bulb, x, h - 0.05, z, { cast: false }) }
  farol(x, z, luz = false) { const m = this.inst('kaykitCiudad:streetlight.gltf', x, z, { escala: 0.8 }); if (luz && this.highQuality) { const l = new THREE.PointLight(0xffb86b, 5, 7, 2); l.position.set(x, 2.2, z); this.world.add(l) } this.nav.blockRect(x, z, 0.3, 0.3, 0, 0.2); return m }
  pantalla(g, kind, w, h, x, y, z, ry = 0) { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; g.add(p); rbox(p, w + 0.08, h + 0.08, 0.06, MAT.dark, 0, 0, 0, {}, 0.02); add(p, new THREE.PlaneGeometry(w, h), pantallaMat(kind), 0, 0, 0.035, { cast: false }); return p }
  tablero(g, kind, w, h, x, y, z, ry = 0) { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; g.add(p); rbox(p, w + 0.1, h + 0.1, 0.05, std('#e3cfa8'), 0, 0, 0, {}, 0.02); add(p, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: textura(kind), roughness: 0.9 }), 0, 0, 0.03, { cast: false }); return p }
  // coloca un modelo dentro del grupo de un módulo (coordenadas locales) y bloquea su huella si se pide
  m(pod, nombre, lx, lz, { ry = 0, escala = 1, tinte = null, bloquear = false, y = 0 } = {}) {
    const o = this.modelos.instancia(nombre, { escala, tinte }); o.position.set(lx, y, lz); o.rotation.y = ry; pod.group.add(o)
    if (bloquear) { const s = o.userData.tamano || new THREE.Vector3(1, 1, 1); const c = Math.cos(pod.group.rotation.y), sn = Math.sin(pod.group.rotation.y); this.nav.blockRect(pod.x + lx * c + lz * sn, pod.z - lx * sn + lz * c, s.x, s.z, ry, 0.2) }
    return o
  }

  // Escritorio con silla, portátil y pantalla: el agente se sienta en la silla mirando al sur
  escritorio(pod, kind = 'kanban', { pantallas = 1 } = {}) {
    this.m(pod, 'kenney:desk', 0, 0.6, { ry: 0, bloquear: true })
    this.m(pod, 'kenney:chairdesk', 0, -0.1, { ry: 0 })
    this.m(pod, 'kenney:laptop', -0.2, 0.55, { y: 0.76, ry: Math.PI + 0.15 })
    if (pantallas >= 1) { const s = this.m(pod, 'kenney:computerscreen', 0.45, 0.5, { y: 0.76, ry: Math.PI - 0.3 }); void s }
    this.m(pod, 'kenney:plantsmall1', 0.75, 0.75, { y: 0.76, escala: 0.8 })
  }

  temaPod(pod, tema) {
    if (pod.tema === tema) return
    if (pod.props) { pod.group.remove(pod.props) }
    const g = new THREE.Group(); pod.group.add(g); pod.props = g; pod.tema = tema
    const sub = { group: g, x: pod.x, z: pod.z }
    const M = (n, lx, lz, o) => this.m(sub, n, lx, lz, o)
    switch (tema) {
      case 'radar':
        this.escritorio(sub, 'productos'); this.pantalla(g, 'mapa', 2.0, 1.1, -0.6, 1.3, -2.0); M('kaykit:shelf-b-small-decorated', 2.55, -0.6, { ry: -Math.PI / 2, bloquear: true }); M('kenney:pottedplant', -2.4, 1.3)
        cyl(g, 0.02, 0.02, 1.2, MAT.metal, 1.9, 0.6, -1.4); add(g, new THREE.SphereGeometry(0.24, 12, 8, 0, 6.28, 0, 1.2), std('#e5e7eb', { side: THREE.DoubleSide }), 1.9, 1.3, -1.4, { rx: 2.2 }); break
      case 'pluma':
        this.escritorio(sub, 'kanban', { pantallas: 0 }); this.tablero(g, 'storyboard', 2.2, 1.1, 0.4, 1.3, -2.0); M('kenney:lamproundtable', 0.55, 0.4, { y: 0.76, escala: 0.8 }); M('kenney:books', 0.6, 0.8, { y: 0.76, escala: 0.8 }); M('kaykit:shelf-b-large-decorated', -2.5, -0.4, { ry: Math.PI / 2, bloquear: true }); M('naturaleza:tree-palmdetailedshort', 2.4, 1.3, { escala: 0.55 }); break
      case 'lienzo':
        this.escritorio(sub, 'moodboard'); this.pantalla(g, 'moodboard', 1.9, 1.1, 0.5, 1.3, -2.0); M('kaykit:shelf-b-small-decorated', -2.55, -0.4, { ry: Math.PI / 2, bloquear: true })
        for (let i = 0; i < 4; i++) cyl(g, 0.04, 0.04, 0.09, std(['#f97316', '#0ea5e9', '#a3e635', '#f472b6'][i]), -0.75 + i * 0.12, 0.81, 0.95)
        { const e = new THREE.Group(); e.position.set(2.1, 0, 0.6); e.rotation.y = -0.6; g.add(e); for (const s of [-1, 1]) cyl(e, 0.02, 0.02, 1.7, MAT.wood, s * 0.28, 0.85, 0, { rz: s * 0.1 }); rbox(e, 0.75, 0.9, 0.03, std('#fffdf7'), 0, 1.15, 0.05, {}, 0.01); add(e, new THREE.PlaneGeometry(0.65, 0.8), new THREE.MeshStandardMaterial({ map: textura('moodboard') }), 0, 1.15, 0.07, { cast: false }); this.nav.blockRect(pod.x + 2.1, pod.z + 0.6, 0.8, 0.5, -0.6, 0.2) }
        M('kenney:pottedplant', -2.3, 1.3); break
      case 'rodaje':
        add(g, new THREE.PlaneGeometry(3.0, 1.9), std('#2fbf4a', { roughness: 0.95, side: THREE.DoubleSide }), 0.6, 1.0, -1.95, { cast: false }); for (const s of [-1, 1]) cyl(g, 0.02, 0.02, 2.0, MAT.metal, 0.6 + s * 1.55, 1.0, -1.95)
        { const st = new THREE.Group(); st.position.set(2.3, 0, 0.2); st.rotation.y = -0.8; g.add(st); cyl(st, 0.02, 0.02, 1.9, MAT.metal, 0, 0.95, 0); rbox(st, 0.6, 0.45, 0.4, MAT.dark, 0, 1.9, -0.15, { rx: 0.4 }, 0.03); add(st, new THREE.PlaneGeometry(0.52, 0.37), new THREE.MeshBasicMaterial({ color: '#fff7e6' }), 0, 1.78, 0.08, { rx: 0.4, cast: false }) }
        { const cam = new THREE.Group(); cam.position.set(0.2, 0, 1.2); g.add(cam); for (let i = 0; i < 3; i++) cyl(cam, 0.015, 0.015, 1.2, MAT.metal, Math.cos(i * 2.1 + 0.5) * 0.28, 0.55, Math.sin(i * 2.1 + 0.5) * 0.28, { rz: Math.cos(i * 2.1 + 0.5) * 0.45, rx: -Math.sin(i * 2.1 + 0.5) * 0.45 }); rbox(cam, 0.3, 0.26, 0.5, MAT.dark, 0, 1.25, 0, {}, 0.03); cyl(cam, 0.08, 0.1, 0.25, std('#1f2328'), 0, 1.25, -0.35, { rx: Math.PI / 2 }) }
        add(g, new THREE.TorusGeometry(0.28, 0.025, 8, 32), new THREE.MeshBasicMaterial({ color: '#fff' }), -0.9, 1.1, -0.9); cyl(g, 0.02, 0.02, 1.1, MAT.metal, -0.9, 0.55, -0.9)
        M('kenney:cardboardboxclosed', -2.2, -1.2, { escala: 0.8 }); M('kenney:cardboardboxopen', -1.6, -1.4, { escala: 0.7 }); this.m(sub, 'kenney:chairdesk', 0, -0.1, { ry: 0 }); this.nav.blockRect(pod.x + 0.6, pod.z - 1.95, 3.2, 0.3, 0, 0.3); this.nav.blockRect(pod.x + 0.2, pod.z + 1.2, 0.7, 0.7, 0, 0.2); break
      case 'corte':
        this.escritorio(sub, 'timeline'); this.m(sub, 'kenney:computerscreen', -0.5, 0.5, { y: 0.76, ry: Math.PI + 0.3 }); this.pantalla(g, 'timeline', 2.2, 1.0, 0, 1.3, -2.0)
        M('kenney:speakersmall', -0.95, 0.5, { y: 0.76, escala: 0.8 }); M('kenney:speakersmall', 0.95, 0.5, { y: 0.76, escala: 0.8 }); M('naturaleza:tree-palmdetailedshort', 2.4, 1.3, { escala: 0.5 }); M('kaykit:shelf-b-small-decorated', -2.55, -0.5, { ry: Math.PI / 2, bloquear: true }); break
      case 'cierre':
        this.escritorio(sub, 'chat', { pantallas: 0 }); this.pantalla(g, 'chat', 1.3, 1.1, -0.9, 1.3, -2.0)
        { const ph = new THREE.Group(); ph.position.set(0.7, 0.78, 0.5); g.add(ph); cyl(ph, 0.02, 0.02, 0.3, MAT.metal, 0, 0.15, 0); rbox(ph, 0.3, 0.55, 0.03, MAT.dark, 0, 0.55, 0, { rx: -0.15 }, 0.02); add(ph, new THREE.PlaneGeometry(0.26, 0.5), pantallaMat('chat'), 0, 0.552, 0.018, { rx: -0.15, cast: false }) }
        M('kenney:cardboardboxclosed', -2.1, -1.3, { escala: 0.8 }); M('kenney:cardboardboxclosed', -2.1, -0.5, { escala: 0.7 }); M('kaykit:shelf-b-small-decorated', 2.55, -0.5, { ry: -Math.PI / 2, bloquear: true }); M('naturaleza:tree-palmdetailedshort', -2.4, 1.3, { escala: 0.5 }); break
      case 'bodega':
        this.escritorio(sub, 'pedidos'); for (let i = 0; i < 3; i++) M('kenney:cardboardboxclosed', -0.6 + i * 0.45, 0.75, { y: 0.76, escala: 0.45, ry: i * 0.3 })
        M('kenney:bookcaseopen', -2.0, -1.0, { ry: Math.PI / 2, bloquear: true }); M('kenney:bookcaseopen', 1.3, -1.7, { ry: 0, bloquear: true })
        for (const [x, z, y] of [[-2.0, -1.4, 0.02], [-2.0, -0.6, 0.02], [-2.0, -1.0, 0.72], [1.0, -1.7, 0.02], [1.6, -1.7, 0.02], [1.3, -1.7, 0.72], [1.1, -1.7, 1.42]]) M('kenney:cardboardboxclosed', x, z, { y, escala: 0.55, ry: rnd() * 0.4 })
        M('kenney:cardboardboxopen', 2.3, 1.2, { escala: 0.8, bloquear: true }); M('kenney:trashcan', -2.5, 1.4, { escala: 0.8 }); break
      case 'metrica':
        this.escritorio(sub, 'dashboard'); this.pantalla(g, 'dashboard', 2.3, 1.1, 0, 1.3, -2.0); M('kaykit:shelf-b-small-decorated', 2.55, -0.5, { ry: -Math.PI / 2, bloquear: true }); M('kenney:pottedplant', -2.4, 1.3); M('kenney:lampsquarefloor', 2.4, 1.3, { escala: 0.8 }); break
      default:
        this.escritorio(sub, 'kanban'); this.pantalla(g, 'kanban', 1.8, 1.0, 0, 1.3, -2.0); M('kenney:pottedplant', -2.4, 1.3); M('kaykit:shelf-b-small-decorated', 2.55, -0.6, { ry: -Math.PI / 2, bloquear: true })
    }
  }

  temaDireccion(pod) {
    const sub = { group: pod.group, x: pod.x, z: pod.z }
    this.m(sub, 'kenney:desk', 0, 0.6, { escala: 1.15, bloquear: true }); this.m(sub, 'kenney:chairdesk', 0, -0.1, {}); this.m(sub, 'kenney:laptop', -0.25, 0.55, { y: 0.87, ry: Math.PI + 0.1 }); this.m(sub, 'kenney:computerscreen', 0.5, 0.5, { y: 0.87, ry: Math.PI - 0.4 })
    this.pantalla(pod.group, 'dashboard', 2.0, 1.1, 0, 1.3, -2.0); this.m(sub, 'kenney:loungesofa', -2.0, 1.2, { ry: Math.PI / 2, bloquear: true }); this.m(sub, 'kenney:pottedplant', 2.3, 1.4, {}); this.m(sub, 'naturaleza:tree-palmdetailedshort', 2.3, -1.3, { escala: 0.5 }); this.m(sub, 'kenney:coatrackstanding', -2.4, -1.5, { escala: 0.9 })
  }

  // Pabellón circular de Nova con paneles de vidrio
  pabellon(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); this.world.add(g); const R = 3.6, t = 0.34
    g.add(sector(R - t, R, Math.PI * 0.2, Math.PI * 0.8, 2.1, MAT.cream))
    const cap = sector(R - t, R, Math.PI * 0.2, Math.PI * 0.8, 0.85, std('#eadfcf')); cap.position.y = 2.1; g.add(cap)
    const bandT = texturaBanda('Coordinación', 'Asistente y coordinador', '#f6f1e8', 'estrella', { light: true }); bandT.wrapS = THREE.RepeatWrapping; bandT.repeat.x = -1
    const bandMat = new THREE.MeshStandardMaterial({ map: bandT, roughness: 0.8, side: THREE.DoubleSide })
    const banda = add(g, new THREE.CylinderGeometry(R - t - 0.02, R - t - 0.02, 0.85, 48, 1, true, Math.PI * 0.7, Math.PI * 0.6), bandMat, 0, 2.525, 0, { cast: false })
    this.setEtiquetaPabellon = (name, role) => { const key = name + '|' + role; if (banda.userData.key === key) return; banda.userData.key = key; const tx = texturaBanda(name, role, '#f6f1e8', 'estrella', { light: true }); tx.wrapS = THREE.RepeatWrapping; tx.repeat.x = -1; bandMat.map?.dispose(); bandMat.map = tx; bandMat.needsUpdate = true }
    add(g, new THREE.CircleGeometry(R - t - 0.2, 48), std('#f2dfc9', { roughness: 1 }), 0, 0.012, 0, { rx: -Math.PI / 2, cast: false })
    for (const deg of [-18, 18, 54, 126, 162, 198]) { const th = deg * Math.PI / 180, rr = R - 0.15; const panel = new THREE.Group(); panel.position.set(Math.cos(th) * rr, 0, Math.sin(th) * rr); panel.rotation.y = Math.PI / 2 - th; g.add(panel); add(panel, new THREE.PlaneGeometry(2.0, 2.1), MAT.glass, 0, 1.05, 0, { cast: false, recv: false }); for (const sx of [-1, 1]) rbox(panel, 0.06, 2.15, 0.06, MAT.post, sx * 1.0, 1.075, 0, {}, 0.01); rbox(panel, 2.06, 0.06, 0.06, MAT.post, 0, 2.13, 0, {}, 0.01) }
    cyl(g, 1.3, 1.3, 0.08, MAT.wood, 0, 0.75, -0.3, {}, 40); cyl(g, 0.9, 1.0, 0.7, std('#f1e9dc'), 0, 0.36, -0.3, {}, 40)
    const sub = { group: g, x, z }
    this.m(sub, 'kenney:laptop', -0.3, -0.9, { y: 0.79, ry: Math.PI + 0.2 }); this.m(sub, 'kenney:computerscreen', 0.7, -0.9, { y: 0.79, ry: Math.PI - 0.5 }); this.m(sub, 'kenney:chairdesk', 0, -1.9, {})
    this.pantalla(g, 'mapa', 1.7, 1.0, -1.1, 1.3, -3.1, 0.25); this.tablero(g, 'kanban', 1.5, 1.0, 1.2, 1.3, -3.05, -0.25)
    this.m(sub, 'kenney:pottedplant', -2.6, -1.4, {}); this.m(sub, 'naturaleza:tree-palmdetailedshort', 2.7, -1.2, { escala: 0.5 }); this.m(sub, 'kaykit:shelf-a-small', 2.3, -2.3, { ry: -0.9 })
    // ayudante robot
    const robot = new THREE.Group(); robot.position.set(1.9, 0, -0.6); robot.rotation.y = -0.5; g.add(robot); add(robot, new THREE.CapsuleGeometry(0.22, 0.3, 6, 16), std('#f8fafc', { roughness: 0.4 }), 0, 0.55, 0); sph(robot, 0.26, std('#f8fafc', { roughness: 0.4 }), 0, 1.1, 0); add(robot, new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ color: '#22d3ee' }), 0, 1.12, 0.25); for (const s of [-1, 1]) add(robot, new THREE.CapsuleGeometry(0.05, 0.25, 4, 8), std('#e2e8f0'), s * 0.3, 0.6, 0, { rz: s * 0.3 }); cyl(robot, 0.2, 0.25, 0.1, std('#cbd5e1'), 0, 0.05, 0)
    this.robot = robot
    // navegación: arco del muro y mesa
    for (let a = Math.PI * 0.2; a <= Math.PI * 0.8; a += 0.12) this.nav.blockRect(x + Math.cos(a) * (R - t / 2), z - Math.sin(a) * (R - t / 2), 0.5, 0.5, 0, 0.25)
    for (const deg of [-18, 18, 54, 126, 162, 198]) { const th = deg * Math.PI / 180; this.nav.blockRect(x + Math.cos(th) * (R - 0.15), z + Math.sin(th) * (R - 0.15), 2.0, 0.2, -th, 0.2) }
    this.nav.blockRect(x, z - 0.3, 2.6, 2.6, 0, 0.1); this.nav.blockRect(x + 1.9, z - 0.6, 0.5, 0.5, 0, 0.2)
    return { group: g, x, z }
  }

  colaborativa(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); this.world.add(g); const sub = { group: g, x, z }
    add(g, new THREE.CircleGeometry(3.6, 48), std('#e5d6bd', { roughness: 1 }), 0, 0.012, 0, { rx: -Math.PI / 2, cast: false })
    cyl(g, 1.1, 1.2, 0.55, std('#e9dcc6'), 0, 0.27, 0, {}, 40); add(g, new THREE.CircleGeometry(1.05, 40), MAT.soil, 0, 0.56, 0, { rx: -Math.PI / 2, cast: false })
    this.m(sub, 'naturaleza:tree-oak', 0, 0, { escala: 1.0, y: 0.5 }); for (let i = 0; i < 5; i++) { const a = i * 1.26; this.m(sub, 'naturaleza:plant-bushsmall', Math.cos(a) * 0.7, Math.sin(a) * 0.7, { y: 0.56, escala: 0.8 }) }
    g.add(sector(1.25, 1.75, 0, Math.PI * 2, 0.42, std('#f1e3cb'))); const cushion = sector(1.27, 1.73, 0, Math.PI * 2, 0.08, std('#c8a27a')); cushion.position.y = 0.42; g.add(cushion)
    this.m(sub, 'kaykit:couch-pillows', -2.6, 1.6, { ry: 0.8, bloquear: true }); this.m(sub, 'kaykit:couch', 2.6, 1.6, { ry: -0.8, bloquear: true }); this.m(sub, 'kenney:tablecoffee', 0, 2.5, { escala: 0.9 })
    const st = canvasTex(1024, 180, (ctx, w, h) => { ctx.fillStyle = '#efe6d6'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 40); ctx.fill(); ctx.fillStyle = '#2b2420'; ctx.font = 'bold 76px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ZONA COLABORATIVA', w / 2, h / 2 + 26) })
    const sign = new THREE.Group(); sign.position.set(-4.3, 0, 0.2); sign.rotation.y = 0.75; g.add(sign); rbox(sign, 3.3, 0.62, 0.08, std('#efe6d6'), 0, 0.75, -0.05, {}, 0.04); add(sign, new THREE.PlaneGeometry(3.2, 0.56), new THREE.MeshStandardMaterial({ map: st, transparent: true, roughness: 0.9 }), 0, 0.75, 0, { cast: false }); for (const sx of [-1, 1]) cyl(sign, 0.03, 0.03, 0.5, MAT.post, sx * 1.3, 0.25, -0.05)
    this.poste(x + 5.0, z - 0.9)
    this.nav.blockRect(x, z, 3.6, 3.6, 0, 0.2); this.nav.blockRect(x - 4.3, z + 0.2, 3.3, 0.3, 0.75, 0.2)
  }

  poste(x, z) {
    const sp = new THREE.Group(); sp.position.set(x, 0, z); sp.rotation.y = -0.35; this.world.add(sp); cyl(sp, 0.05, 0.06, 2.4, MAT.woodDark, 0, 1.2, 0)
    const items = [['IDEAS', '#e9b24a'], ['PROYECTOS', '#3d5a99'], ['CONTENIDO', '#b4687a'], ['ANUNCIOS', '#5b5fa6'], ['PEDIDOS', '#c98a2b'], ['RESULTADOS', '#2f8f5b']]
    items.forEach(([txt, color], i) => { const dir = i % 2 ? -1 : 1; const t = canvasTex(512, 96, (ctx, w, h) => { ctx.fillStyle = '#e9d9bd'; ctx.beginPath(); if (dir > 0) { ctx.moveTo(0, 0); ctx.lineTo(w - 40, 0); ctx.lineTo(w, h / 2); ctx.lineTo(w - 40, h); ctx.lineTo(0, h) } else { ctx.moveTo(40, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(40, h); ctx.lineTo(0, h / 2) } ctx.closePath(); ctx.fill(); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(dir > 0 ? 40 : w - 40, h / 2, 16, 0, 6.28); ctx.fill(); ctx.fillStyle = '#2b2420'; ctx.font = 'bold 44px "Trebuchet MS", sans-serif'; ctx.textAlign = dir > 0 ? 'left' : 'right'; ctx.fillText(txt, dir > 0 ? 70 : w - 70, h / 2 + 16) })
      rbox(sp, 1.3, 0.26, 0.05, std('#d9c6a3'), dir * 0.62, 2.15 - i * 0.3, 0, {}, 0.02); add(sp, new THREE.PlaneGeometry(1.3, 0.24), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9 }), dir * 0.62, 2.15 - i * 0.3, 0.03, { cast: false }) })
    this.nav.blockRect(x, z, 0.3, 0.3, 0, 0.25)
  }

  estanque(x, z, w, d) {
    const g = this.world; const geo = new THREE.CircleGeometry(1, 40); geo.scale(w / 2, d / 2, 1); add(g, geo, MAT.water, x, 0.02, z, { rx: -Math.PI / 2, cast: false })
    const rim = new THREE.CircleGeometry(1, 40); rim.scale(w / 2 + 0.25, d / 2 + 0.25, 1); add(g, rim, std('#b9b0a0', { roughness: 1 }), x, 0.012, z, { rx: -Math.PI / 2, cast: false })
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; this.inst(['naturaleza:rock-smalla', 'naturaleza:rock-smallb', 'naturaleza:stone-smalla'][i % 3], x + Math.cos(a) * (w / 2 + 0.1), z + Math.sin(a) * (d / 2 + 0.1), { escala: 0.5 + rnd() * 0.4, ry: rnd() * 6 }) }
    for (let i = 0; i < 5; i++) { const k = sph(g, 0.07, std(i % 2 ? '#f97316' : '#fbbf24'), x + (rnd() - 0.5) * (w - 0.8), 0.04, z + (rnd() - 0.5) * (d - 0.6)); k.scale.set(1.8, 0.5, 1) }
    for (let i = 0; i < 3; i++) this.inst(i % 2 ? 'naturaleza:lily-large' : 'naturaleza:lily-small', x + (rnd() - 0.5) * (w - 1), z + (rnd() - 0.5) * (d - 0.8), { y: 0.03, escala: 0.7 })
    this.inst('naturaleza:bridge-woodround', x, z, { escala: 1.0, ry: Math.PI / 2 })
    this.nav.blockRect(x, z, w, d, 0, 0.3)
  }

  cafeteria() {
    const pod = this.pod({ x: CAFE.x, z: CAFE.z, w: 7.0, color: '#8b5a3c', name: 'Cafetería', role: 'Café y pausas del equipo', icon: 'taza', sideLen: 1.2 })
    const sub = { group: pod.group, x: pod.x, z: pod.z }, g = pod.group
    this.m(sub, 'kenney:kitchenbar', -1.3, -1.1, { ry: 0, bloquear: true }); this.m(sub, 'kenney:kitchenbarend', 0.35, -1.1, { ry: 0, bloquear: true }); this.m(sub, 'kenney:kitchencoffeemachine', -1.6, -1.15, { y: 0.9, escala: 0.9 }); this.m(sub, 'kenney:kitchenmicrowave', -0.4, -1.15, { y: 0.9, escala: 0.8 })
    this.m(sub, 'kenney:kitchenfridge', 1.9, -1.3, { ry: 0, bloquear: true }); this.m(sub, 'kaykit:shelf-b-large-decorated', -2.1, -1.95, { ry: 0, y: 0.95, escala: 0.8 })
    this.m(sub, 'kenney:stoolbar', -1.6, -0.3, { escala: 0.9 }); this.m(sub, 'kenney:stoolbar', -0.6, -0.3, { escala: 0.9 })
    for (const [x, z] of [[-1.6, 0.9], [1.0, 0.9]]) { this.m(sub, 'kenney:tableround', x, z, { escala: 0.9, bloquear: true }); for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.5; this.m(sub, 'kenney:chaircushion', x + Math.cos(a) * 0.75, z + Math.sin(a) * 0.75, { ry: Math.atan2(x - (x + Math.cos(a) * 0.75), z - (z + Math.sin(a) * 0.75)) }) } }
    for (const x of [-1.6, 1.0]) this.lampara(g, x, 0.9, 2.1)
    this.m(sub, 'naturaleza:tree-palmdetailedshort', 2.9, 0.3, { escala: 0.55 }); this.m(sub, 'kenney:pottedplant', -3.0, 1.2, {})
    // baño: puerta en el lateral este, con su letrero
    const puerta = this.m(sub, 'kenney:doorway', 3.33, 0.9, { ry: -Math.PI / 2, bloquear: false }); void puerta
    const bt = canvasTex(256, 96, (ctx, w, h) => { ctx.fillStyle = '#efe6d6'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 20); ctx.fill(); ctx.fillStyle = '#2b2420'; ctx.font = 'bold 54px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BAÑO', w / 2, h / 2 + 20) })
    add(g, new THREE.PlaneGeometry(0.7, 0.26), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.9 }), 3.2, 2.0, 0.9, { ry: -Math.PI / 2, cast: false })
  }

  salaReuniones() {
    const pod = this.pod({ x: SALA.x, z: SALA.z, w: 7.0, color: '#f6f1e8', name: 'Sala de reuniones', role: 'Revisión semanal', icon: 'gente', light: true, glass: true, sideLen: 3.2 })
    const sub = { group: pod.group, x: pod.x, z: pod.z }, g = pod.group
    const tbl = this.m(sub, 'kenney:tableround', 0, 0.2, { escala: 1.6, bloquear: true }); tbl.scale.x = 1.4
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.5; const x = Math.cos(a) * 1.9, z = 0.2 + Math.sin(a) * 1.35; this.m(sub, 'kenney:chairrounded', x, z, { ry: Math.atan2(-x, 0.2 - z) }) }
    this.m(sub, 'kenney:laptop', -0.5, 0.2, { y: 0.76, ry: 0.4 }); this.m(sub, 'kenney:laptop', 0.6, 0.0, { y: 0.76, ry: -2.6 }); this.m(sub, 'kenney:plantsmall2', 0, 0.2, { y: 0.76, escala: 0.8 })
    this.pantalla(g, 'kanban', 1.6, 1.0, -1.2, 1.3, -2.0); this.pantalla(g, 'dashboard', 1.6, 1.0, 0.7, 1.3, -2.0)
    this.m(sub, 'kenney:pottedplant', 2.9, 1.2, {}); this.m(sub, 'naturaleza:tree-palmdetailedshort', -2.9, 1.2, { escala: 0.5 })
  }

  descanso() {
    const pod = this.pod({ x: DESCANSO.x, z: DESCANSO.z, w: 6.4, color: '#6b7280', name: 'Zona de descanso', role: 'Juego y pausa', icon: 'control', sideLen: 1.0 })
    const sub = { group: pod.group, x: pod.x, z: pod.z }, g = pod.group
    const gg = new THREE.CircleGeometry(1, 40); gg.scale(2.6, 1.6, 1); add(g, gg, new THREE.MeshStandardMaterial({ map: textura('cesped', [3, 2]), roughness: 1 }), 0, 0.02, 0.4, { rx: -Math.PI / 2, cast: false })
    this.m(sub, 'kenney:cabinettelevision', -1.4, -1.3, { bloquear: true }); this.m(sub, 'kenney:televisionmodern', -1.4, -1.3, { y: 0.5, escala: 1.1 })
    for (const [c, x, z] of [['#e9b24a', 1.3, 0.2], ['#4b6fb6', 0.0, 1.1], ['#e58a8a', 2.1, 1.3]]) { const b = sph(g, 0.55, std(c, { roughness: 0.95 }), x, 0.35, z); b.scale.set(1, 0.65, 1); const t = sph(g, 0.38, std(lighten(c, 0.08), { roughness: 0.95 }), x, 0.55, z - 0.15); t.scale.set(1, 0.6, 1); this.nav.blockRect(pod.x + x, pod.z + z, 1.0, 1.0, 0, 0.1) }
    this.m(sub, 'kaykit:table-low', -0.3, -0.2, { escala: 0.8 }); this.m(sub, 'kenney:radio', -0.4, -0.2, { y: 0.32, escala: 0.6 })
    this.m(sub, 'naturaleza:tree-palmdetailedshort', -2.5, 1.2, { escala: 0.5 }); this.m(sub, 'kenney:pottedplant', 2.6, -0.9, {}); this.lampara(g, 0, 0, 2.2)
    // perro del campus
    const p = this.modelos.personaje('personajes:Pug')
    if (p) { const { obj, clips } = p; const box3 = new THREE.Box3().setFromObject(obj); const s = 0.55 / Math.max(0.01, box3.max.y - box3.min.y); obj.scale.setScalar(s); obj.position.set(1.1, -box3.min.y * s, -0.6); obj.rotation.y = 2.4; const PUG = { Skin: '#d9b08c', Beige: '#e9d2b0', Brown: '#5b3a21', Black: '#1f1f1f', Shirt: '#c0392b', Pants: '#5b3a21', Belt: '#8a5a3a', Details: '#e9d2b0' }; obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; const mats = Array.isArray(o.material) ? o.material : [o.material]; const nuevos = mats.map(m => { if (!PUG[m.name]) return m; const c = m.clone(); c.color.set(PUG[m.name]); return c }); o.material = Array.isArray(o.material) ? nuevos : nuevos[0] } }); g.add(obj); const mixer = new THREE.AnimationMixer(obj); const idle = clips.find(c => c.name === 'Idle'); if (idle) mixer.clipAction(idle).play(); this.mixers.push(mixer) }
  }

  terraza() {
    const pod = this.pod({ x: TERRAZA.x, z: TERRAZA.z, color: '#5f7f3f', name: 'Terraza', role: 'Aire libre y reserva', icon: 'hoja', sideLen: 0.8 })
    const sub = { group: pod.group, x: pod.x, z: pod.z }, g = pod.group
    add(g, new THREE.PlaneGeometry(5.6, 3.9), new THREE.MeshStandardMaterial({ map: textura('cesped', [3, 2]), roughness: 1 }), 0, 0.02, 0.3, { rx: -Math.PI / 2, cast: false })
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { cyl(g, 0.07, 0.07, 2.3, MAT.woodDark, sx * 2.2, 1.15, 0.3 + sz * 1.5); this.nav.blockRect(pod.x + sx * 2.2, pod.z + 0.3 + sz * 1.5, 0.2, 0.2, 0, 0.2) }
    for (const sz of [-1, 1]) rbox(g, 4.8, 0.1, 0.12, MAT.woodDark, 0, 2.3, 0.3 + sz * 1.5); for (let i = 0; i < 9; i++) rbox(g, 0.08, 0.08, 3.3, MAT.woodDark, -2.0 + i * 0.5, 2.36, 0.3)
    for (let i = 0; i < 4; i++) for (let k = 0; k <= 8; k++) { const t = k / 8; add(g, new THREE.SphereGeometry(0.045, 8, 6), MAT.bulb, -2.2 + 4.4 * t, 2.25 - Math.sin(t * Math.PI) * 0.12, -1.2 + i * 1.0, { cast: false }) }
    this.m(sub, 'kenney:loungesofa', 0, -0.9, { ry: 0, bloquear: true }); this.m(sub, 'kenney:loungechairrelax', 1.9, 0.9, { ry: -Math.PI / 2, bloquear: true })
    this.m(sub, 'naturaleza:campfire-stones', -0.6, 0.9, { escala: 0.8 }); for (let i = 0; i < 3; i++) add(g, new THREE.ConeGeometry(0.1, 0.35 + rnd() * 0.2, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? '#fb923c' : '#fde047' }), -0.6 + (rnd() - 0.5) * 0.3, 0.45, 0.9 + (rnd() - 0.5) * 0.3, { cast: false })
    if (this.highQuality) { const fuego = new THREE.PointLight(0xff8c3a, 6, 6, 2); fuego.position.set(-0.6, 0.8, 0.9); g.add(fuego); this.fuego = fuego }
    this.nav.blockRect(pod.x - 0.6, pod.z + 0.9, 1.0, 1.0, 0, 0.2)
    this.m(sub, 'kenney:pottedplant', -2.3, 1.6, {}); this.m(sub, 'naturaleza:tree-palmdetailedshort', 2.4, -1.6, { escala: 0.55 }); this.m(sub, 'naturaleza:plant-bushdetailed', -2.2, -1.5, { escala: 0.8 })
    for (let i = 0; i < 5; i++) this.m(sub, ['naturaleza:flower-purplea', 'naturaleza:flower-reda', 'naturaleza:flower-yellowa'][i % 3], -2.6 + rnd() * 5.2, -1.6 + rnd() * 3.6, { escala: 0.8 })
  }

  jardines() {
    const cama = (x, z, w, d, n = 5) => {
      const geo = new THREE.CircleGeometry(1, 36); geo.scale(w / 2, d / 2, 1); add(this.world, geo, std('#6fae4f', { roughness: 1 }), x, 0.018, z, { rx: -Math.PI / 2, cast: false })
      const rim = new THREE.CircleGeometry(1, 36); rim.scale(w / 2 + 0.18, d / 2 + 0.18, 1); add(this.world, rim, MAT.soil, x, 0.012, z, { rx: -Math.PI / 2, cast: false })
      for (let i = 0; i < n; i++) this.inst(['naturaleza:plant-bush', 'naturaleza:plant-bushdetailed', 'naturaleza:plant-bushsmall', 'naturaleza:flower-purplea', 'naturaleza:flower-reda', 'naturaleza:flower-yellowa', 'naturaleza:grass-large'][Math.floor(rnd() * 7)], x + (rnd() - 0.5) * (w - 0.7), z + (rnd() - 0.5) * (d - 0.7), { escala: 0.7 + rnd() * 0.5, ry: rnd() * 6 })
      for (let i = 0; i < 2; i++) this.inst('naturaleza:rock-smallflata', x + (rnd() - 0.5) * (w - 0.6), z + (rnd() - 0.5) * (d - 0.6), { escala: 0.5 })
      this.nav.blockRect(x, z, w * 0.8, d * 0.8, 0, 0.1)
    }
    cama(-8, -7.2, 1.6, 4.2); cama(8.7, -7.2, 1.6, 4.2); cama(-8, -0.2, 1.4, 2.4, 3); cama(9.0, 2.0, 1.4, 3.8, 4); cama(-7.5, 8.8, 1.2, 3.8, 4); cama(1.4, 8.8, 1.2, 3.8, 4); cama(9.0, 8.8, 1.2, 3.8, 4); cama(2.6, -1.0, 1.6, 2.0, 3); cama(3.2, 5.6, 2.4, 1.4, 4); cama(-8.2, 5.9, 2.2, 1.2, 3)
    for (const [x, z] of [[-15.3, -0.8], [15.3, -0.8], [-15.3, 5.5], [15.3, 5.6], [-8, -12.6], [8.6, -12.6], [1.0, -12.9], [-3, 5.6], [2.5, -1.0], [-5.8, 5.6], [8.4, 5.2]]) { this.inst(rnd() < 0.5 ? 'kenney:pottedplant' : 'naturaleza:tree-palmdetailedshort', x, z, { escala: rnd() < 0.5 ? 1.0 : 0.55 }); this.nav.blockRect(x, z, 0.5, 0.5, 0, 0.15) }
    const arboles = [[-19.5, -9, 'tree-oak'], [19.5, -6, 'tree-default'], [-19, 9, 'tree-default'], [19.5, 10, 'tree-detailed'], [-5, -16, 'tree-default'], [9, -16, 'tree-fat'], [-19, 1, 'tree-tall'], [20, 2, 'tree-oak'], [-12, 16, 'tree-default'], [14, 16, 'tree-detailed'], [2, 16.5, 'tree-default'], [-22, -3, 'tree-fat'], [22, -12, 'tree-tall'], [-16, -16, 'tree-oak'], [17, -16.5, 'tree-default']]
    arboles.forEach(([x, z, t], i) => { this.inst('naturaleza:' + (i % 3 === 0 ? 'tree-default-fall' : t), x, z, { escala: 1.3 + rnd() * 0.6, ry: rnd() * 6 }); this.nav.blockRect(x, z, 0.6, 0.6, 0, 0.2) })
    this.inst('naturaleza:tree-default-fall', -8.2, -0.2, { escala: 1.0 }); this.inst('naturaleza:tree-default-fall', 9.2, -0.4, { escala: 0.95 })
    for (const [x, z, l] of [[-8.2, -3.6, true], [8.8, -3.6, true], [-8.2, 0.9, false], [9.0, 4.3, true], [-7.4, 6.5, false], [1.4, 6.3, true], [9.0, 6.6, false], [-5.8, -1.2, false], [2.4, 4.6, false], [-15.2, 8.8, false], [15.4, -9.2, false]]) this.farol(x, z, l)
    this.inst('kaykitCiudad:bench.gltf', 7.0, 5.2, { escala: 0.9, ry: Math.PI / 2 }); this.inst('ciudad:planter', -5.5, 5.8, { escala: 0.8 })
  }

  // ---------- personajes ----------
  seatFor(place) {
    const pick = (arr) => arr.length ? arr[((place.index || 0) % arr.length + arr.length) % arr.length] : { x: 0, z: 6, rot: 0, seat: false }
    switch (place.type) {
      case 'desk': return pick(place.zone === 'lab' ? this.seats.lab : this.seats.team)
      case 'office': return pick(this.seats.office)
      case 'kitchen': return pick(this.seats.kitchen)
      case 'bathroom': return pick(this.seats.bathroom)
      case 'coordinator': return pick(this.seats.coordinator)
      case 'visit': {
        const target = this.chars.get(place.targetId)?.spot || { x: 0, z: 0, rot: 0 }
        const side = place.side || 1
        const ox = Math.cos(target.rot) * 0.9 * side, oz = -Math.sin(target.rot) * 0.9 * side
        let x = target.x + ox, z = target.z + oz
        if (!this.nav.free(...this.nav.toCell(x, z))) { x = target.x - ox; z = target.z - oz }
        return { x, z, rot: Math.atan2(target.x - x, target.z - z), seat: false }
      }
      default: return pick(this.seats.garden)
    }
  }

  setCharacters(list) {
    if (!this.listo) { this.pendientes = list; return }
    const seen = new Set()
    // etiquetas y decorado de los módulos según los agentes que ocupan cada puesto
    for (const c of list) {
      const puesto = Number.isInteger(c.puesto) ? c.puesto : (c.place.type === 'desk' && c.place.zone === 'lab' && c.kind !== 'empleado' ? c.place.index : null)
      if (c.place.type === 'coordinator' || (c.place.type === 'visit' && c.coordinador)) this.setEtiquetaPabellon?.(c.name.split(' · ')[0], c.role || 'Asistente y coordinador')
      if (puesto !== null) {
        const pod = this.podsLab[(puesto || 0) % this.podsLab.length]
        const tema = temaDe(c.role), color = colorBanda(c.look?.torso)
        const key = `${c.name}|${c.role}|${color}`
        if (pod.key !== key) { pod.key = key; pod.setEtiqueta(c.name, c.role || '', color, ICONOS[tema]) }
        this.temaPod(pod, tema)
      }
    }
    for (const c of list) {
      seen.add(c.id)
      let ch = this.chars.get(c.id)
      const lookKey = JSON.stringify(c.look || {}) + '|' + modeloPara(c.id, c.look)
      if (ch && ch.lookKey !== lookKey) { this.removeChar(c.id); ch = null }
      const spot = this.seatFor(c.place)
      const placeKey = `${c.place.type}:${c.place.zone || ''}:${c.place.index}:${c.place.targetId || ''}`
      if (!ch) {
        const root = new THREE.Group(); root.userData.charId = c.id
        root.position.set(spot.x, 0, spot.z); root.rotation.y = spot.rot
        this.charGroup.add(root)
        ch = { id: c.id, root, persona: null, lookKey, placeKey, spot, route: [], nombreHtml: '', color: c.statusColor }
        this.chars.set(c.id, ch)
        const nombreModelo = 'personajes:' + modeloPara(c.id, c.look)
        this.modelos.cargar(nombreModelo).then(() => {
          if (!this.running || this.chars.get(c.id) !== ch) return
          ch.persona = new Personaje(this.modelos, { id: c.id, look: c.look || {} })
          root.add(ch.persona.root)
          ch.persona.setNombre(ch.nombreHtml); ch.persona.setEstadoColor(ch.color); ch.estadoKey = null
          this.applySelection()
        })
      } else if (ch.placeKey !== placeKey) {
        ch.placeKey = placeKey; ch.spot = spot
        ch.route = this.nav.findPath([ch.root.position.x, ch.root.position.z], [spot.x, spot.z])
      }
      ch.activity = c.activity; ch.place = c.place; ch.color = c.statusColor
      ch.nombreHtml = `<span class="office-dot" style="background:${c.statusColor}"></span>${c.name}`
      if (ch.persona) { ch.persona.setNombre(ch.nombreHtml); ch.persona.setEstadoColor(c.statusColor) }
    }
    for (const id of [...this.chars.keys()]) if (!seen.has(id)) this.removeChar(id)
    this.applySelection()
  }

  arrived(id) { const ch = this.chars.get(id); if (!ch) return true; return !ch.route.length && Math.hypot(ch.root.position.x - ch.spot.x, ch.root.position.z - ch.spot.z) < 0.2 }
  removeChar(id) { const ch = this.chars.get(id); if (!ch) return; ch.persona?.dispose(); this.charGroup.remove(ch.root); this.chars.delete(id) }
  select(id, focus = true) { this.selectedId = id; this.applySelection(); const ch = id && this.chars.get(id); if (focus && ch) this.targetFocus = ch.root }
  applySelection() { for (const [id, ch] of this.chars) ch.persona?.setSeleccion(id === this.selectedId, id === this.hoverId) }
  setHover(id) { if (this.hoverId === id) return; this.hoverId = id; this.applySelection() }

  hitCharacter(e) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.charGroup.children, true)
    for (const h of hits) { let o = h.object; while (o && !o.userData.charId) o = o.parent; if (o) return o.userData.charId }
    return null
  }
  handlePointer(e, isClick) {
    if (!isClick && e.buttons) return
    const id = this.hitCharacter(e)
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'
    this.setHover(id)
    if (isClick) { if (id) this.onSelect?.(id) } else this.onHover?.(id, e.clientX, e.clientY)
  }
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight; if (!w || !h) return
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h); this.composer.setSize(w, h); this.gtao?.setSize(w, h); this.labels.setSize(w, h)
  }
  resetView() { this.targetFocus = null; this.camera.position.copy(this.home.pos); this.controls.target.copy(this.home.target) }

  handleKeys(dt) {
    if (!this.keys.size) return
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir); dir.y = 0; dir.normalize()
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0))
    const v = new THREE.Vector3(); const sp = 9 * dt
    if (this.keys.has('up')) v.addScaledVector(dir, sp); if (this.keys.has('down')) v.addScaledVector(dir, -sp)
    if (this.keys.has('right')) v.addScaledVector(right, sp); if (this.keys.has('left')) v.addScaledVector(right, -sp)
    if (v.lengthSq()) { this.targetFocus = null; this.controls.target.add(v); this.camera.position.add(v) }
    const rot = (this.keys.has('rotR') ? 1 : 0) - (this.keys.has('rotL') ? 1 : 0)
    if (rot) { const off = this.camera.position.clone().sub(this.controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot * dt * 1.2); this.camera.position.copy(this.controls.target).add(off) }
    const zoom = (this.keys.has('in') ? -1 : 0) + (this.keys.has('out') ? 1 : 0)
    if (zoom) { const off = this.camera.position.clone().sub(this.controls.target); const len = THREE.MathUtils.clamp(off.length() * (1 + zoom * dt * 0.9), this.controls.minDistance, this.controls.maxDistance); this.camera.position.copy(this.controls.target).add(off.setLength(len)) }
    this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x, B.x0, B.x1); this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z, B.z0, B.z1)
  }

  animateChar(ch, dt, t) {
    const p = ch.root.position
    let walking = false
    if (ch.route.length) {
      const [tx, tz] = ch.route[0]; const dx = tx - p.x, dz = tz - p.z; const d = Math.hypot(dx, dz); const step = WALK_SPEED * dt
      if (d <= step) { p.x = tx; p.z = tz; ch.route.shift() } else { p.x += (dx / d) * step; p.z += (dz / d) * step }
      if (d > 0.001) { const target = Math.atan2(dx, dz); let diff = target - ch.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); ch.root.rotation.y += diff * Math.min(1, dt * 10) }
      walking = ch.route.length > 0
    }
    const arrived = !ch.route.length
    if (arrived) { let diff = ch.spot.rot - ch.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); ch.root.rotation.y += diff * Math.min(1, dt * 8) }
    if (!ch.persona) return
    const carrying = ch.activity === 'carry'
    const sentado = arrived && !!ch.spot.seat && ch.activity !== 'relax' && ch.activity !== 'drink' ? true : (arrived && !!ch.spot.seat && ch.activity === 'relax')
    const key = `${walking}|${carrying}|${sentado}|${ch.activity}`
    if (ch.estadoKey !== key) { ch.estadoKey = key; ch.persona.setEstado({ caminando: walking, cargando: carrying, sentado, actividad: ch.activity }) }
    ch.persona.update(dt, t)
  }

  animate() {
    if (!this.running) return
    requestAnimationFrame(this.animate)
    this.timer.update(); const dt = Math.min(this.timer.getDelta(), 0.05), t = this.timer.getElapsed()
    this.handleKeys(dt)
    if (this.targetFocus) { const goal = this.targetFocus.position.clone().setY(0.6); const delta = goal.sub(this.controls.target).multiplyScalar(Math.min(1, dt * 4)); this.controls.target.add(delta); this.camera.position.add(delta) }
    for (const ch of this.chars.values()) this.animateChar(ch, dt, t)
    for (const m of this.mixers) m.update(dt)
    if (this.robot) { this.robot.position.y = Math.sin(t * 1.5) * 0.04; this.robot.rotation.y = -0.5 + Math.sin(t * 0.6) * 0.3 }
    if (this.fuego) this.fuego.intensity = 5 + Math.sin(t * 9) * 1.2 + Math.sin(t * 23) * 0.6
    this.controls.update()
    this.composer.render()
    this.labels.render(this.scene, this.camera)
  }

  dispose() {
    this.running = false; this.resizeObserver.disconnect(); this.overlay?.remove()
    const el = this.renderer.domElement
    el.removeEventListener('pointermove', this._onMove); el.removeEventListener('pointerdown', this._onDown); el.removeEventListener('pointerup', this._onUp); el.removeEventListener('pointerleave', this._onLeave); el.removeEventListener('contextmenu', this._onContext)
    window.removeEventListener('keydown', this._onKeyDown); window.removeEventListener('keyup', this._onKeyUp); window.removeEventListener('blur', this._onBlur)
    for (const id of [...this.chars.keys()]) this.removeChar(id)
    this.controls.dispose()
    this.scene.traverse((o) => { if (o.isMesh) { o.geometry?.dispose?.(); const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => m?.dispose?.()) } })
    this.composer.dispose?.(); this.renderer.dispose(); el.remove(); this.labels.domElement.remove()
  }
}
