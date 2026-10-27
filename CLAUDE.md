# Green Grid Mind website — notes for Claude

- German is the master language; EN/RU must stay in sync (`npm run check-i18n`). Claims policy: no prices,
  payback, farm names; `≤ 60 s` always tagged `spec`; see LAUNCH_CHECKLIST.md and README.md.
- Work on a branch and open a PR; GitHub Actions deploys `main` to GitHub Pages.
- Talk to the owner in Russian.

## 3D scene of GGM-Node: object → building → room → cabinet (self-contained modules)

Location: `src/components/node3d/`. Rules: `src/components/node3d/CLAUDE.md`. Specification:
`src/components/node3d/GGM_Site_3D_Prompt_v1.0.md`.

The rule applies whenever a request mentions: 3D, сцена, здание, объект, коровник, PV, поток, уровень, тур, шкаф,
компонент N, маркер, вид, слой, LCP, ИБП, гидромодуль, чиллер, пожарная, cabinet, component.

1. Change only `src/components/node3d/siteData.js`, `energyModel.js`, `siteScene.js`, `cabinetData.js`,
   `cabinetScene.js`, the `.d.ts` files, `i18n/de.ts` + `i18n/en.ts` (the same change in both), the package
   `CHANGELOG.md`, and `SiteViewer.tsx` only if an API changed.
2. Numbers and texts live only in the data files (`siteData.js`, `cabinetData.js`; Russian masters).
3. three.js stays `0.128.0`; no network requests.
4. Status tags are mandatory: `[ПОДТВ]` datasheet, `[ОЦ]` estimate, `[ДОП]` assumption, `[НОРМ]` norm, `[ОТКР]` open
   (also `[МОД]` model, `[ЦЕЛЬ]` requirement not yet tested). A value without a source gets `[ДОП]`. Never upgrade an
   estimate to `[ПОДТВ]`. Never invent article numbers, prices, norms or section numbers.
5. Component numbers are stable; a new component gets the next number.
6. Before the commit run: `npm run model:check` (check-data + test-site), `npm run check-i18n` (incl.
   `scripts/cabinet/check-i18n-cabinet.mjs`), `npm run model:render` (render-views dark → `docs/qa/cabinet`,
   render-site desktop → `docs/qa/site`, phone 390 × 844 → `docs/qa/site-phone`), `npm run build`,
   `npm run typecheck`, `npm run lint`, `npm test`. Look at the screenshots and describe the changes.
7. One commit per request (`feat(node3d)` / `fix(node3d)`) plus a line in `src/components/node3d/CHANGELOG.md`.
8. Website rules stay: no farm names, payouts or prices; never "runs on solar" — the flexible part of the compute
   moves into the sun hours, at night the grid. Rows that break this are withheld by `i18n/policy.ts` and listed by
   `npm run check-i18n`; fix them in the data, not in the wrapper.
9. On a conflict with an engineering rule or inconsistent values, stop and tell the owner.
