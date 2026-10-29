---
name: produccion-anuncios
description: Flujo del productor de vídeo: convierte una tabla de guion por bloques en clips generados por API con presupuesto, borradores y verificación, o en un paquete de prompts si la pasarela no está configurada. Úsala en toda tarea de generar clips, creativos o anuncios en vídeo.
---

# Producción de anuncios por bloques

## 0. Antes de nada

1. Llama a `presupuesto_estado` y a `modelos_disponibles`.
2. Si la pasarela NO está configurada, trabaja en **modo prompts**: entrega un archivo con `guardar_texto` que tenga,
   por cada clip, el modelo recomendado, el prompt en inglés, la duración, la resolución y la imagen de inicio.
   Pide que los clips generados a mano queden en tu carpeta Entrada. Termina ahí.

## 1. Plan de clips

| Tipo de bloque | Modelo recomendado | Duración | Notas |
|---|---|---|---|
| Gancho, problema, demostración sin voz | `hailuo_02_std` o `wan_25` | 5 a 6 s | Texto a vídeo; cámara de móvil, luz natural |
| Producto desde tu foto | `kling_turbo` con `imagen_inicio` | 5 s | "exactly as in the reference image", plano fijo con push-in suave |
| Alguien hablando a cámara | `veo_31_fast` con `audio: true` | 8 s | La línea de voz va en el prompt entre comillas, en español latino neutro |
| CTA | reutiliza el clip de producto o `kling_turbo` | 5 s | Marca, precio y CTA los pone el montador |

Borradores para elegir ganchos: `resolucion: "480p"` en los modelos que lo admiten y la duración mínima.
Finales: 720p. Nunca 1080p salvo que la tarea lo pida.

## 2. Estimar antes de gastar

Llama a `estimar_costo` con TODOS los clips de la tarea (modelo, segundos, cantidad). Si responde "NO CABE",
no generes nada: termina con `NECESITO:` indicando el coste estimado y pidiendo aprobación o más presupuesto.

## 3. Generar

- Una toma por clip. Nombre: `códigoDeCombinación_bN_bloque`, por ejemplo `HP_B1_h01_voF_c1_v1_b3_producto`.
- Prompts en inglés, concretos: sujeto, acción, cámara, luz, estilo "handheld phone footage". Añade siempre
  "no text, no logos, no watermark". Nunca nombres de marcas ni personas reales.
- Para producto y avatar usa `imagen_inicio` con el archivo de tu carpeta Entrada.

## 4. Verificar

- `info_video` de cada clip: duración y resolución correctas.
- Mira el resultado: producto sin deformar, movimiento natural, sin texto inventado. Si hay voz, comprueba que los
  labios siguen al audio y descríbelo en el informe.
- Repite como máximo una vez los clips fallidos. Si un modelo falla dos veces con el mismo bloque, cambia de modelo
  dentro del presupuesto o deja el bloque pendiente.

## 5. Informe final

Lista por bloque: archivo, modelo, duración real, coste estimado. Total gastado según `presupuesto_estado`.
Bloques pendientes y por qué. Observaciones para el montador: orden, dónde va el texto, qué clip sirve de CTA.
