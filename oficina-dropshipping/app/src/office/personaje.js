// Personaje animado del campus: modelo de Quaternius (CC0) con esqueleto, ropa teñida con los colores del avatar
// y animaciones de caminar, llevar carpeta, sentarse, teclear y tomar café.
import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

export const MODELOS_PERSONAJE = ['Casual_Male', 'Casual_Female', 'Casual2_Male', 'Casual2_Female', 'Casual3_Male', 'Casual3_Female', 'Suit_Male', 'Suit_Female', 'Worker_Male', 'Worker_Female', 'Casual_Bald', 'OldClassy_Male', 'OldClassy_Female']
export const ALTURA = 1.7

// Modelo base: el que elija el avatar (look.modelo) o uno fijo según el id
export function modeloPara(id, look) {
  if (look?.modelo && MODELOS_PERSONAJE.includes(look.modelo)) return look.modelo
  let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return MODELOS_PERSONAJE[h % MODELOS_PERSONAJE.length]
}

// Colores del avatar (editor de la app) → materiales del modelo de Quaternius
const TINTES = { Shirt: 'torso', Pants: 'legs', Hair: 'hair', Skin: 'skin', Belt: 'accent', Details: 'accent', Black: 'legs' }
// Colores por defecto: el paquete convertido trae la piel casi negra, así que siempre se tiñe
const DEFECTO = { torso: '#3b82f6', legs: '#334155', hair: '#2b2118', skin: '#e8b58e', accent: '#8a5a3a' }

export class Personaje {
  constructor(modelos, { id, look = {}, name = '' }) {
    this.id = id; this.look = look; this.modelos = modelos
    this.root = new THREE.Group(); this.root.userData.charId = id
    this.modelo = modeloPara(id, look)
    this.mixer = null; this.acciones = {}; this.actual = null; this.huesos = {}; this.props = {}
    this.estado = { caminando: false, cargando: false, sentado: false, actividad: 'idle' }
    this.phase = Math.random() * 6
    // Zona de clic (invisible) y aro de estado bajo los pies
    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, ALTURA, 10), new THREE.MeshBasicMaterial({ visible: false }))
    this.hit.position.y = ALTURA / 2; this.root.add(this.hit)
    this.aroMat = new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.0, depthWrite: false })
    this.aro = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), this.aroMat); this.aro.rotation.x = -Math.PI / 2; this.aro.position.y = 0.02; this.root.add(this.aro)
    this.labelEl = document.createElement('div'); this.labelEl.className = 'office-label'
    this.label = new CSS2DObject(this.labelEl); this.label.position.set(0, ALTURA + 0.3, 0); this.root.add(this.label)
    this.montar()
  }

  montar() {
    const p = this.modelos.personaje('personajes:' + this.modelo)
    if (!p) { this.root.add(figuraSimple(this.look)); return }
    const { obj, clips } = p
    // Normalizar altura y poner los pies en y=0
    const box = new THREE.Box3().setFromObject(obj)
    const alto = Math.max(0.01, box.max.y - box.min.y)
    this.escala = ALTURA / alto
    obj.scale.setScalar(this.escala); obj.position.y = -box.min.y * this.escala
    obj.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const nuevos = mats.map((m) => {
        const clave = TINTES[m.name]; const color = clave && (this.look[clave] || DEFECTO[clave])
        if (!color) return m
        const c = m.clone(); c.color.set(color); return c
      })
      o.material = Array.isArray(o.material) ? nuevos : nuevos[0]
    })
    this.obj = obj; this.root.add(obj)
    this.mixer = new THREE.AnimationMixer(obj)
    for (const clip of clips) this.acciones[clip.name] = this.mixer.clipAction(clip)
    this.huesos = { brazoIzq: obj.getObjectByName('LowerArm.L'), brazoDer: obj.getObjectByName('LowerArm.R'), hombroIzq: obj.getObjectByName('UpperArm.L'), hombroDer: obj.getObjectByName('UpperArm.R'), mano: obj.getObjectByName('Fist.R'), cabeza: obj.getObjectByName('Head') }
    // Objetos en la mano: carpeta de tareas y taza
    if (this.huesos.mano) {
      const k = 1 / this.escala
      const carpeta = new THREE.Mesh(new THREE.BoxGeometry(0.34 * k, 0.03 * k, 0.26 * k), new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.8 }))
      carpeta.position.set(0, -0.1 * k, 0.12 * k); carpeta.rotation.x = 0.2; carpeta.visible = false; carpeta.castShadow = true
      const taza = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * k, 0.04 * k, 0.1 * k, 12), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 }))
      taza.position.set(0, -0.02 * k, 0.06 * k); taza.visible = false
      this.huesos.mano.add(carpeta, taza); this.props = { carpeta, taza }
    }
    this.tocar('Idle', { fade: 0 })
  }

  tocar(nombre, { loop = true, fade = 0.25 } = {}) {
    const a = this.acciones[nombre]
    if (!a) return
    if (a === this.actual) return
    a.reset(); a.enabled = true
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1); a.clampWhenFinished = !loop
    if (this.actual && fade > 0) { this.actual.fadeOut(fade); a.fadeIn(fade) } else { if (this.actual) this.actual.stop(); a.setEffectiveWeight(1) }
    a.play(); this.actual = a; this.clipActual = nombre
  }

  // Estado deseado: lo marca la escena cada vez que algo cambia
  setEstado({ caminando, cargando, sentado, actividad }) {
    const e = this.estado
    e.caminando = caminando; e.cargando = cargando; e.sentado = sentado; e.actividad = actividad
    if (!this.mixer) return
    if (caminando) this.tocar(cargando && this.acciones.Walk_Carry ? 'Walk_Carry' : 'Walk')
    else if (sentado) this.tocar('SitDown', { loop: false })
    else this.tocar('Idle')
    if (this.props.carpeta) this.props.carpeta.visible = !!cargando
    if (this.props.taza) this.props.taza.visible = actividad === 'drink' && !caminando
  }

  setNombre(html) { this.labelEl.innerHTML = html }
  setEstadoColor(color) { this.aroMat.color.set(color) }
  setSeleccion(sel, hover = false) { this.aroMat.opacity = sel ? 0.9 : hover ? 0.5 : 0.0 }

  update(dt, t) {
    if (!this.mixer) return
    this.mixer.update(dt)
    const e = this.estado, h = this.huesos
    if (!e.caminando && e.sentado && e.actividad === 'typing' && h.brazoIzq && h.brazoDer) {
      // Tecleo: antebrazos hacia delante con un temblor suave, sobre la pose sentada
      h.hombroIzq.rotation.x += -0.55; h.hombroDer.rotation.x += -0.55
      h.brazoIzq.rotation.x += -0.5 + Math.sin(t * 14 + this.phase) * 0.08
      h.brazoDer.rotation.x += -0.5 + Math.sin(t * 14 + this.phase + 1.9) * 0.08
    } else if (!e.caminando && e.actividad === 'drink' && h.hombroDer && h.brazoDer) {
      h.hombroDer.rotation.x += -0.9; h.brazoDer.rotation.x += -1.3 + Math.sin(t * 1.3 + this.phase) * 0.12
    } else if (!e.caminando && e.cargando && h.hombroDer && h.brazoDer) {
      h.hombroDer.rotation.x += -0.6; h.brazoDer.rotation.x += -0.9
    }
  }

  dispose() {
    this.mixer?.stopAllAction(); this.labelEl.remove()
    this.root.traverse((o) => { if (o.isMesh && o !== this.hit) { o.geometry?.dispose?.() } })
  }
}

// Figura de respaldo si el modelo no cargó
function figuraSimple(look) {
  const g = new THREE.Group()
  const m = (c) => new THREE.MeshStandardMaterial({ color: c || '#94a3b8', roughness: 0.8 })
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.5, 6, 14), m(look.torso)); torso.position.y = 1.0; torso.castShadow = true
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), m(look.skin || '#e8b58e')); cabeza.position.y = 1.5; cabeza.castShadow = true
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 10), m(look.legs || '#334155')); p.position.set(s * 0.12, 0.4, 0); p.castShadow = true; g.add(p) }
  g.add(torso, cabeza)
  return g
}
