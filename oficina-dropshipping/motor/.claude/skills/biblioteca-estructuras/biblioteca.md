# Biblioteca de estructuras de vídeo para anuncios en Meta

Operación: dropshipping contra entrega, venta por WhatsApp, anuncios en Reels 9:16.
Producción: Higgsfield en la nube (generación, montaje, análisis). Sin dependencia del PC local.
Uso: cada anuncio es una combinación de estructura + gancho + persona + escenario + oferta + estilo.
Con el código de la combinación se da la orden al guionista y al productor (plantillas al final).

Fecha: 29 de octubre de 2026. Borrador 1, pendiente de ampliar con los vídeos de ejemplo del usuario.

---

## 0. Cómo leer y usar esta biblioteca

- **Código de estructura**: letra de familia + número. Ejemplo: `B1` = Producto héroe, PAS en 5 bloques.
- **Bloques con tiempos**: orientativos para 15 a 20 s. Se recortan a 8 a 10 s en la familia H.
- **Ruta Higgsfield**: qué flujo o modelo la produce. Los nombres son los de las herramientas del conector.
- **Créditos**: estimación a partir de las equivalencias de la página de planes de Higgsfield
  (clip Kling 3.0 de 5 s ≈ 5 créditos; clip Seedance ≈ 25; hoja de avatar ≈ 17; imágenes entre 0,2 y 2).
  Bajo = menos de 15, Medio = 15 a 40, Alto = 40 a 90. Verificar con una cotización antes de producir en volumen.
- **Nombre de archivo** = código de combinación: `PRODUCTO_ESTRUCTURA_gancho_persona_cta_versión`.
  Ejemplo: `HP_B1_h02_voF_c1_v1` = Happy Pets, PAS 5 bloques, gancho pregunta, voz en off femenina, CTA pagas al recibir, versión 1.

---

## 1. Reglas de diversidad para Meta

Meta entrega mejor cuando los conceptos son distintos entre sí y recorta la entrega de los casi duplicados.
Dos vídeos con el mismo clip y distinta música cuentan como el mismo concepto.

**Seis ejes de variación**

| Eje | Opciones |
|---|---|
| Estructura | Familias A a H de esta biblioteca |
| Gancho | Biblioteca de ganchos, sección 2 |
| Persona | Avatar A, avatar B, voz en off sin cara, personaje animado, solo texto, dúo |
| Escenario | Sala, cocina, baño, parque, coche, tienda, estudio, pantalla de móvil |
| Oferta y CTA | Biblioteca de CTA, sección 2 |
| Estilo visual | Móvil realista, estudio limpio, cartoon, captura de pantalla, collage de fotos |

**Regla de los dos ejes**: en una misma semana, dos anuncios del mismo producto no comparten más de dos ejes.
**Regla de las cinco familias**: cada tanda semanal usa al menos cinco familias distintas.
**Regla de un CTA**: un solo llamado a la acción por vídeo, más una línea de confianza (pagas al recibir, garantía).

---

## 2. Bibliotecas transversales

### 2.1 Ganchos (primeros 2 a 3 segundos)

| Código | Tipo | Ejemplo de mecánica |
|---|---|---|
| h01 | Pregunta directa | "¿Tu perro se aleja cuando le das un beso?" |
| h02 | Dato o cifra | "El 80 % de los perros tiene sarro a los 3 años" |
| h03 | Confesión | "Yo pensaba que era normal que oliera así" |
| h04 | Negación | "No compres un cepillo para perro sin ver esto" |
| h05 | Reto | "Prueba esto 7 días y me cuentas" |
| h06 | Promesa con plazo | "En una semana vuelve a oler a limpio" |
| h07 | Lo que nadie te dice | "Lo que el veterinario no te cuenta del mal aliento" |
| h08 | Deja de hacer X | "Deja de pelear con tu perro para cepillarlo" |
| h09 | POV | "POV: tu perro te da un beso y no sales corriendo" |
| h10 | Objeción | "¿Y si no me llega? Pagas cuando lo tengas en la mano" |
| h11 | Resultado primero | Se muestra el después antes de explicar nada |
| h12 | Contraste visual | Antes y después en un corte seco |
| v01 | Objeto entra en plano | El producto cae o entra desde fuera del cuadro |
| v02 | Solo manos | Manos usando el producto, sin cara |
| v03 | Primer plano del problema | Dientes con sarro, piel seca, mancha |
| v04 | Acción satisfactoria | Aplicación, chorro, limpieza, corte limpio |
| v05 | Cara de reacción | Sorpresa, asco, alivio en los primeros 2 s |
| v06 | Pantalla de chat | Conversación de WhatsApp tecleándose |
| v07 | Texto grande | Frase gancho ocupando media pantalla |
| v08 | Cámara en movimiento | Caminando, selfie, coche |

### 2.2 CTA y líneas de confianza para contra entrega

| Código | CTA principal | Línea de confianza |
|---|---|---|
| c1 | "Pídelo hoy y pagas al recibirlo" | "Sin tarjeta, sin adelantos" |
| c2 | "Envío gratis a todo el país" | "Lo recibes en 2 a 4 días" |
| c3 | "Si no te sirve, lo devuelves" | "Garantía de X días" |
| c4 | "Escríbenos por WhatsApp" | "Te respondemos en minutos" |
| c5 | "Solo hoy con descuento" | "Precio normal $X, hoy $Y" |
| c6 | "Quedan pocas unidades" | "Última tanda del mes" |
| c7 | "Pide 2 y el envío va gratis" | Oferta de paquete |

### 2.3 Texto en pantalla, audio y formato

- El texto legible nunca lo genera el modelo de vídeo: va en el montaje (subtítulos, marca, precio, CTA).
- Subtítulos tipo karaoke, palabra a palabra, centrados en el tercio inferior pero por encima de la interfaz de Reels.
- Zonas seguras 9:16: dejar libres unos 250 px arriba y 350 px abajo, y el lado derecho donde van los iconos.
- Voz en off en español latino neutro, sin regionalismos. Música baja con atenuación cuando habla la voz.
- Sonoridad objetivo entre -16 y -14 LUFS. Audio nativo del modelo solo como ambiente.
- Sin afirmaciones de salud ni promesas médicas. Sin texto deformado de etiquetas: el producto real se muestra en plano fijo o imagen a vídeo.

---

## 3. Familias y estructuras

### Familia A. UGC con creador a cámara

Persona: avatar A o B generado con AI Influencer, consistente entre anuncios.
Ruta Higgsfield: flujo `ugc-video` en formato `review` (tableros con GPT Image 2 y Seedream, clips con Seedance 2.5 con audio nativo) o Marketing Studio modo UGC con `hook_id` y `setting_id`.
Inputs: hoja de avatar, 3 fotos del producto en fondo blanco. Créditos: medio a alto por anuncio.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| A1 | Review honesta | Producto nuevo, primera tanda | 0-2 gancho h03 o h01 · 2-6 contexto y problema · 6-11 demo con producto en mano · 11-15 resultado · 15-18 CTA |
| A2 | Rompe objeciones | Cuando el CPA es bueno pero la tasa de entrega baja | 0-2 objeción h10 · 2-6 respuesta 1 pagas al recibir · 6-10 objeción 2 y garantía · 10-14 objeción 3 y precio · 14-17 CTA |
| A3 | Historia personal | Nichos emocionales, mascotas, salud, bebés | 0-3 gancho narrativo · 3-8 historia · 8-12 descubrimiento del producto · 12-16 cambio · 16-19 CTA |
| A4 | Te lo tengo que contar | Tono íntimo, público femenino, selfie | 0-2 "amiga, tengo que contarte" · 2-7 qué pasó · 7-12 producto y cómo lo usa · 12-15 CTA suave c4 |
| A5 | POV caminando | Ganchos de movimiento, variedad visual | 0-2 gancho v08 · 2-8 contexto "vengo de..." · 8-13 muestra el producto · 13-16 CTA |
| A6 | Serie día 1, día 7 | Productos con resultado progresivo | Dos anuncios con el mismo avatar: 0-2 "día X" · 2-8 estado · 8-13 aplicación · 13-16 CTA. El día 7 abre con h11 |

### Familia B. Producto héroe sin cara, con voz en off

Persona: voz en off femenina o masculina neutra. Sin creador en cámara.
Ruta Higgsfield: flujo `ugc-video` en formato `product` (voz en off nativa) o clips sueltos: Kling 3.0 imagen a vídeo desde la foto del producto para el bloque de producto, Seedance 2.5 o Kling para el resto. Montaje con `video-montage`.
Inputs: fotos del producto, guion con línea de voz por bloque. Créditos: bajo a medio.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| B1 | PAS en 5 bloques | Base de cualquier producto | 0-3 gancho · 3-6 problema · 6-9 producto · 9-14 demostración y beneficio · 14-17 CTA |
| B2 | Antes y después | Productos con cambio visible | 0-3 contraste h12 · 3-6 antes · 6-11 después · 11-14 cómo se logra · 14-17 CTA |
| B3 | Demo satisfactoria sin voz | Productos de limpieza, cocina, belleza | 0-2 gancho v04 · 2-12 demo continua con texto en pantalla · 12-15 CTA en texto. Audio nativo |
| B4 | Lista de 3 | Educar al público frío | 0-2 gancho "3 señales de que..." · 2-6 señal 1 · 6-10 señal 2 · 10-14 señal 3 · 14-17 producto y CTA |
| B5 | Lo de siempre vs esto | Productos que sustituyen un hábito | 0-3 gancho comparación · 3-7 lo de siempre y su dolor · 7-12 esto · 12-15 diferencia clave · 15-18 CTA |
| B6 | Resultado primero | Retargeting y públicos tibios | 0-3 resultado final h11 · 3-6 "esto es lo que pasó" · 6-12 cómo, con producto · 12-15 CTA |
| B7 | Mito y verdad | Nichos con creencias erróneas | 0-2 "mito: ..." · 2-6 verdad · 6-12 producto como solución · 12-15 CTA |

### Familia C. Unboxing y entrega

Persona: creador visible o solo manos.
Ruta Higgsfield: flujo `ugc-video` en formato `unboxing`. Para C2, Seedance 2.5 con referencia del avatar y escena de puerta de casa.
Inputs: avatar, fotos del producto y del empaque. Créditos: medio.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| C1 | Unboxing clásico | Productos con buena presentación | 0-2 llegó el paquete · 2-6 abre y muestra · 6-11 primera prueba · 11-14 reacción · 14-17 CTA |
| C2 | Llegó y pagué al recibir | Confianza en contra entrega, públicos nuevos | 0-2 timbre o mensajero · 2-5 paga en la puerta con texto "pagas al recibir" · 5-10 abre y prueba · 10-14 CTA c1 |
| C3 | Unboxing con regalo | Ofertas de paquete y bonos | 0-2 gancho · 2-6 abre · 6-10 "y viene con..." · 10-14 CTA c7 |

### Familia D. Tutorial y uso

Persona: creador o solo manos.
Ruta Higgsfield: flujo `ugc-video` en formato `tutorial` con etiquetas Paso 1, 2, 3 generadas por el flujo.
Inputs: avatar opcional, fotos del producto, pasos de uso reales. Créditos: medio.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| D1 | Tres pasos | Productos que parecen complicados | 0-2 gancho "así se usa" · 2-6 Paso 1 · 6-10 Paso 2 · 10-14 Paso 3 · 14-17 resultado y CTA |
| D2 | Error común | Productos que corrigen un hábito | 0-2 "si haces esto, lo haces mal" · 2-7 el error · 7-12 lo correcto con el producto · 12-15 CTA |
| D3 | Rutina | Productos de uso diario | 0-2 gancho rutina · 2-12 secuencia de uso en contexto real · 12-15 CTA |

### Familia E. Conversación, podcast y entrevista

Persona: dos avatares, o entrevistador y transeúntes.
Ruta Higgsfield: Seedance 2.5 en modo `omni_reference` con dos imágenes de personaje y referencia de audio, o un clip por hablante y montaje alternado, que es más barato y más consistente. Verificar siempre la sincronía labial en español antes de aprobar.
Inputs: dos hojas de avatar, guion a dos voces. Créditos: alto.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| E1 | Dúo podcast | Autoridad y explicación | 0-3 pregunta del presentador · 3-9 respuesta del experto sobre el problema · 9-15 "lo que yo uso es..." con producto · 15-20 cierre y CTA en texto |
| E2 | Entrevista callejera | Prueba social espontánea | 0-2 pregunta a un desconocido · 2-8 dos o tres respuestas cortas · 8-13 "mira esto" con producto · 13-16 CTA |
| E3 | Nota de voz de clienta | Prueba social barata | 0-2 "escucha esto" · 2-12 nota de voz con onda de audio y subtítulos · 12-15 CTA. Montaje con gráficos, casi sin créditos |
| E4 | Reacción en pantalla dividida | Reutilizar un vídeo de producto | 0-2 creador reacciona · 2-10 vídeo del producto arriba y creador abajo · 10-14 CTA |

### Familia F. Animado y explicativo

Persona: narrador sin cara, personaje animado o mascota de marca.
Ruta Higgsfield: flujo `faceless-video` tipo Explainer (estilo no fotorrealista consistente, un narrador, subtítulos quemados) para F2 y F3; Kling o Seedance con prompt de estilo cartoon para F1 y F4, con el producto real insertado en plano fijo.
Inputs: guion, paleta de la marca, fotos del producto. Créditos: medio.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| F1 | Cartoon problema y solución | Mucha diversidad con poco riesgo de identidad | 0-3 gancho animado · 3-8 problema exagerado · 8-13 producto real en plano · 13-16 CTA |
| F2 | Explicativo con iconos | Productos con mecanismo que explicar | 0-2 gancho · 2-8 cómo funciona · 8-13 beneficios · 13-16 CTA |
| F3 | Historia ilustrada | Mascotas, bebés, regalos | 0-3 gancho · 3-12 cuento corto · 12-16 producto y CTA |
| F4 | Mascota de marca que habla | Marca con personaje propio | 0-2 saludo gancho · 2-10 explica el producto · 10-14 CTA |

### Familia G. Nativos de plataforma y bajo coste

Persona: ninguna o solo texto.
Ruta Higgsfield: flujo `video-montage` o `video-editing` con gráficos animados sobre b-roll o fotos. Generación mínima o nula.
Inputs: fotos, capturas reales con permiso, clips sobrantes de otras familias. Créditos: bajo.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| G1 | Chat de WhatsApp | Siempre: es tu canal de venta | 0-2 "mira lo que me preguntan" · 2-12 conversación de pedido tecleándose, con las dudas típicas y sus respuestas · 12-15 "pide el tuyo" CTA c4 |
| G2 | Texto grande con b-roll | Públicos que leen sin sonido | 0-2 frase gancho v07 · 2-12 tres frases cortas sobre b-roll · 12-15 CTA |
| G3 | Muro de reseñas | Prueba social acumulada | 0-2 "lo que dicen" · 2-12 capturas reales sobre b-roll · 12-15 CTA |
| G4 | Humor | Nichos jóvenes, hogar, mascotas | 0-2 situación cómica · 2-8 remate · 8-12 producto · 12-15 CTA |
| G5 | Fotos con movimiento | Catálogo rápido, retargeting | 6 fotos de 2 s con zoom suave · 12-15 CTA. Sin generación de vídeo |

### Familia H. Oferta y urgencia, 6 a 10 segundos

Persona: voz en off o solo texto.
Ruta Higgsfield: una imagen del producto animada con Kling 3.0 imagen a vídeo de 5 s, más texto en el montaje.
Inputs: foto del producto, oferta. Créditos: bajo.

| Código | Nombre | Cuándo usarla | Bloques y tiempos |
|---|---|---|---|
| H1 | Oferta directa | Retargeting y escalado de ganadores | 0-2 producto y precio · 2-6 tres beneficios en texto · 6-9 CTA c1 |
| H2 | Escasez | Fin de tanda o de mes | 0-2 "quedan X" · 2-6 producto · 6-9 CTA c6 |
| H3 | Garantía | Públicos que dudan | 0-2 "si no te sirve, no pagas" · 2-6 producto · 6-9 CTA c3 |
| H4 | ¿Sigues pensando? | Retargeting a quien vio y no compró | 0-2 pregunta · 2-6 objeción principal resuelta · 6-9 CTA |

---

## 4. Mapa de producción en Higgsfield

| Necesidad | Herramienta o flujo | Inputs | Créditos aprox. | Notas |
|---|---|---|---|---|
| Avatar consistente | AI Influencer: `ai_influencer_prepare` y `ai_influencer_generate` | Rasgos o preset | ≈ 17 por hoja | Una vez por persona; reutilizar en todos los anuncios |
| Fotos de producto en escena | `generate_image` con referencia del producto | Fotos reales fondo blanco | 0,2 a 2 por imagen | Etiqueta y forma se revisan a ojo antes de animar |
| UGC a cámara | Flujo `ugc-video` formato review | Avatar y producto | 40 a 90 por anuncio | Clips con Seedance 2.5 y audio nativo |
| Producto sin cara | Flujo `ugc-video` formato product | Producto y guion | 15 a 60 | Voz en off nativa; alternativa barata: Kling imagen a vídeo |
| Unboxing | Flujo `ugc-video` formato unboxing | Avatar, producto, empaque | 40 a 90 | |
| Tutorial con pasos | Flujo `ugc-video` formato tutorial | Avatar opcional, pasos reales | 40 a 90 | Etiquetas Paso N las pone el flujo |
| Dúo o entrevista | Seedance 2.5 omni_reference con 2 personajes, o un clip por hablante | Dos avatares, guion a dos voces | 50 a 100 | Verificar labios en español |
| Animado | Flujo `faceless-video` Explainer o Kling con estilo cartoon | Guion y paleta | 20 a 60 | Producto real siempre en plano fijo |
| Chat, texto, reseñas, fotos | Flujo `video-montage` o `video-editing` | Capturas, fotos, b-roll | 0 a 10 | La familia más barata |
| Montaje final con subtítulos | Flujo `video-montage` | Clips aprobados, texto del guion | Bajo | Sustituye a HyperFrames |
| Control de calidad | `virality_predictor` | Vídeo terminado | Bajo | Puntúa gancho y retención antes de publicar |
| Analizar referencias | `video_analysis_create` | Vídeo subido o enlace de YouTube | Bajo | Clips cortos dan mejor análisis |

---

## 5. Multiplicar ganadores sin repetir conceptos

Cuando un anuncio funciona, se multiplica cambiando un eje a la vez:

1. **Nuevo gancho o nuevo CTA sobre el mismo cuerpo**: Ad Multiplier en modo `sections` regenera solo el gancho de 4 a 15 s, el CTA de 4 a 5 s, o ambos, y los empalma al original. Es la variante más barata.
2. **Mismo anuncio, otro avatar o escenario**: Ad Multiplier en modo `edit` reemplaza persona, producto o fondo conservando movimiento, cortes y audio.
3. **Misma estructura, otro producto**: Ad Multiplier `recreate` vuelve a rodar el anuncio con otro producto o reparto manteniendo ritmo y estructura.
4. **Estructura de una referencia**: Marketing Studio con `ad_reference_id` sigue la composición, el ritmo, el gancho y la narración de un vídeo analizado, con tu avatar y tu producto. Referencias como estructura, nunca como copia.

Orden de prioridad al escalar: gancho, luego persona, luego escenario, luego oferta.

---

## 6. Plan semanal por producto y control de calidad

**Semana 1, producto nuevo**: ocho anuncios base, uno por estructura, en al menos cinco familias.
Sugerencia: A1, B1, B2, C2, D1, E3, F1, G1. Dos avatares repartidos; una pieza animada; una de chat.
Más dos ganchos alternativos en los cuatro mejores guiones vía Ad Multiplier. Total: 16 piezas.
Créditos estimados: entre 250 y 450 según modelos, dentro de un plan Plus.

**Semana 2 en adelante**: se retiran las estructuras sin resultados tras el gasto mínimo de prueba, se multiplican las ganadoras por gancho y persona, y se añaden dos familias nuevas para mantener la diversidad.

**Lista de control antes de publicar**
- Duración y formato: 9:16, 1080x1920, entre 8 y 20 s.
- Etiqueta y forma del producto correctas en todos los planos.
- Labios sincronizados cuando hay cara hablando; si no, voz en off sobre b-roll.
- Texto en zonas seguras, sin texto generado por el modelo.
- Un solo CTA y una línea de confianza.
- Puntuación del predictor de viralidad registrada en el nombre o en la tabla.
- Sin afirmaciones de salud ni comparaciones con marcas.

---

## 7. Plantillas de orden

### 7.1 Orden al guionista

```
Producto: Happy Pets spray bucal
Estructura: B1 PAS en 5 bloques
Ángulo: aliento y sarro → volver a disfrutar los besos
Gancho: h01 pregunta directa
Persona: voz en off femenina neutra
Escenario: sala de casa, luz natural
Duración: 17 s
Oferta y CTA: c1 pagas al recibir + línea "sin tarjeta"
Entrega: tabla de guion por bloques con id, tiempo, prompt visual, línea de voz, texto en pantalla
```

### 7.2 Orden al productor

```
Guion: HP_B1_h01_voF_c1_v1
Ruta: ugc-video formato product (sin cara)
Inputs: fotos del producto en Entrada (3), sin avatar
Modelo y ajustes: Seedance 2.5 omni_reference, 720p, 9:16, audio nativo; bloque de producto con Kling 3.0 imagen a vídeo
Variantes: 2 semillas por clip; conservar la mejor
Presupuesto: máximo 60 créditos; detener y preguntar si se supera
Entrega: clips aprobados por bloque, nombrados por combinación, más informe de duración y revisión de etiqueta
```

### 7.3 Orden al montador

```
Combinación: HP_B1_h01_voF_c1_v1
Clips: los aprobados del productor, en orden de bloques
Subtítulos: karaoke desde el texto del guion, tercio inferior, zona segura
Marca y precio: tarjeta final 3 s con CTA c1
Música: pista suave al 20 %, con atenuación bajo la voz
Salida: MP4 1080x1920, -16 LUFS, más puntuación del predictor de viralidad
```

---

## 8. Pendiente

- Añadir estructuras nuevas a partir de los vídeos de ejemplo del usuario (códigos X1, X2...), con su análisis de bloques y tiempos.
- Confirmar créditos reales por formato con una tanda de prueba en Higgsfield.
- Fijar los dos avatares oficiales y su hoja de personaje.
