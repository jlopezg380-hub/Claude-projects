# Oficina de agentes para dropshipping

> Si eres un agente de IA ejecutando una tarea del motor (tu carpeta de trabajo está dentro de `motor/trabajos/`),
> ignora este archivo: tus reglas están en `motor/CLAUDE.md` y en el texto de tu tarea.

Edición de Agentes IA 3D para dropshipping contra entrega con venta por WhatsApp. Ver `README.md` y `ORIGEN.md`.

- `app/` — app web (React + Vite + Three.js + Firebase): Pipeline de tareas, Oficina 3D, chat con agentes, equipo.
- `motor/` — motor local (Node): ejecuta las tareas con Claude Code; Telegram, voz, medios, generación por API con topes
  (`generacion.mjs`, `modelos.json`, `presupuesto.json`), rutinas (`rutinas.json`), skills en `motor/.claude/skills/`.
- `roles/catalogo.json` — catálogo de roles (habilidades) que comparten la app y el motor.
- `firestore.rules` — reglas de seguridad. `tools/configurar.mjs` las personaliza con el correo del robot y del dueño.
- `.claude/skills/instalar/` — asistente de instalación.
- `docs/pruebas-dia-1.md` — calibración de modelos de generación.

## Si la persona quiere instalarlo o configurarlo

Usa la skill **instalar** (`/instalar`). Si `app/.env` o `motor/negocio.json` no existen, el proyecto aún no está
instalado: ofrece empezar la instalación.

## Reglas para trabajar en este repo

- Nunca leas, muestres ni subas `motor/.env`, `app/.env`, `motor/negocio.json` ni contraseñas, tokens o claves.
- Nada específico del negocio va en el código: va en `.env`, `motor/negocio.json`, `motor/rutinas.json` o `roles/catalogo.json`.
- Los textos de la interfaz están en español.
- Para agregar una habilidad nueva, crea un rol en `roles/catalogo.json` (misión, herramientas, entrega, presupuesto).
- Las herramientas de generación nunca saltan los topes de `motor/presupuesto.json`.
