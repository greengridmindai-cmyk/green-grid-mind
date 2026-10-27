# Changelog

## 0.4.0-site.1 — 27.10.2026 (website integration)
- `cabinetData.js` open item 13: farm name replaced by „один пилотный объект“ (website brief §2.2: no farm names; owner's decision). Only change against the v0.4 package.

## 0.4.0 — 27.10.2026 (site scene 1.0, cabinet 0.3.1)
- New module `siteScene.js` + `siteData.js` + `energyModel.js`: 4 levels in one scene (object → building → node room → cabinet),
  3 site variants from the pilot registry (anonymised): dairy large 386 kWp, dairy ≈ 80 cows 100 kWp, commercial 500 kWp [ДОП].
- Energy flows as particles with kW labels; priority cascade PV → farm → battery → node (flexible part) → grid; time of day and season;
  M/L switch changes node load, heat and the connection-reserve gauge (L on the medium farm shows "reserve insufficient").
- Camera flights with arcs, cutaway fades of roof and walls, section-cut room walls; pose-matched cross-fade into the cabinet module.
- Tour "Как это работает" (6 steps), host card without amounts, markers 1/2 + A–E, breadcrumbs, Esc = back.
- Cabinet 0.3.1: `poseFor()`, `setPaused()`, layer `scale` (1.8 m figure), service-zone floor marking, LED panels, skirting,
  theme-aware outlines (technical-drawing look in dark theme). API unchanged otherwise.
- Tools: `render-site.mjs`, `test-site.mjs`; `build-standalone.mjs` is now a generic inliner for any demo page.

## 0.3.0 — 26.10.2026
- Model extracted from the single-file page into an ES module (`mountCabinet`) + data file (`cabinetData.js`) + types.
- New components: 31 Umluftkühler (room fan coil on glycol), 32 hydraulic module (pump on UPS, buffer 100 l, expansion vessel ≈ 18 l, motorised shut-off valves, drip tray).
- Board: MCCB 80 A with Unterspannungsauslöser, RCM Typ B, UPS-output distribution (PDU A/B, LCP, pump, EMS); NSHV: NH00 gG 80 A outgoing.
- LCP, pump and EMS powered from the UPS (continuous cooling); new view `hydro`; layer key `signals` (was `signal`), `numbers` (was `labels`), shell `hidden` (was `off`).
- Data corrected against sources (Eaton 614-40268-00: D 63 A input; Rittal 5311116: 15 000 N, 79 kg; Intarcon WW-FD smallest 32.6 kW is low-temperature only), glycol flow ≈ 42 l/min at ΔT 6 K, buffer ride-through ≈ 4 min at 15 kW, leakage budget ≈ 35 / 110 mA, fire matrix: EPO de-energises LCP and pump on extinguishing; E-cabinet fire leaves the feeder live up to the MCCB.
- Tools: `check-data.mjs`, `render-views.mjs` (13 views, light/dark), `build-standalone.mjs`.

## 0.2 — 26.10.2026
Fire safety (components 17–25), LCP 3313.230, Not-Aus → trip + UPS EPO. Single-file page.

## 0.1 — 26.10.2026
First model: row E/IT/LCP, cooling option C.
