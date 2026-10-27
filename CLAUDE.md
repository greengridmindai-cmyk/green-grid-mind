# Green Grid Mind website — notes for Claude

- German is the master language; EN/RU must stay in sync (`npm run check-i18n`). Claims policy: no prices,
  payback, farm names; `≤ 60 s` always tagged `spec`; see LAUNCH_CHECKLIST.md and README.md.
- **3D model updates** (the owner sends new revision documents regularly): follow
  `src/components/cabinet/MODEL.md`. Touch only `src/data/cabinet/*`, `src/data/node.ts` (figures) and
  `src/components/cabinet/model/*`. Do not edit the engine (`cabinetScene.js`) or site sections for a
  model revision. Bump `src/data/cabinet/revision.ts`, add `docs/model/CHANGELOG.md` entry, run
  `npm run typecheck && npm run lint && npm run check-i18n && npm test && npm run test:model`, update
  baselines only for intended changes (`npm run model:baselines`) and review the images.
- Work on a branch and open a PR; GitHub Actions deploys `main` to GitHub Pages.
- Talk to the owner in Russian.
