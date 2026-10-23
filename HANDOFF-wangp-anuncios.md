# Traspaso de contexto: fábrica de anuncios con WanGP + HyperFrames

Documento para continuar el trabajo en el PC de mesa con Claude Code. Léelo entero antes de actuar.
Acompaña a `plan-produccion-anuncios-wangp.md` (el plan de producción). Fecha del traspaso: 23 de octubre de 2026.
Última actualización: 22 de octubre de 2026 por la noche, tras completar en el PC de mesa los pasos 1 a 4 de la sección 7
(proyecto HyperFrames, primer montaje, avatar femenino + prueba H3, recetas exportadas). Lo nuevo va marcado como **[HECHO]**.

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
- **[HECHO]** Claude Code opera la interfaz de WanGP sin tocar la ventana del usuario, desde el navegador integrado de la app
  de Claude (http://localhost:7860): desplegables con clic + Ctrl+A + texto + Enter; subida de archivos por JavaScript
  (`fetch('/gradio_api/file=D:/WanGP/outputs/<archivo>')` -> `File` -> `DataTransfer` sobre el `input[type=file]` del
  componente + evento `change`; solo sirve archivos de `outputs`, así que lo que esté en otra carpeta se copia antes allí);
  textareas con el setter nativo de `value` + evento `input`. El botón **Load Settings From Media File / Json / Zip** acepta un
  MP4/JPG/WAV generado por WanGP o un zip de `recetas` y restaura modelo y ajustes (los medios de referencia hay que
  volver a subirlos). **Export Settings to File** + Include Media descarga el zip solo a `C:\Users\jlope\Downloads`.
  No se usó el modo `--mcp` ni la API Python: un segundo proceso competiría por RAM/VRAM con la interfaz abierta.
- Configuración en `D:\WanGP\wgp_config.json`: `video_profile`, `image_profile`, `audio_profile` y `profile` = 4.5
  (Perfil 4+), `attention_mode` sage2, `compile` disabled, `transformer_quantization` int8, `text_encoder_quantization`
  int8, `compute_cache` true, `prevent_power_throttling` true. Servidor solo en localhost, sin `--listen` ni `--share`.
- Carpetas: `D:\WanGP\Voces`, `D:\WanGP\Avatares`, `D:\WanGP\productos` (las 3 imágenes del spray con fondo blanco) y
  **[HECHO]** `D:\WanGP\recetas` (4 zips exportados + `README.md`, ver sección 9).
- **[HECHO]** HyperFrames: proyecto creado en `D:\Anuncios` (CLI 0.8.186 fijada en `package.json`, 1080x1920, nombre
  `anuncios`). `npx hyperframes doctor` pasa en todo lo obligatorio (Node 24, FFmpeg 8, Chrome headless, GPU RTX 5060 en
  modo hardware); fallan solo opcionales (whisper-cpp, Kokoro, MusicGen, Docker). OJO: `npx hyperframes init` crea una
  subcarpeta `my-video`; se movió todo a la raíz. Al actualizar skills, `hyperframes skills update` retiró los skills
  antiguos (hyperframes-core, -animation, -audio, -creative, -keyframes, -studio): todo vive ahora en
  `~/.claude/skills/hyperframes/references` (captions.md, format.md, types/vertical.md, etc.).
- **[HECHO]** Herramientas auxiliares en `D:\Anuncios\.tools`: `venv` (Python 3.11 con faster-whisper, mediapipe, opencv) y
  `scripts/` (`transcribe.py` tiempos por palabra, `lipsync.py` y `lagcurve.py` sincronía boca-voz, `gen_musicgen.py`
  música con MusicGen usando `D:\WanGP\env_venv`, que ya trae torch + transformers). No hay credenciales de HeyGen ni
  Gemini; la música se genera en local.

## 3. Activos ya creados
- Voces (en `D:\WanGP\voces`):
  - `voz_A_grave.wav`: masculina grave (112 Hz), creada con Qwen3 Voice Design, semilla 730580485.
  - `voz_B_expresiva.wav`: masculina media y expresiva (145 Hz), semilla 795085476.
  - `voz_A_definitiva.wav`: clon de voz_A con Qwen3 Base, texto nuevo de 11 s. Parecido espectral 0,985. ES LA REFERENCIA MASCULINA.
  - `voz_C_candidata_ltx.wav`: voz femenina neutra extraída de un clip de LTX-2.5 (5 s). Semilla original 483367312.
  - `voz_C_definitiva.wav`: clon de voz_C con Qwen3 Base, 12 s. Parecido 0,95. ES LA REFERENCIA FEMENINA.
  - Voice Design para mujer dio acento extranjero; no insistir con esa vía. Si hace falta otra voz femenina, clonar desde muestra.
  - **[HECHO]** `D:\Anuncios\assets\audio\voz_cierre_cta.wav`: clon de voz_A_definitiva (Qwen3 Base, semilla 437431190,
    4,71 s) diciendo "Pídelo hoy con envío gratis y pagas al recibirlo. Tu perro te lo va a agradecer." Transcripción
    verificada con Whisper: palabra por palabra.
- Avatares (en `D:\WanGP\Avatares`): `Avatar_A.webp` (hombre con móvil; descartado para producción) y `Avatar_A2.webp`
  (hombre latino treintañero, camiseta verde oliva, sofá, bulldog francés gris y blanco en el regazo, sin móvil,
  sonrisa suave, 720x1280). avatar_A2 es el avatar masculino oficial.
  - **[HECHO]** `avatar_C.jpg`: avatar femenino oficial (latina treintañera, pelo largo oscuro recogido suelto, camiseta
    terracota, mismo sofá y bulldog francés en el regazo, 720x1280, Z-Image Turbo semilla 711007491, imagen 2 de 4).
    Las otras tres candidatas quedan como `avatar_C_candidata_*.jpg`. Emparejado con voz_C.
- Producto de prueba: spray bucal para perros "Happy Pets" (imagen generada por IA; el texto de la etiqueta ya viene
  deformado). Imágenes con fondo blanco en `D:\WanGP\productos` (cuadrada 1080x1080, vertical 1080x1920 y vertical con la
  botella grande) y copias en `D:\Anuncios\assets\img`.
- **[HECHO]** Clips en `D:\Anuncios\assets\video`: `ugc_h3_avatarA2_beso.mp4` (H3, 11,64 s, el de las 19:10),
  `producto_ltx_vertical.mp4` (LTX-2.5, 768x1344, 5 s, el de las 14:04; es un zoom fuerte: solo sirve el tramo 0,7-4,0 s),
  `ugc_h3_avatarC_beso.mp4` y `_v2` (H3 con voz_C, 12,25 s, dos semillas) y `ugc_h3_avatarC_beso_sync.mp4` (el mismo con
  el audio adelantado 0,125 s, ver sección 9). Música: `D:\Anuncios\assets\bgm\musica_suave_v1.wav` (MusicGen small,
  24 s, acústica suave, semilla 7).
- **[HECHO]** Primer anuncio renderizado: `D:\Anuncios\out\happypets_test_v1.mp4` (20 s, 1080x1920, 30 fps, -18,3 LUFS).

## 4. Recetas validadas y tiempos medidos (480p salvo indicación)
| Uso | Modelo en WanGP | Ajustes | Tiempo real |
|---|---|---|---|
| Prueba de humo | Wan2.2 TextImage2video FastWan 5B | 832x480, 121 fr, 3 pasos | 47 s |
| B-roll con audio | LTX-2 > 2.5 22B > Distilled NVFP4 | 832x448, 121 fr, 8 pasos | 57 s (720p: 1 min 48 s) |
| Producto imagen a vídeo | LTX-2.5 Distilled NVFP4, Start with Image, Source Strength 1 | 448x832, 121 fr | 1 min 30 s |
| Voz nueva desde descripción | TTS > Qwen3 1.7B > Voice Design | Language Spanish, Voice instruction en inglés | segundos |
| Voz clonada para cualquier guion | TTS > Qwen3 1.7B > Base | subir WAV de referencia + transcripción | 1 min 19 s por 4,7 s de voz (medido el 22/10 con H3 aún en RAM) |
| Avatar (imagen) | Z-Image > Turbo 6B | 720x1280, 8 pasos, 4 imágenes | ~1 min las 4 (carga del modelo incluida) |
| UGC con labios sincronizados | MiniMax H3 > Ref2VA Pruned 20B > FastH3 Omni NVFP4 QAD 8-Step | ver sección 5 | 4 min 40 s por 11,6 s (1ª vez 17 min por compilación); ~4 min por 12,25 s con avatar C |
Descartado para labios: LTX-2.5 en modo soundtrack (correlación boca-voz 0,15; H3 llega a 0,28-0,29 y la boca se mueve
casi el doble al hablar que en silencio). Para voz en off sin cara, LTX-2.5 sigue siendo la opción.
**[HECHO]** Métrica reproducible de sincronía (sección 9): clip A2 de las 19:10 = correlación 0,31 a desfase 0, pico 0,38 a
+1/+2 fotogramas, boca 1,9x más activa al hablar. Clips de avatar C + voz_C = pico 0,28-0,31 pero a +4 fotogramas (los
labios se adelantan ~170 ms al audio, con dos semillas distintas): se corrige adelantando el audio 0,125 s en el montaje.
Capacidad estimada de la sobremesa: 200-300 clips de 5 s por noche a 480p; unos 200 a 720p.

## 5. Receta UGC con H3 (la que funciona)
- Pestaña Text Only. Reference Images: avatar_A2.jpg, "Keep Backgrounds". Rescale Internally Image Ref: 120.
- Audio References: "Generate Video based on Soundtrack and Text Prompt (Soundtrack Kept)" + WAV de la voz clonada.
- Fotogramas = duración del audio x 24 (11,2 s -> 269). 480p vertical 480x832. 8 pasos, Euler, Shift 12.
  **[HECHO]** Los metadatos del clip validado de las 19:10 dicen 277 fotogramas (`video_length`), ventana deslizante 362,
  `audio_prompt_type` AS, `video_prompt_type` I, semilla 548717248. Al subir un WAV, WanGP ajusta solo los fotogramas a
  su duración (voz_C de 11,9 s -> 294). Para el avatar femenino, el mismo prompt con "her sofa", "on her lap", "She speaks"
  y en `retention_analysis` "long dark hair, terracotta t-shirt".
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
- **[HECHO]** Avatar femenino C (Z-Image Turbo, 720x1280, 8 pasos, semilla 711007491):
```
Candid photo of a friendly Latina woman in her early thirties, long dark hair tied back loosely, light natural makeup, plain terracotta t-shirt, framed from the chest up, sitting on a sofa in a bright living room, looking at the camera with a warm smile, a small French bulldog resting on her lap, hands resting naturally, no phone, natural window light, realistic skin texture, no text.
```
- **[HECHO]** Texto de la voz de cierre (Qwen3 Base, referencia voz_A_definitiva + transcripción del guion del beso):
  "Pídelo hoy con envío gratis y pagas al recibirlo. Tu perro te lo va a agradecer."
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
1. **[HECHO 22/10]** Proyecto HyperFrames en `D:\Anuncios`; doctor y check en verde.
2. **[HECHO 22/10]** Primer montaje: `D:\Anuncios\out\happypets_test_v1.mp4` (20 s). Estructura: UGC A2 0-11,64 s con su
   audio y subtítulos karaoke (bloque `caption-pill-karaoke` del registro, tiempos por palabra de Whisper) + producto
   11,64-14,94 s (tramo 0,7-4,0 s del clip, contrazoom, claim "Adiós al mal aliento y al sarro", marca grande) + voz de
   cierre 11,9-16,6 s + tarjeta final 14,94-20 s (marca, foto, botón "Pídelo hoy con envío gratis") + música a 0,2 con
   fundidos. Sonoridad -18,3 LUFS (objetivo social -16 a -14: subir un par de dB antes de pautar). Archivos:
   `index.html` + `compositions/{ugc,producto,overlays,captions,endcard}.html`.
3. **[HECHO 22/10]** `avatar_C.jpg` y dos clips H3 con voz_C (12,25 s); labios adelantados ~170 ms, corregido en
   `ugc_h3_avatarC_beso_sync.mp4`.
4. **[HECHO 22/10]** Recetas en `D:\WanGP\recetas` (sección 9).
5. Colas por bloque con macros y procesado nocturno:
   `python wgp.py --process cola_hook.zip --output-dir clips\hook` (desde D:\WanGP con env_venv activo; o usar
   run.bat con args.txt). Guardar colas desde la interfaz con "Save Queue".
6. Orquestador en Python (nivel 2 del plan): tabla de guiones -> voces -> clips -> filtro de calidad -> renders HyperFrames.
7. Para que Claude Code opere WanGP: arrancar con `--mcp` (ver docs/API.md de WanGP). Solo red local.

## 8. Reglas de trabajo acordadas con el usuario
- Responder siempre en español. Explicar paso a paso, con capturas cuando haya dudas.
- Verificar los resultados con medidas (duración, sincronía, parecido de voz) y no solo "a ojo".
- No exponer WanGP a internet. No usar el fork gunther-schulz/Wan2GP (auditado: limpio pero desactualizado).

## 9. Recetas exportadas y verificación (añadido el 22 de octubre de 2026)
- `D:\WanGP\recetas` (cada zip = `queue.json` con una tarea bajo la clave `params` + medios de referencia; se cargan con
  "Load Settings From Media File / Json / Zip" o con `python wgp.py --process recetas\<zip> --output-dir clips\<bloque>`):
  - `ugc_h3_avatarA2_vozA.zip`: H3, 277 fr, Avatar_A2.webp + voz_A_definitiva.wav, semilla fija 548717248.
  - `ugc_h3_avatarC_vozC.zip`: H3, 294 fr, avatar_C.jpg + voz_C_definitiva.wav, prompt en femenino, semilla -1.
  - `producto_ltx25_happypets.zip`: LTX-2.5 Distilled NVFP4, Start with Image, fuerza 1, 121 fr, semilla fija 764000982.
  - `voz_qwen3_base_vozA.zip`: Qwen3 Base, Spanish, clonación de 1 voz, voz_A_definitiva.wav + transcripción.
  - Para producción masiva poner las semillas fijas a -1. El `README.md` de la carpeta explica todo esto.
- Verificación de clips UGC (obligatoria tras cada H3): `D:\Anuncios\.tools\venv\Scripts\python.exe -I
  D:\Anuncios\.tools\scripts\lagcurve.py <clip>` imprime la correlación entre el movimiento de la boca (caja x 0,40-0,60,
  y 0,30-0,40 del cuadro) y la envolvente de la voz para desfases de -8 a +8 fotogramas. Bueno = pico >= 0,3 con desfase
  entre -1 y +2. Si el pico cae en +4 o más, regenerar con otra semilla o adelantar el audio 0,125 s en el montaje
  (`ffmpeg ... -filter_complex "[0:a]atrim=start=0.125,asetpts=PTS-STARTPTS[a]"`). Descartada la apertura de boca por
  puntos faciales (MediaPipe): no distingue ni el clip bueno.
- Verificación de audio: `transcribe.py` (faster-whisper small, CPU) da texto y tiempos por palabra; comparar con el guion y
  con el WAV original (en los clips H3 las marcas coinciden al centésimo). Loudness con `ffmpeg -af ebur128`.
- Montaje HyperFrames: cada vídeo en su propia subcomposición con `data-start` dentro (si se envuelve en un div con
  tiempo, lint falla); `data-media-start` para recortar; audio como `<audio>` con `data-volume`/`data-fade-*`; un host con
  `data-track-kind="captions"` para todos los subtítulos. `npx hyperframes check` y `snapshot --at` antes de `render`
  (41 s por 20 s a 1080x1920 en la sobremesa).
