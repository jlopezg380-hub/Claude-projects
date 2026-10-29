// Biblioteca de modelos 3D (CC0) del campus: carga, caché e instancias centradas en el suelo.
// Los archivos viven en app/public/modelos/ (ver LICENCIAS.md). Si falta un modelo, se usa un relleno gris.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone as clonarEsqueleto } from 'three/addons/utils/SkeletonUtils.js'

// Escala de cada paquete para que 1 unidad = 1 metro en el campus
export const PAQUETES = {
  kenney: { carpeta: 'muebles/kenney/', escala: 2.0 },
  kaykit: { carpeta: 'muebles/kaykit/', escala: 0.7 },
  naturaleza: { carpeta: 'naturaleza/', escala: 2.0 },
  ciudad: { carpeta: 'ciudad/', escala: 2.0 },
  kaykitCiudad: { carpeta: 'ciudad/', escala: 3.0 },
  personajes: { carpeta: 'personajes/', escala: 1.0 },
}

export class Modelos {
  constructor(base = '/modelos/', extension = '.glb') {
    this.base = base; this.extension = extension
    this.loader = new GLTFLoader()
    this.promesas = new Map()
    this.listo = new Map()
    this.faltantes = new Set()
  }

  ruta(nombre) {
    const i = nombre.indexOf(':')
    const paq = PAQUETES[nombre.slice(0, i)], archivo = nombre.slice(i + 1)
    if (!paq) throw new Error('Paquete desconocido: ' + nombre)
    return { url: this.base + paq.carpeta + archivo + (archivo.endsWith('.gltf') ? '' : this.extension), escala: paq.escala }
  }

  cargar(nombre) {
    if (this.promesas.has(nombre)) return this.promesas.get(nombre)
    const p = new Promise((resolve) => {
      let url
      try { url = this.ruta(nombre).url } catch (e) { console.warn(e.message); this.faltantes.add(nombre); return resolve(null) }
      this.loader.load(url, (gltf) => {
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return
          o.castShadow = true; o.receiveShadow = true
          // Algunos exportadores dejan metallicFactor=1 (el valor por defecto de glTF): sin mapa de entorno se ve negro
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) { if (m.map) m.map.colorSpace = THREE.SRGBColorSpace; if ('metalness' in m) m.metalness = Math.min(m.metalness, 0.1); if ('roughness' in m) m.roughness = Math.max(m.roughness, 0.6) }
        })
        this.listo.set(nombre, gltf); resolve(gltf)
      }, undefined, () => { console.warn('Modelo no disponible:', nombre, url); this.faltantes.add(nombre); resolve(null) })
    })
    this.promesas.set(nombre, p)
    return p
  }

  async precargar(nombres, onProgreso) {
    let n = 0
    await Promise.all([...new Set(nombres)].map(async (nm) => { await this.cargar(nm); n++; onProgreso?.(n, nombres.length) }))
  }

  // Instancia síncrona (el modelo debe estar precargado). Devuelve un grupo con la base en y=0 y centrado en x/z.
  instancia(nombre, { escala = 1, tinte = null, centrar = true, sombra = true, rotY = 0 } = {}) {
    const g = new THREE.Group(); g.name = nombre
    const gltf = this.listo.get(nombre)
    if (!gltf) { g.add(relleno()); return g }
    const obj = gltf.scene.clone(true)
    const s = this.ruta(nombre).escala * escala
    obj.scale.setScalar(s); obj.rotation.y = rotY
    if (tinte) {
      const color = new THREE.Color(tinte)
      obj.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(color) } })
    }
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = sombra; o.receiveShadow = true } })
    if (centrar) {
      const box = new THREE.Box3().setFromObject(obj)
      if (!box.isEmpty()) { const c = box.getCenter(new THREE.Vector3()); obj.position.set(-c.x, -box.min.y, -c.z) }
    }
    g.add(obj)
    g.userData.tamano = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3())
    return g
  }

  // Clon de un personaje animado (malla con esqueleto); devuelve { obj, clips } o null
  personaje(nombre) {
    const gltf = this.listo.get(nombre)
    if (!gltf) return null
    return { obj: clonarEsqueleto(gltf.scene), clips: gltf.animations }
  }
}

function relleno() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: '#b8b3a8', roughness: 0.9 }))
  m.position.y = 0.25; m.castShadow = true; m.receiveShadow = true
  return m
}
