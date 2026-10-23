# Traspaso de contexto: fábrica de anuncios con WanGP + HyperFrames

Documento para continuar el trabajo en el PC de mesa con Claude Code. Léelo entero antes de actuar.
Acompaña a `plan-produccion-anuncios-wangp.md` (el plan de producción). Fecha del traspaso: 23 de octubre de 2026.

## 1. Objetivo
Producir anuncios en vídeo de forma masiva para testear productos en Meta (Reels 9:16), con diversidad creativa,
usando WanGP en local para generar clips, voces y avatares, y HyperFrames para montar los anuncios finales
(unir clips, subtítulos, marca legible, CTA, música). Idioma de trabajo: español. Voz de los anuncios: español
latinoamericano neutro (decisión tomada: nada de acentos regionales).

## 2. Equipo y estado de la instalación
- PC de mesa: Windows 11, RTX 5060 8 GB VRAM (driver 621.01, CUDA 13.5), 32 GB RAM, Ryzen 5. Es la máquina de generación.
- Portátil: RTX 5060 8 GB, 16 GB RAM, Core Ultra 9. Solo tareas ligeras; no usar para modelos grandes.
- WanGP v18.21 (deepbeepmeep/WanGP, original, no el fork) instalado en `D:\WanGP` con el instalador automático:
  entorno `D:\WanGP\env_venv` (Python 3.11, PyTorch 2.10 CUDA 13, Triton 3.7, SageAttention 2.2, Flash 2.10,
  kernels WGPKernels, Nunchaku, NVFP4 lightx2v y GGUF). Hay un Python 3.10.6 previo en el sistema (probablemente de
  Stable Diffusion WebUI); no tocarlo. Python 3.11.9 instalado desde python.org.
- Arranque: `D:\WanGP\scripts\run.bat` (deja la ventana abierta). Interfaz en http://localhost:7860.
- IMPORTANTE: usar Microsoft Edge normal. El script `start-chrome-no-gpu.bat` rompe los desplegables de la interfaz
  (los clics no seleccionan). Si un desplegable no acepta el clic: clic en el campo, escribir parte del nombre y Enter.
- Configuración en `D:\WanGP\wgp_config.json`: `video_profile`, `image_profile`, `audio_profile` y `profile` = 4.5
  (Perfil 4+), `attention_mode` sage2, `compile` disabled, `transformer_quantization` int8, `text_encoder_quantization`
  int8, `compute_cache` true, `prevent_power_throttling` true. Servidor solo en localhost, sin `--listen` ni `--share`.
- Carpetas creadas por el usuario: `D:\WanGP\voces`, `D:\WanGP\avatares`. Pendiente crear `D:\WanGP\recetas`
  (exportar ajustes con "Export Settings to File") y `D:\WanGP\productos` (fotos de producto con fondo blanco).
- HyperFrames: el skill/plugin está instalado en Claude Code del PC. Aún NO existe proyecto; crearlo en `D:\Anuncios`
  con `npx hyperframes init --resolution portrait --non-interactive` y comprobar con `npx hyperframes doctor`
  (necesita Node 22+, FFmpeg y Chrome; si falta Chrome: `npx hyperframes browser ensure`).

## 3. Activos ya creados
- Voces (en `D:\WanGP\voces`):
  - `voz_A_grave.wav`: masculina grave (112 Hz), creada con Qwen3 Voice Design, semilla 730580485.
  - `voz_B_expresiva.wav`: masculina media y expresiva (145 Hz), semilla 795085476.
  - `voz_A_definitiva.wav`: clon de voz_A con Qwen3 Base, texto nuevo de 11 s. Parecido espectral 0,985. ES LA REFERENCIA MASCULINA.
  - `voz_C_candidata_ltx.wav`: voz femenina neutra extraída de un clip de LTX-2.5 (5 s). Semilla original 483367312.
  - `voz_C_definitiva.wav`: clon de voz_C con Qwen3 Base, 12 s. Parecido 0,95. ES LA REFERENCIA FEMENINA.
  - Voice Design para mujer dio acento extranjero; no insistir con esa vía. Si hace falta otra voz femenina, clonar desde muestra.
- Avatares (en `D:\WanGP\avatares`): `avatar_A.jpg` (hombre con móvil; descartado para producción) y `avatar_A2.jpg`
  (hombre latino treintañero, camiseta verde oliva, sofá, bulldog francés gris y blanco en el regazo, sin móvil,
  sonrisa suave, 720x1280). avatar_A2 es el avatar masculino oficial. Falta el avatar femenino.
- Producto de prueba: spray bucal para perros "Happy Pets" (imagen generada por IA; el texto de la etiqueta ya viene
  deformado). Imágenes con fondo blanco entregadas por chat: cuadrada 1080x1080, vertical 1080x1920 y vertical con la
  botella grande. Guardarlas en `D:\WanGP\productos`.

## 4. Recetas validadas y tiempos medidos (480p salvo indicación)
| Uso | Modelo en WanGP | Ajustes | Tiempo real |
|---|---|---|---|
| Prueba de humo | Wan2.2 TextImage2video FastWan 5B | 832x480, 121 fr, 3 pasos | 47 s |
| B-roll con audio | LTX-2 > 2.5 22B > Distilled NVFP4 | 832x448, 121 fr, 8 pasos | 57 s (720p: 1 min 48 s) |
| Producto imagen a vídeo | LTX-2.5 Distilled NVFP4, Start with Image, Source Strength 1 | 448x832, 121 fr | 1 min 30 s |
| Voz nueva desde descripción | TTS > Qwen3 1.7B > Voice Design | Language Spanish, Voice instruction en inglés | segundos |
| Voz clonada para cualquier guion | TTS > Qwen3 1.7B > Base | subir WAV de referencia + transcripción | segundos |
| Avatar (imagen) | Z-Image > Turbo 6B | 720x1280, 8 pasos, 4 imágenes | segundos |
| UGC con labios sincronizados | MiniMax H3 > Ref2VA Pruned 20B > FastH3 Omni NVFP4 QAD 8-Step | ver sección 5 | 4 min 40 s por 11,6 s (1ª vez 17 min por compilación) |
Descartado para labios: LTX-2.5 en modo soundtrack (correlación boca-voz 0,15; H3 llega a 0,28-0,29 y la boca se mueve
casi el doble al hablar que en silencio). Para voz en off sin cara, LTX-2.5 sigue siendo la opción.
Capacidad estimada de la sobremesa: 200-300 clips de 5 s por noche a 480p; unos 200 a 720p.

## 5. Receta UGC con H3 (la que funciona)
- Pestaña Text Only. Reference Images: avatar_A2.jpg, "Keep Backgrounds". Rescale Internally Image Ref: 120.
- Audio References: "Generate Video based on Soundtrack and Text Prompt (Soundtrack Kept)" + WAV de la voz clonada.
- Fotogramas = duración del audio x 24 (11,2 s -> 269). 480p vertical 480x832. 8 pasos, Euler, Shift 12.
- Prompt estructurado (NO escribir las palabras del guion ni mencionar el audio):
```
subject_definitions: <Subject 1> is the character from <Picture 1>.
summary: [reference generation] The referenced character talks to the camera from his sofa.
retention_analysis: <Subject 1> (appears in [Shot 1]): fully_preserved - retain identity, clothing, the sofa, the living room and the small French bulldog.
detailed_description: [Shot 1] Medium close-up of <Subject 1>, face clearly visible and centered, sitting on the sofa in the bright living room with the French bulldog beside him. He speaks directly to the camera with natural lip movements synchronized, relaxed and friendly expression, small hand gestures, eyes open and looking at the lens. Steady shot at eye level, natural window light.
overall_soundscape: Quiet living room tone.
non_diegetic_music: N/A
```

## 6. Otros prompts validados
- Producto (LTX-2.5, Start with Image, describir solo el movimiento, acotar la cámara):
```
The spray bottle from the image stands on a clean white surface and stays exactly as shown: same label, same colors, same shape. Locked-off camera with a very slow, subtle push-in; the entire bottle remains fully visible and in sharp focus for the whole clip, never closer than a medium shot. Soft studio light slowly glides across the white plastic. A warm, cheerful female voice-over speaks in neutral Latin American Spanish and says: "¡Qué belleza! Con Happy Pets el aliento de tu perrito queda fresco y sin sarro." Quiet studio room tone.
```
- Avatar masculino v2 (Z-Image Turbo):
```
Candid photo of a friendly Latino man in his early thirties, short dark hair, light stubble, plain olive t-shirt, framed from the chest up, sitting on a sofa in a bright living room, looking at the camera with a warm smile, a small French bulldog resting on his lap, hands resting naturally, no phone, natural window light, realistic skin texture, no text.
```
- Voice instruction masculina neutra (Qwen3 Voice Design):
```
A warm, friendly male voice in his early thirties, neutral Latin American Spanish with no regional accent, relaxed conversational pace, like recommending a product to a friend.
```
- Guion neutro de prueba: "Si tu perro tiene mal aliento, no es normal: casi siempre es sarro. Este spray se aplica en
  segundos, sin cepillo y sin pelea. En pocos días notas la diferencia y vuelves a disfrutar sus besos."
- Guion del beso (usado en los clones): "¿Tu perro se aleja cuando intentas darle un beso? El problema casi nunca es él:
  es el sarro. Con dos aplicaciones al día, en una semana vuelve a oler a limpio y a disfrutar los besos."
- Lecciones de prompt: los modelos deforman texto legible (marca, etiquetas): el texto va en el montaje. Evitar
  regionalismos (parcero, pues, vos). Si el avatar tiene un objeto en la mano (móvil), H3 lo arrastra y luego lo pierde.

## 7. Siguientes pasos, en orden
1. Crear el proyecto HyperFrames en `D:\Anuncios` y pasar el doctor.
2. Primer montaje de prueba con lo existente: clip UGC H3 (11,6 s, con su audio) + clip de producto vertical (5 s) +
   voz en off de cierre (clon de voz_A: frase corta con CTA) + música suave + subtítulos desde el texto del guion +
   marca "Happy Pets" + claim "Adiós al mal aliento y al sarro" + CTA "Pídelo hoy con envío gratis". 1080x1920.
3. Avatar femenino con el mismo método (Z-Image Turbo) y prueba H3 con voz_C_definitiva.wav.
4. Exportar recetas a `D:\WanGP\recetas` (UGC H3, producto LTX-2.5, voz Qwen3 Base).
5. Colas por bloque con macros y procesado nocturno:
   `python wgp.py --process cola_hook.zip --output-dir clips\hook` (desde D:\WanGP con env_venv activo; o usar
   run.bat con args.txt). Guardar colas desde la interfaz con "Save Queue".
6. Orquestador en Python (nivel 2 del plan): tabla de guiones -> voces -> clips -> filtro de calidad -> renders HyperFrames.
7. Para que Claude Code opere WanGP: arrancar con `--mcp` (ver docs/API.md de WanGP). Solo red local.

## 8. Reglas de trabajo acordadas con el usuario
- Responder siempre en español. Explicar paso a paso, con capturas cuando haya dudas.
- Verificar los resultados con medidas (duración, sincronía, parecido de voz) y no solo "a ojo".
- No exponer WanGP a internet. No usar el fork gunther-schulz/Wan2GP (auditado: limpio pero desactualizado).
