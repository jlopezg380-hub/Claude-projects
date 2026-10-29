# Oficina de agentes para dropshipping contra entrega

Edición adaptada de [Agentes IA 3D](https://github.com/ederland/Agentes_IA_3D) de Ederland Studio (MIT) para una
operación de dropshipping contra entrega que vende por WhatsApp, prueba productos con anuncios en Meta y gestiona
pedidos en Dropi. Mismo esqueleto: app web con Pipeline y Oficina 3D, motor local que ejecuta las tareas con
Claude Code, catálogo de roles. Cambia el equipo, las herramientas y las reglas.

## Qué cambia respecto al original

| Pieza | Cambio |
|---|---|
| `roles/catalogo.json` | Roles de dropshipping: cazador de productos, guionista UGC, director de arte, productor de vídeo, editor y montador, vendedor por WhatsApp, operaciones Dropi, analista de anuncios, más el coordinador. Grupos de herramientas para DropKiller, Dropi en lectura, Meta Ads en lectura y generación por API. |
| `motor/generacion.mjs`, `motor/modelos.json`, `motor/presupuesto.json` | Pasarela de generación de imágenes y vídeo por API (fal.ai) con topes por tarea, día y mes y registro de gasto en `motor/logs/gasto.json`. Sin clave, los agentes trabajan en modo prompts. |
| `motor/media-server.mjs` | Herramientas nuevas: `modelos_disponibles`, `estimar_costo`, `presupuesto_estado`, `generar_imagen`, `generar_video`. |
| `motor/worker.mjs` | Presupuesto por tarea en USD, id de tarea y tope para el servidor de medios, rutinas programadas (`motor/rutinas.json`), contexto de negocio con país, modelo, canal, economía y reglas. |
| `motor/CLAUDE.md` | Reglas de los agentes para contra entrega: nada se publica ni se envía, sin afirmaciones de salud, códigos de combinación, dinero. |
| `motor/.claude/skills/` | Skills `biblioteca-estructuras` (36 estructuras de anuncio) y `produccion-anuncios` (flujo del productor). Carpetas para tus skills de AvatarHype y preparar-lanzamiento. |
| `motor/calibrar.mjs` y `docs/pruebas-dia-1.md` | Calibración de modelos con tu producto: coste y calidad por modelo antes de producir. |
| `firestore.rules` | Cierre de la escalada de privilegios (un usuario no puede darse rol admin), lecturas solo para usuarios activos, invitaciones solo del propio correo, horas solo propias. |
| `.claude/skills/instalar` | Instalador con entrevista de dropshipping, conectores y pasarela. |

Lo que no cambia: la app web, la Oficina 3D, el chat con agentes, Telegram, el editor de vídeo local.

La Oficina tiene dos vistas, con un selector arriba a la derecha de la escena. El **campus** (`app/src/office/campus.js`)
es la vista principal: un campus al aire libre con módulos redondeados, uno por agente, con su nombre y su rol en la banda
y el decorado de su oficio; el coordinador ocupa el pabellón central, la dirección su oficina de vidrio, y hay cafetería,
sala de reuniones, zona de descanso y terraza. Usa modelos 3D de dominio público (Kenney, KayKit, Quaternius; ver
`app/public/modelos/LICENCIAS.md`) y personajes animados que caminan entre módulos para recibir y entregar tareas.
La **oficina clásica** es la escena original de Agentes IA 3D. La elección se guarda en el navegador.

## Cómo se trabaja

1. El **cazador** propone productos con datos de DropKiller y costos de Dropi. Tú apruebas uno: su nombre es el
   "Cliente" de todas las tareas siguientes.
2. El **vendedor** prepara el kit de lanzamiento y los guiones de WhatsApp.
3. El **guionista** entrega ángulos; eliges; vuelve con los guiones por bloques, nombrados por código de combinación.
4. El **director de arte** entrega prompts o imágenes; el **productor** genera los clips dentro del presupuesto.
5. El **editor** monta los anuncios finales. Tú publicas en Meta.
6. **Operaciones** te deja cada mañana el reporte de pedidos. El **analista** lee los resultados y recomienda.

Todo cae en "Espera Aprobación": nada se publica, se envía ni se pide sin ti.

## Instalación

```bash
cd oficina-dropshipping
claude
```

Dentro de Claude Code escribe `/instalar` y sigue la entrevista. Guía de calibración de modelos: `docs/pruebas-dia-1.md`.

## Costes a tener en cuenta

- Suscripción de Claude para el motor (con 7 agentes activos, plan Max).
- Pasarela de generación: solo lo generado, con topes. Entre 20 y 80 USD al mes según cuántos anuncios y de qué tipo.
- Firebase en plan gratuito. Telegram gratis. DropKiller y Dropi según tus planes.

## Estructura

```
app/        App web (React, Vite, Three.js, Firebase)
motor/      Motor local (Node + Claude Code), servidor de medios, pasarela de generación, rutinas, skills
roles/      Catálogo de roles y herramientas
tools/      Configurador e inicio automático
docs/       Guía de pruebas del día 1
.claude/    Skill /instalar
```

## Licencia

MIT, como el proyecto original. Ver `ORIGEN.md`.
