# Pruebas del día 1: calibrar la generación de vídeo

Objetivo: ver con tus ojos qué calidad da cada modelo con TU producto, saber el precio real por clip y decidir con qué
modelos trabaja el productor. Coste total previsto: entre 3 y 6 USD.

## Antes de empezar (15 minutos)

1. Cuenta en https://fal.ai y recarga de 10 USD (Billing). Crea una clave en Settings → API Keys.
2. Pega la clave en `motor/.env` en la línea `FAL_KEY=`. Nunca la pegues en el chat.
3. En `motor/`: `npm install` (si no lo has hecho).
4. Deja una foto real de tu producto en fondo blanco, vertical si es posible, por ejemplo `fotos/producto.jpg`.
5. Opcional: revisa `motor/modelos.json`. Cada modelo tiene `endpoint`, precio y parámetros con la marca
   `"verificar": true`. Si fal.ai cambió un nombre de modelo, aquí es donde se corrige.

## Paso 1 · Calibración automática (20 minutos)

En `motor/`:

```
node calibrar.mjs --imagen ../fotos/producto.jpg
```

Genera una imagen por modelo de imagen y un clip por modelo de vídeo, usando tu foto como referencia donde el
modelo lo admite. Para probar solo algunos: `--solo hailuo_02_std,kling_turbo`. Para cambiar la frase del avatar
hablado: `--voz "tu frase en español"`.

Resultado: carpeta `motor/entregas/Calibracion` con los archivos y un `informe-calibracion.md` con coste y tiempo
por modelo. El gasto queda anotado en `motor/logs/gasto.json`.

## Paso 2 · Evaluar (20 minutos)

Abre cada archivo y puntúa de 1 a 5 en esta tabla:

| Modelo | Producto fiel (etiqueta, forma) | Movimiento natural | Labios y voz | Precio real en fal.ai | ¿Lo usamos? |
|---|---|---|---|---|---|
| flux_schnell | | | | | |
| flux_dev | | | | | |
| nano_banana (con referencia) | | | | | |
| hailuo_02_std | | | | | |
| wan_25 | | | | | |
| kling_turbo (con referencia) | | | | | |
| veo_31_fast (hablado) | | | | | |
| seedance_15_pro | | | | | |

Compara el coste estimado del informe con el cargo real en tu cuenta de fal.ai y corrige los precios en
`motor/modelos.json`. Los topes del presupuesto se calculan con esos precios.

## Paso 3 · Decidir (10 minutos)

- Modelo para b-roll y escenas sin voz: normalmente el más barato que apruebe la prueba.
- Modelo para el bloque de producto desde tu foto: el que respete mejor la etiqueta.
- Modelo para avatar hablando: el que tenga labios creíbles. Si ninguno convence, los bloques hablados se hacen con
  voz en off sobre b-roll hasta probar otra opción de lip-sync.
- Escribe la decisión en la tabla de la skill `motor/.claude/skills/produccion-anuncios/SKILL.md`, sección "Plan de clips".

## Paso 4 · Primer anuncio real (30 minutos)

1. Deja la foto del producto en `motor/entregas/<nombre del productor>/Entrada/`.
2. En el Pipeline crea una tarea para el guionista: producto, estructura B1, gancho h01, voz en off, CTA c1.
   Cuando entregue, apruébala y crea la tarea del productor con el guion y presupuesto 3 USD.
3. El productor estima, genera a 480p y entrega los clips. Revisa. Si convencen, pide los finales a 720p.
4. Tarea al editor: montar el anuncio con subtítulos, marca, precio y CTA.

Si algo falla por permisos o nombres de herramientas, revisa `/mcp` dentro de `claude` y `roles/catalogo.json`.
