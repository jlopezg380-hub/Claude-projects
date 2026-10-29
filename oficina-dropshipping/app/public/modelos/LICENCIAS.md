# Modelos 3D de la Oficina (campus)

Todos los modelos de esta carpeta son de dominio público (CC0 1.0). No exigen atribución, pero la damos con gusto.

| Carpeta | Paquete | Autor | Licencia | Origen |
|---|---|---|---|---|
| `personajes/` | Ultimate Animated Character Pack (2019), convertido a GLB | Quaternius (quaternius.com) | CC0 1.0 | github.com/wellmota/tutory-personagens (mirror) |
| `muebles/kenney/` | Furniture Kit 2.0 | Kenney (kenney.nl) | CC0 1.0 | github.com/Hidencod/tge-assets (mirror en GLB) |
| `muebles/kaykit/` | KayKit Furniture Bits 1.0 y Restaurant Bits 1.0 | Kay Lousberg (kaylousberg.com) | CC0 1.0 | github.com/Cherbooo/OpenHome3D (mirror en GLB) |
| `naturaleza/` | Nature Kit 2.1 | Kenney | CC0 1.0 | github.com/Hidencod/tge-assets |
| `ciudad/` | City Kit Suburban (planter, path) y KayKit City Builder Bits 1.0 (streetlight, bench, bush) | Kenney y Kay Lousberg | CC0 1.0 | tge-assets y github.com/KayKit-Game-Assets |

Texto de la dedicación CC0: https://creativecommons.org/publicdomain/zero/1.0/

Para añadir modelos: copia el `.glb` en la carpeta del paquete y regístralo en `app/src/office/modelos.js`.
`node tools/catalogo-modelos.mjs` lista lo que hay en disco y lo que el catálogo espera y falta.
