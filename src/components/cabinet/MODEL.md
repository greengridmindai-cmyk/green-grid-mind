# 3D model — how to apply a new revision document

The cabinet design changes often. A revision should touch **only the files listed below** — never the
site sections, styles or the engine. Everything else (3D table, front elevation, rack table, marker list,
availability per configuration, airflow) follows from the data automatically.

## Where things live

| What changes in the document | Edit | Also updates automatically |
|---|---|---|
| Revision number / date | `src/data/cabinet/revision.ts` | 3D header "Rev …", status timeline |
| Rack: what is in which U, per configuration, GPU counts | `src/data/cabinet/rackLayout.ts` → `RACK_LAYOUT` | 3D rack equipment + blanking panels, airflow zones, "Rack-Belegung" table, front elevation drawing, component availability per config |
| A component's specs, values, epistemic tags | `src/data/cabinet/components.ts` (numbers + tags) and `text.de.ts` / `text.en.ts` / `text.ru.ts` (labels, function text, links) | 3D panel, keyboard list |
| New component | `components.ts` (id, next number, group, specs) + texts in all 3 languages + marker in `model/layout.js → ANCHORS` + meshes registered with that id in a builder | numbered marker, list, panel |
| Geometry of one section | the section builder in `model/` (table below) | — |
| Marker position, camera views, exploded view | `model/layout.js` (`ANCHORS`, `VIEWS`, `EXPLODE`, `FLY_FAR`) | — |
| Connections (cables, pipes, protocols) | `src/data/cabinet/connections.ts` + `conn.rows` in the 3 text files | "Anschlüsse" table |
| Configuration power figures (P_IT, heat, node power, fuse, reserve) | `src/data/node.ts → CONFIG_ROWS` | configuration tables (GGM-Node + 3D) |
| Row dimensions (800 / 800 / 300, 2 000, 1 200 mm) | `src/data/node.ts → ROW` **and** the geometry in the builders | dimension labels in 3D + front elevation |
| Open questions, room requirements, principle texts | `open`, `room`, `principle` in the 3 text files | reference groups below the 3D stage |

### Model builders (`src/components/cabinet/model/`)

| File | Part |
|---|---|
| `kit.js` | helpers (`box`, `M`, `shell`, `tube`, `dashed`, `uy` …) and coordinate system — rarely changes |
| `layout.js` | markers, camera views, exploded view, colours, group names |
| `room.js` | floor, ground, walls |
| `ecab.js` | energy cabinet: board, EMS, UPS, PE, Not-Aus |
| `rack.js` | IT rack: enclosure, rails, PDUs, sensors, equipment (from `RACK_LAYOUT`), blanking panels |
| `lcp.js` | heat exchanger: coil, fans, controller |
| `outdoor.js` | chiller, heat-recovery option, NSHV, cable tray, uplink, drip tray |
| `water.js` | supply/return pipes, heat-recovery branch, flow beads |
| `power.js` | power cables |
| `signals.js` | data/control lines, Not-Aus loop |
| `airflow.js` | closed air loop particles |
| `dims.js` | dimension lines and room labels (texts localized by the viewer) |
| `index.js` | builds all parts in order and names the groups |

`../cabinetScene.js` is the engine (renderer, camera, picking, layers, API). A revision does not need it.

Coordinates: metres; origin = front-left corner of the IT rack at floor level; x → right, y ↑,
z towards the viewer (rear of the row at z = −1.2). Rack units: `uy(u)` = 0.10 m + (u − 1) × 44.45 mm.

## Rules

- Numbers live once: values in `components.ts` / `node.ts` / `rackLayout.ts`, never typed into text files.
- Every value that is not a manufacturer datasheet fact gets an epistemic tag (`ok`, `est`, `asm`, `spec`, `open`).
- Claims policy of the brief still applies (no prices, payback, farm names; `≤ 60 s` always `spec`).
- Terms (EMS, GPU, LCP, NSHV …) are written as `{EMS}` in texts; `npm run check-i18n` enforces it.

## Checklist for every revision

1. Bump `revision.ts`; add an entry to `docs/model/CHANGELOG.md` (what changed, source document).
2. Edit data / builders as in the tables above.
3. `npm run typecheck && npm run lint && npm run check-i18n && npm test`
   - `tests/unit/model.test.ts` checks markers, numbering, texts, rack overlaps. Its "rev 0.1 baseline"
     assertions are a tripwire: update them when the rack layout changes on purpose.
4. Visual check: `npm run test:model` compares 18 views (3 configs × 6 views) with approved images.
   - Unchanged parts must stay at 0 %. For the intended change: `npm run model:baselines`, then look at
     the new images in `tests/e2e/model-baselines/` before committing them.
5. `npm run test:e2e` (languages, links, network) and re-render the poster:
   `npx vite preview --port 4174 & node scripts/render-poster.mjs`.
6. Commit on a branch, open a PR, merge → GitHub Actions deploys.
