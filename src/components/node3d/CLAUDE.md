# CLAUDE.md — GGM-Node 3D modules (site scene + cabinet)

Scope of this folder: two 3D modules and their data. When a prompt is about the 3D model ("3D-модель", "шкаф",
"здание", "объект", "компонент N", "маркер", "поток", "уровень", "тур"), change ONLY the files listed below.
Never rewrite the website around them. Full specification of the site scene: `GGM_Site_3D_Prompt_v1.0.md`.

## Files and responsibilities (SOLID: one reason to change per file)
| File | Owns | Change it when |
|---|---|---|
| `src/cabinetData.js` | cabinet facts: components, connections, fire matrix, configs M/L/P0, rack layout, open items | a cabinet value, text, tag or table changes |
| `src/cabinetScene.js` | cabinet geometry, flows, views, layers, markers, API `mountCabinet` | the cabinet must look or move differently |
| `src/siteData.js` | sites (buildings, PV, loads, reserve), level texts, markers A–E, tour, host card | a site, building, number or text of levels 1–3 changes |
| `src/energyModel.js` | PV, load, priority cascade, node load (pure functions) | the energy logic changes |
| `src/siteScene.js` | site geometry, PV, energy-flow particles, levels, camera flights, fades, hand-over to the cabinet; API `mountSite` | levels 1–3 must look or behave differently |
| `src/*.d.ts` | public types | an API or data schema changes |
| `demo/*` | test pages (`index.html` cabinet, `site.html` full scene); `ui-common.js` shared formatting | the API changes |
| `tools/*` | checks, screenshots, standalone build | rarely |

Numbers live ONLY in the data files (DRY). Node reserve M/L must equal `cabinetData.configs` (checked by `test-site.mjs`).

## Coordinate systems (metres)
- **Cabinet frame** (cabinetScene and the node room in siteScene): x along the row (E-cabinet −0.8…0, IT 0…0.8, LCP 0.8…1.1),
  y up, z towards the viewer; building wall z = −1.75…−1.95; chiller outside z ≈ −3.3…−2.4; left room wall x = −3.8.
  Rack units `uy(u) = 0.10 + (u − 1) × 0.04445`.
- **Site frame** (siteScene): +x east, +z south (PV faces +z), y up, ground y = 0. Buildings are parametric (`siteData.sites[].buildings`).
- The node room is placed in its building by one transform (`rotation.y = π`, position `(L/2 − 4.1, 0, W/2 − 1.85)`), so the
  cabinet frame is preserved and the camera can hand over to the cabinet module with `poseFor('iso', aspect)` without a jump.

## How to add …
- **a site variant**: append to `siteData.sites` (one building with `node: true`, a `trafo` and a `gridline` in `extras`), give
  `pvKWp`, `bess`, `farm`, `reserveKW`, `recommend`, `facts` with status tags, `camera.site`. No code change needed.
- **a building type**: add a builder in `siteScene.js` (return `{group, roofs, wallMeshes, roofMeshes, interior, shellM, roofM, edgeM}`), map `type` in `buildWorld`.
- **a cabinet component**: see the cabinet checklist — data in `cabinetData.js`, geometry with `add(group, mesh, '<id>')`, anchor, check.
- **a tour step**: append to `siteData.tour` (level, hour, season, title, text).

## Rules
- three.js pinned to `0.128.0`. No network requests from `src/` (no fonts, no CDN, no fetch).
- Status tags: `[ПОДТВ]` datasheet/published, `[ОЦ]` estimate, `[МОД]` model, `[ДОП]` assumption, `[НОРМ]` norm, `[ЦЕЛЬ]` requirement not yet tested,
  `[ОТКР]` open. A value without a source gets `[ДОП]`. Never invent article numbers, prices, norms, section numbers.
- Website rules (brief §2.2): no farm names or addresses, no payout amounts, prices, payback, CO₂; never "runs on solar" —
  only "the flexible part of the compute moves into sun hours; at night the grid".
- Keep public APIs backwards compatible (add only). Keep `dispose()` complete. Camera/fade animations use tagged tweens (`'cam'`, `'fade'`) so a new one replaces the running one.
- Component numbers 1–32 are stable; site markers use `1`, `2` (squares) and letters `A–E`.
- Every change: one CHANGELOG line.

## Checks (run all after every change)
```bash
node tools/check-data.mjs                     # cabinet data vs scene
node tools/test-site.mjs                      # energy balance, site data, reserve parity
node tools/render-views.mjs shots dark        # cabinet: 13 views
node tools/render-site.mjs shots-site         # site: 3 sites × 4 levels + transition + tour (1440×900)
node tools/render-site.mjs shots-phone 390 844
node tools/build-standalone.mjs               # optional: dist/ggm_node_site.html (single page)
```
Open the PNGs of the affected views and describe what changed.
