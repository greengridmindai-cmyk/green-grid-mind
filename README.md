# Green Grid Mind — website

Company website of Green Grid Mind: GPU compute nodes (GGM-Node, 10–15 kW IT) in existing farm buildings with PV in Bavaria and Baden-Württemberg. German master copy, full English and Russian translation, interactive 3D model of the cabinet.

Live (after GitHub Pages is enabled, see below): https://greengridmindai-cmyk.github.io/green-grid-mind/

## Stack

- Vite 8 (multi-page: `index.html`, `impressum/`, `datenschutz/`, `404.html`) · React 19 · TypeScript (strict) · Tailwind CSS v4 (tokens via `@theme`)
- three.js **0.128.0** (pinned — the 3D viewer is a verbatim port of the previous site; see "3D model")
- Fonts self-hosted via fontsource (Manrope Variable, JetBrains Mono) — no runtime requests to third parties
- No cookies, no analytics, no external scripts, fonts or media. CSP is injected at build time.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Preview/production bundle in `dist/` (always works) |
| `npm run build:prod` | Same, but **fails while any `TODO:` placeholder remains** (`scripts/check-launch.mjs`) |
| `npm run preview` | Serve `dist/` |
| `npm run typecheck` | `tsc` strict |
| `npm run lint` | ESLint (zero warnings), incl. `react/jsx-no-literals` |
| `npm run check-i18n` | Translation completeness + never-translated terms + no literal JSX strings |
| `npm test` | Unit tests (node:test): `evaluateSite` (15 cases), i18n key parity |
| `npm run test:e2e` | Playwright: i18n per language, language switch, same-origin network, legacy hash links, video rules, 3D parity |

Helper scripts (Playwright, need `npx vite preview --port 4174`):
`node scripts/render-poster.mjs` (3D poster), `node scripts/render-og.mjs` (OG image + touch icon), `node scripts/qa-screens.mjs` (screenshot report in `docs/qa/screens`).

## Structure

```
src/
  config.ts                 CONTACT_EMAIL, FORM_ENDPOINT, HERO_VIDEO, SITE_URL, LANGUAGES
  data/                     language-independent facts (single source of truth for every number)
    node.ts                 configurations M/L/P0, specs, site requirements, engineering decisions
    seasonality.ts          monthly solar batch-layer coverage (model)
    dayCurve.ts             schematic day curve
    status.ts               project timeline
    cabinet/                3D component register, connections, rack layout, legend + texts per language
  i18n/
    de.ts en.ts ru.ts       UI and section copy (de.ts is the typed master)
    legal.ts                Impressum / Datenschutz (German binding)
    terms.ts                never-translated terms + whitelist of legitimately identical strings
    format.ts               locale number/unit/date formatting
  components/               Header, MobileMenu, Footer, LanguageSwitch, sections/, charts/, cabinet/, ui/
  lib/evaluateSite.ts       Standort-Check logic (pure, unit-tested)
public/                     favicon, touch icon, OG image, robots, sitemap, media/
scripts/                    check-launch, check-i18n, encode-hero.sh, render-*, qa-screens
tests/unit, tests/e2e
docs/qa/                    screenshots, Lighthouse reports, 3D parity summary
```

## Editing copy and data

- **Numbers live once** in `src/data/*`. Copy references them through placeholders: `{q0}`, `{itLoad}` … are filled with locale-formatted values (decimal comma in DE/RU, point in EN, narrow no-break space before units).
- **Text**: edit `src/i18n/de.ts` first (German is the master). `en.ts` and `ru.ts` must have the same keys — TypeScript fails otherwise. A translation must never claim more than the German text.
- **Never-translated terms** (EMS, GPU, PV, Hausanschluss, TA Lärm, product names …) are written as `{EMS}`, `{PV}` … and rendered through `<Term>` with `translate="no"`. Writing them as plain text fails `npm run check-i18n`. `USV` becomes UPS/ИБП automatically.
- **Epistemic tags** (Bestätigt / Schätzung / Annahme / Zielwert / Offen) are set in the data files (`tag: 'est'` …). Every value that is not a datasheet fact carries one. `≤ 60 s` is always `spec`.
- Content rules (no prices, no payback, no farm names, no "runs on solar" …) are in the brief and enforced by review; see `LAUNCH_CHECKLIST.md`.

## Replacing the hero video

Until `public/media/hero.mp4` exists, the hero shows the front-elevation drawing (decided at build time).

1. Generate the clip per the brief (Appendix A) and save it as `assets-src/hero-source.mp4` (not committed).
2. Run `scripts/encode-hero.sh` (ffmpeg) → `public/media/hero.mp4`, `hero.webm`, `hero-poster.jpg/.avif`; the script fails if the size budgets are exceeded.
3. `npm run build`. Reduced motion and Save-Data always get the poster, never the video.

## 3D model

`src/components/cabinet/cabinetScene.js` is the legacy viewer ported with byte-identical geometry builders (only ES imports, the `CabinetHandle` API, localized text sprites and render-on-demand changed). It is loaded lazily when the 3D section comes within one viewport. Playwright parity tests compared it with the previous site: 3 configurations × 6 views at 0.00 % pixel difference, and identical spec values for all 23 components (`docs/qa/parity-summary.txt`). The previous single-file site was removed afterwards; to re-run the parity test, restore it with `git show 660c6d9:legacy/index.html > legacy/index.html`.

Upgrading three.js is a separate task (colour management and lights changed since r155) — see `LAUNCH_CHECKLIST.md`.

## Deployment

`.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages on every push to `main`.
One-time manual step: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Before going live with real data, work through `LAUNCH_CHECKLIST.md` (contact e-mail, Impressum/Datenschutz, legal review, engineering review).
