# Traspaso · Oficina de agentes para dropshipping (sesión en la nube del 29-10-2026)

Resumen de todo lo decidido y construido en la sesión, para seguir desde el PC. Lo que está en este repositorio es lo único
permanente; las vistas previas (artefactos) viven en claude.ai y la conversación en la sesión de Claude Code en la nube.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Repositorio | https://github.com/jlopezg380-hub/Claude-projects · rama `claude/plan-produccion-anuncios-wangp` |
| Proyecto completo (app, motor, roles, skills, modelos 3D) | `oficina-dropshipping/` |
| Biblioteca de estructuras de vídeo para Meta (36 estructuras, ganchos, CTA, códigos de combinación) | `biblioteca-estructuras-video.md` y copia en `oficina-dropshipping/motor/.claude/skills/biblioteca-estructuras/` |
| Guía de las pruebas de generación de vídeo (día 1) | `oficina-dropshipping/docs/pruebas-dia-1.md` |
| Instalador guiado | `oficina-dropshipping/.claude/skills/instalar/SKILL.md` (se usa con `/instalar` desde Claude Code dentro de la carpeta) |
| Modelos 3D CC0 y licencias | `oficina-dropshipping/app/public/modelos/` y `LICENCIAS.md` |
| Captura del campus dentro de la app | `oficina-dropshipping/docs/capturas/campus.png` |
| Plan anterior con WanGP (descartado, se conserva como referencia) | `plan-produccion-anuncios-wangp.md`, `HANDOFF-wangp-anuncios.md` |

Vistas previas publicadas en claude.ai (privadas, solo con tu cuenta):

- Campus interactivo con modelos reales, tal como va en la app: https://claude.ai/artifact/YCAMV6cSmyvkwYmw7XDcge
- Propuesta de campus (renders y comparación con tus referencias): https://claude.ai/artifact/7KxHuDwm1EY9HScdWzjPeJ
- Cinco propuestas de ambiente (loft, cristal, neón, ático, maqueta): https://claude.ai/artifact/Jvj1Ry4pXLTeR32o6Kpzjc
- Primeras vistas, descartadas: oficina tipo Lego https://claude.ai/artifact/4rNdX53TT1YnRew7jjPQQB y centro de mando https://claude.ai/artifact/1xXYpUKZCnHc2DcrhnoZHR

## Cómo traerlo al PC

```bash
git clone https://github.com/jlopezg380-hub/Claude-projects.git
cd Claude-projects
git checkout claude/plan-produccion-anuncios-wangp
# si ya lo tenías clonado:
git fetch origin && git checkout claude/plan-produccion-anuncios-wangp && git pull
```

Para instalar la app y el motor: abre Claude Code en `Claude-projects/oficina-dropshipping` y escribe `/instalar`.
Nunca subas al repositorio `motor/.env`, `app/.env` ni `motor/negocio.json`: ya están en `.gitignore`.

Para continuar esta misma conversación desde el terminal: en claude.ai/code, abre la sesión y usa la opción de
continuarla en tu terminal (Claude Code te da el comando). Si prefieres empezar una sesión nueva en el PC, este
archivo y el `README.md` del proyecto tienen todo el contexto.

## Decisiones tomadas

1. **Base.** Se parte del repositorio Agentes_IA_3D de Ederland Studio (MIT): app web (React + Three.js + Firebase) con
   Pipeline y Oficina 3D, y motor local en Node que ejecuta cada tarea con Claude Code. Ver `oficina-dropshipping/ORIGEN.md`.
2. **Equipo de agentes** (`roles/catalogo.json`): Nova (coordinador y gerente), Radar (cazador de productos),
   Pluma (estratega y guionista UGC), Lienzo (director de arte), Rodaje (productor de vídeo), Corte (editor y montador),
   Cierre (vendedor y lanzador por WhatsApp), Bodega (operaciones y pedidos en Dropi), Metrica (analista de anuncios).
   Más dos roles sin agente: investigación y personalizado. Ningún agente publica, envía mensajes, crea pedidos ni toca
   campañas: entregan y tú apruebas. No existe `create_order` en ninguna lista de herramientas.
3. **Venta por WhatsApp, sin landing pages.** El vendedor prepara el kit de lanzamiento y los guiones de conversación.
4. **Generación de vídeo.** WanGP descartado (depende del PC, mala calidad con 8 GB). Higgsfield descartado por precio.
   Alquiler de GPU descartado por ahora. Se usa pasarela de pago por uso (fal.ai) con topes duros en
   `motor/presupuesto.json`: 3 USD por tarea, 5 USD al día, 60 USD al mes, y registro en `motor/logs/gasto.json`.
   Modelos en `motor/modelos.json` (todos con `verificar: true` hasta calibrar). Los UGC con avatar llevan sincronía
   labial (Veo 3.1 rápido u otro modelo con audio); los borradores van a 480p.
   Estimación: 50 a 80 USD al mes para 8 productos con 5 anuncios cada uno, dos de ellos UGC con labios.
5. **Diversidad creativa para Meta.** Seis ejes (estructura, gancho, persona, escenario, oferta, estilo), regla de los
   dos ejes, mínimo cinco familias por semana, código `PRODUCTO_ESTRUCTURA_gancho_persona_cta_vN`. Todo en la biblioteca.
6. **Oficina 3D.** Tras descartar la oficina tipo Lego y el centro de mando futurista, se eligió el **campus de módulos**
   inspirado en tus dos imágenes de referencia, y se construyó con modelos 3D de dominio público (opción B):
   personajes animados de Quaternius, muebles de Kenney y KayKit, naturaleza de Kenney. Cada agente tiene su módulo con
   nombre, rol y decorado de su oficio; Nova el pabellón central; tú la oficina de dirección; cafetería, sala de reuniones,
   zona de descanso, terraza, zona colaborativa, estanque y poste de señales. Los personajes caminan para recibir y
   entregar tareas. Código en `app/src/office/campus.js`, `personaje.js`, `modelos.js`, `pantallas.js`.
7. **AllSet** (tu plataforma de logística en Hetzner, Ubuntu): integración pospuesta a petición tuya. Propuesta pendiente:
   alojar allí el motor, acceso de solo lectura para el agente de operaciones y servir las entregas.

## Estado del proyecto

- Proyecto completo y validado: sintaxis, JSON, compilación de la app con Vite, servidor MCP de medios con 22
  herramientas (incluidas `estimar_costo`, `generar_video`, `generar_imagen`, `presupuesto_estado`), pruebas de topes.
- Reglas de Firestore endurecidas (dueño, invitaciones, campos protegidos) y app ajustada al flujo de invitaciones.
- Rutinas automáticas en `motor/rutinas.json`: reporte de pedidos (07:30, lunes a sábado) y radar de productos
  (08:00, lunes y jueves).
- Vista Campus verificada en navegador sin tarjeta gráfica: carga los 105 modelos del catálogo, personajes con ropa
  teñida, sentados, caminando con carpeta. `node tools/catalogo-modelos.mjs` comprueba el catálogo.
- No instalado todavía en tu PC: faltan `app/.env`, `motor/.env` (con `FAL_KEY`) y `motor/negocio.json`.

## Pendientes

1. Pruebas de generación de vídeo (`docs/pruebas-dia-1.md`): cuenta en fal.ai, recarga de 10 USD, `FAL_KEY` en
   `motor/.env`, `node motor/calibrar.mjs --imagen ../fotos/producto.jpg`, revisar resultados y corregir rutas y precios
   en `motor/modelos.json`, primer anuncio real.
2. Instalación con `/instalar`: Firebase, correo del robot y del dueño, Telegram, datos de `negocio.json`.
3. Pegar el texto de tus skills `preparar-lanzamiento`, `estratega-avatarhype` y `avatarhype-6c-prompt-engine` en
   `motor/.claude/skills/` (hay carpetas con README de marcador).
4. Comprobar el campus en tu PC con tarjeta gráfica: fluidez con calidad alta (oclusión ambiental y sombras 4096).
5. Opcional: que el editor de avatar permita elegir el modelo de personaje y el tono de piel (`look.modelo`, `look.skin`).
6. Opcional: integración con AllSet y arranque automático del motor en Linux (`tools/inicio-automatico-linux.sh`).
