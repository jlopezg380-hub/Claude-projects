# Plan de producción masiva de anuncios con WanGP + HyperFrames

Equipo: sobremesa RTX 5060 8 GB / 32 GB RAM (generación), portátil (guion, montaje, publicación).
Tiempos medidos: 5 s a 480p con audio ≈ 1 min; 5 s a 720p ≈ 1 min 50 s. Capacidad nocturna ≈ 200–300 clips.

## 1. Estructura modular del anuncio (5 bloques)

| Bloque | Duración | Qué es | Cómo se genera |
|---|---|---|---|
| 1 Hook | 2–3 s | Gancho: pregunta, choque, POV, antes/después | LTX-2.5 texto a vídeo, o avatar hablando |
| 2 Problema | 3–4 s | Mal aliento, sarro, dueño que se aparta | LTX-2.5 texto a vídeo |
| 3 Producto | 3–4 s | Plano del producto real | LTX-2.5 imagen a vídeo desde la foto |
| 4 Demostración / beneficio | 3–5 s | Aplicación del spray, perro feliz | LTX-2.5 texto a vídeo o avatar |
| 5 CTA | 2–3 s | Producto + oferta + llamada a la acción | Imagen a vídeo corto + texto en montaje |

Vídeo final = bloque 1 + 2 + 3 + 4 + 5, 15–20 s, 1080x1920.
La voz en off se genera una sola vez por guion (Index TTS 2/2.5 con voz paisa clonada) y corre por encima de los cinco bloques.
Subtítulos, nombre de marca legible, precio y CTA se añaden en HyperFrames. Nunca se le pide texto legible al modelo de vídeo.

## 2. Formatos recomendados, por orden de fiabilidad

1. **Explicativo / b-roll con voz en off**. Clips de perro y dueño + producto real + CTA. No necesita sincronía labial. Es el formato de arranque y el de mayor volumen.
2. **UGC con avatar fijo**. Mismo avatar en todos los anuncios. Dos rutas a probar: MiniMax H3 Ref2VA (referencias: foto del avatar + foto del producto + audio de la voz) o LTX-2.5 en modo "Generate Video based on Soundtrack and Text Prompt" con el WAV de la voz clonada.
3. **Animado / cartoon problema–solución**. Estilo dibujo para hook y problema; producto real en el bloque 3. Mucha diversidad, poco riesgo.
4. **Dúo tipo podcast** para hooks. Más adelante, con Index TTS 2 a dos voces y H3 Ref2VA o Multitalk.

Unboxing: descartado por ahora; el plano principal se graba con el móvil.

## 3. Diversidad creativa: qué variar y cuánto

- Hooks: 8 por producto (pregunta, dato, choque, POV del dueño, antes/después, objeción, comparación, humor).
- Problema: 4 variantes visuales.
- Producto: 3 variantes de cámara y fondo.
- Demostración: 4 variantes.
- CTA: 3 ofertas (descuento, envío gratis, garantía).
- Voces: 2–3 clones (mujer paisa, hombre paisa, neutra).
- Estilo: realista y cartoon. Música: 3 pistas.

Combinaciones posibles: 8 × 4 × 3 × 4 × 3 = 1.152. Producción semanal razonable: 40–60 vídeos elegidos por diseño (cada hook con cada ángulo), no al azar.

## 4. Pipeline paso a paso

### Paso 1. Guion en tabla
Una hoja con columnas: id, bloque, formato, prompt, duración, imagen de inicio, línea de voz, voz. Los ángulos y hooks salen del método de guiones UGC (skill estratega-avatarhype) con Claude.

### Paso 2. Voces
Index TTS 2.5 en WanGP, pestaña TTS. Muestra limpia de 10–20 s de una voz paisa real con permiso. Un WAV por guion. Emoción con etiquetas entre corchetes. Guardar en voces/.

### Paso 3. Generación en WanGP, una cola por bloque
- Bloque 3 (producto): Start with Image con las fotos de producto en JPG fondo blanco 9:16; "Multiple Images as Texts Prompts" = "Match images and text prompts"; prompt con cámara acotada.
- Bloques 1, 2, 4: LTX-2.5 texto a vídeo. Un párrafo por clip (cada párrafo separado por línea en blanco genera un vídeo). Macros para variantes:
  ```
  ! {Perro}="french bulldog","golden retriever","beagle" : {Lugar}="sunny living room","kitchen","park bench"
  A {Perro} yawns right into its owner's face in a {Lugar}; the owner recoils and laughs. Handheld phone footage, natural light.
  ```
- `Repeat generation` = 2 para tener dos semillas por prompt.
- Resolución 720p 9:16, 3–5 s por clip (73–121 fotogramas).
- Guardar cola con "Save Queue" y procesar de noche:
  ```
  python wgp.py --process cola_hook.zip --output-dir clips\hook
  python wgp.py --process cola_producto.zip --output-dir clips\producto
  ```

### Paso 4. Curación
Revisar en la galería. Mover a clips/<bloque>/aprobados. Tasa esperable: 50–70 % útiles. El resto se borra.

### Paso 5. Montaje con HyperFrames (portátil)
- Plantilla HTML con cinco huecos, pista de voz, música con ducking, subtítulos desde el texto del guion, marca legible, precio y CTA.
- Un CSV de combinaciones (id_video, hook, problema, producto, demo, cta, voz, musica) → script que genera una composición por fila → `npx hyperframes render` → MP4 1080x1920.
- Claude escribe la plantilla y el script la primera vez.

### Paso 6. Publicación y aprendizaje
Nombre de archivo = id de combinación (ej. HP_h03_p02_pr01_d04_c02). Subir a Meta. Medir por hook y ángulo. La semana siguiente, mantener los hooks ganadores y variar el resto.

## 5. Pruebas pendientes antes de industrializar

1. Index TTS 2.5: clonar una voz paisa y escuchar.
2. LTX-2.5 modo "Generate Video based on Soundtrack and Text Prompt" con ese WAV: calidad de sincronía labial.
3. MiniMax H3 FastH3 Omni NVFP4 8-Step (Ref2VA) con foto de avatar + foto de producto + audio: consistencia y tiempo en 8 GB.
4. HyperFrames en el portátil: plantilla de cinco bloques y primer render.
