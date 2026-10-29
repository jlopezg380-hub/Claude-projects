---
name: instalar
description: Asistente de instalación de la Oficina de agentes para dropshipping contra entrega. Entrevista al usuario (negocio, país, canal de venta, productos, marca, equipo de agentes y sus roles, conectores, pasarela de generación), configura Firebase, crea los agentes, publica la app y deja el motor funcionando. Úsala cuando el usuario diga /instalar, "instalar", "configurar mi oficina", "poner en marcha" o abra el repositorio por primera vez.
---

# Instalar la Oficina de agentes (edición dropshipping)

Vas a dejar funcionando, para el negocio de esta persona: la app web (Pipeline, Oficina 3D, chat con agentes),
sus agentes de IA y el motor que los ejecuta en su PC con Claude Code. Habla en el idioma del usuario
(español por defecto), en pasos cortos, y confirma cada fase antes de seguir.

## Reglas de seguridad (no negociables)

- **Nunca** pidas, leas, escribas ni repitas contraseñas, tokens o claves privadas. Cuando haga falta una,
  abre el archivo `motor/.env` para que la persona la pegue ella misma (en Windows: `notepad motor\.env`;
  en Mac: `open -e motor/.env`) y espera a que diga "listo".
  Para verificar sin ver el valor, comprueba solo que la línea ya no diga `PEGA_AQUI`.
- La configuración web de Firebase (apiKey, projectId, appId…) **es pública** y sí puedes recibirla.
- Inicios de sesión (Google, Firebase CLI, Claude Code, fal.ai) los hace la persona en su navegador.
- No publiques nada, no envíes mensajes ni crees pedidos en su nombre.

## Fase 0 · Requisitos

Comprueba con comandos: `node --version` (necesita 22 o superior) y `git --version`.
Si falta Node, indica que lo instale desde https://nodejs.org (versión LTS) y que reabra la terminal.
Explica lo que va a necesitar: una cuenta de Google, una suscripción de Claude (Pro o Max; con 7 agentes activos
lo realista es Max) y unos 40 minutos. La pasarela de generación de vídeo es opcional y se puede activar después.

## Fase 1 · Entrevista

Usa la herramienta de preguntas (AskUserQuestion) cuando las opciones sean cerradas; si no, pregunta en texto.
Reúne:

1. **Negocio:** nombre de la tienda, país de operación, qué vende ahora (productos activos), modelo (contra entrega),
   canal de venta (WhatsApp), plataforma de pedidos y envíos (Dropi u otra), tono de comunicación, idioma.
2. **Economía por defecto:** tasa de entrega esperada, CPA máximo tolerable, margen mínimo por pedido, quién paga el envío.
   Van a `negocio.economia` y los agentes las usan para calcular si un producto o un anuncio vale la pena.
3. **Marca:** color principal (hex), descripción corta de la identidad visual, logo opcional
   (si da un archivo, cópialo a `app/public/logo.png` y usa `/logo.png`).
4. **Dueño:** nombre y correo de Google con el que entrará (será el super admin).
5. **Nombre de la app** (por defecto "<Tienda> · Oficina").
6. **Equipo de agentes.** Muestra los roles de `roles/catalogo.json` (nombre y descripción) y propone el equipo
   inicial: coordinador, cazador_productos, guionista_ugc, director_arte, productor_video, editor_video,
   vendedor_whatsapp, operaciones_dropi. El analista_ads se añade cuando autorice el conector de Meta Ads.
   Para cada uno la persona elige el **nombre** (no propongas personajes con marca registrada).
   Recomienda dejar a productor_video **en reserva** hasta que la pasarela de generación esté configurada.
   Los nombres del cazador y de operaciones van también en `motor/rutinas.json` (campo `agente`).
7. **Conectores:** DropKiller, Dropi y Meta Ads se conectan en claude.ai → Configuración → Conectores
   (el motor los usa solo si están conectados; Meta Ads solo en lectura). Telegram para hablar con el coordinador.
   Gmail, Calendar y Drive son opcionales.
8. **Pasarela de generación (opcional):** cuenta en https://fal.ai con una recarga pequeña (10 USD basta para
   calibrar). Sin ella, el director de arte entrega prompts y las imágenes se generan a mano en ChatGPT.

Resume todo en una tabla y pide confirmación.

## Fase 2 · Firebase (la persona hace los clics, tú guías)

Guíala paso a paso en https://console.firebase.google.com :

1. **Crear proyecto** (plan gratuito Spark; Google Analytics no es necesario).
2. **Agregar app web** (ícono `</>`), sin Hosting en ese paso. Pídele que copie el objeto `firebaseConfig`
   y te lo pegue (es público).
3. **Authentication → Comenzar → Método de acceso:** habilitar **Google** y **Correo electrónico/contraseña**
   (solo el primer interruptor).
4. **Authentication → Usuarios → Agregar usuario:** el **robot del motor**. Sugiere un alias de su Gmail,
   por ejemplo `sunombre+agentes@gmail.com` (no hay que crear ningún correo nuevo), y que invente una
   contraseña larga. **No te la debe decir.**
5. **Authentication → Configuración → Acciones del usuario:** desmarcar "Habilitar creación (registro)"
   para que nadie más pueda crear cuentas con correo.
6. **Firestore Database → Crear base de datos:** modo producción, la ubicación más cercana.

## Fase 3 · Configurar

1. Escribe `instalacion.json` en la raíz con lo reunido (formato al inicio de `tools/configurar.mjs`; sin contraseñas;
   incluye `negocio.pais`, `negocio.modelo`, `negocio.canalVenta`, `negocio.plataformaPedidos`, `negocio.economia`
   y `negocio.reglas`) y ejecuta `node tools/configurar.mjs instalacion.json`. Luego borra `instalacion.json`.
2. Abre `motor/.env` para que la persona pegue la **contraseña del robot** en `AGENT_PASSWORD` y, si ya tiene la
   pasarela, la clave de fal.ai en `FAL_KEY`. Revisa con ella los topes `TOPE_TAREA_USD`, `TOPE_DIARIO_USD`
   y `TOPE_MENSUAL_USD`.
3. Edita `motor/rutinas.json`: pon los nombres reales de los agentes de operaciones y del cazador, y ajusta horas.
4. Instala dependencias: `npm install` dentro de `app/` y dentro de `motor/`
   (en Windows con PowerShell usa `npm.cmd` si los scripts están bloqueados).

## Fase 4 · Publicar la app y las reglas

1. La persona inicia sesión en Firebase CLI: `npx firebase-tools login` (se abre el navegador).
2. `npm run build` en `app/`, y luego en la raíz: `npx firebase-tools deploy --only hosting,firestore:rules`.
3. Dale la URL (`https://<projectId>.web.app`) y pídele que entre con su cuenta de Google (la del dueño).
   Debe quedar como Super Admin automáticamente (las reglas reconocen su correo).

## Fase 5 · Agentes y motor

1. En `motor/`: `npm run check` (debe decir "Verificación OK"). Si falla con credenciales, revisa el `.env` (sin leer la clave)
   y el usuario robot en Authentication.
2. `npm run crear-agentes`: crea en la app los agentes de la entrevista y guarda sus IDs en `motor/negocio.json`.
3. **Claude Code para el motor:** el motor usa el Claude Code instalado en `motor/node_modules`. Si la persona no ha
   iniciado sesión en Claude Code en este equipo, que ejecute en `motor/`: `npx claude auth login`
   (en Windows: `node_modules\.bin\claude.cmd auth login`).
4. **Servidor de medios y generación** (lo usan editor, director de arte y productor):
   `npx claude mcp add --scope user agentes-media -- node <ruta absoluta>/motor/media-server.mjs`
5. **Skills del motor:** en `motor/.claude/skills/` ya están `biblioteca-estructuras` y `produccion-anuncios`.
   Pide a la persona que copie el `SKILL.md` de sus skills de claude.ai en las carpetas `estratega-avatarhype`,
   `avatarhype-6c-prompt-engine` y `preparar-lanzamiento` (cada carpeta tiene un README con las instrucciones).
   Si el editor va a hacer animaciones con código: en `motor/`, `npx skills add heygen-com/hyperframes --all -a claude-code -y`.
6. **Conectores:** DropKiller, Dropi, Meta Ads, Gmail, Calendar y Drive se conectan en claude.ai → Configuración →
   Conectores. Después, en `motor/`, que ejecute `claude` y escriba `/mcp` para ver los nombres exactos de las
   herramientas; si difieren de los de `roles/catalogo.json` (patrón `mcp__claude_ai_<Conector>__<herramienta>`),
   corrígelos en el catálogo.
7. **Entregas directo a Google Drive** (opcional): si tiene Google Drive para escritorio, crea una carpeta en
   "Mi unidad" (p. ej. `Creativos`) y escribe `motor/media-config.json` con `{ "driveLocal": "<ruta de esa carpeta>" }`.
   Si no, los archivos quedan en `motor/entregas/<agente>`.
8. Arranca el motor: Windows `motor\iniciar-agentes.bat`; Mac/Linux `bash motor/iniciar-agentes.sh`.
   En la Oficina debe aparecer "Motor de agentes conectado".
9. Inicio automático (opcional): Windows `powershell -ExecutionPolicy Bypass -File tools\inicio-automatico-windows.ps1`;
   Mac `bash tools/inicio-automatico-mac.sh`.

## Fase 6 · Telegram (opcional)

1. En Telegram, @BotFather → `/newbot` → nombre y usuario terminado en `bot`. Recibe un token.
2. Abre `motor/.env` para que pegue el token en `TELEGRAM_BOT_TOKEN` (no te lo debe decir) y reinicia el motor.
3. Que le escriba "hola" a su bot: el bot responde con su ID. Escribe ese ID en `TELEGRAM_OWNER_ID`
   (el ID no es secreto) y reinicia el motor. Desde ahí el bot solo le responde a esa persona.

## Fase 7 · Calibración de la pasarela (si la activó)

Sigue `docs/pruebas-dia-1.md`: `node motor/calibrar.mjs --imagen <foto del producto>` genera una imagen y un clip
por modelo, muestra el coste de cada uno y deja todo en `motor/entregas/Calibracion`. Con el resultado, la persona
elige qué modelos usa el productor y corrige precios y endpoints en `motor/modelos.json` si hace falta.

## Fase 8 · Prueba final

Pídele que cree una tarea corta para el cazador en el Pipeline (por ejemplo, "3 productos de hogar con tracción en
Colombia esta semana"). Debe pasar a "En progreso", el agente aparece trabajando en la Oficina y la entrega llega a
"Espera Aprobación". Termina con un resumen: URL, agentes creados, cómo encender el motor, dónde editar agentes
(sección **Agentes**) y dónde están los topes de gasto.

## Problemas comunes

- `permission-denied` en el motor: las reglas no se publicaron, o el correo del robot en `firestore.rules`
  no coincide con el de `motor/.env`. Vuelve a ejecutar `tools/configurar.mjs` y publica las reglas.
- El dueño entra como "pendiente": el correo del dueño en `firestore.rules` (función `isOwner`) no coincide con su
  cuenta de Google. Corrígelo con `tools/configurar.mjs` y publica las reglas.
- Telegram no conecta: algunas redes bloquean api.telegram.org; el motor reintenta solo cada 30 s.
- El agente dice que no tiene permiso para una herramienta: revisa su rol en `roles/catalogo.json`
  y `motor/negocio.json → agentes[id]`, y los nombres reales con `/mcp`.
- `generar_video` dice "no configurada": falta `FAL_KEY` en `motor/.env` o aún dice `PEGA_AQUI`.
- `generar_video` falla con "fal 404" o parámetros: el endpoint o los parámetros de ese modelo cambiaron;
  corrígelos en `motor/modelos.json` mirando la página del modelo en fal.ai.
