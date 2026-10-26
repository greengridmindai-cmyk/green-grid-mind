# Launch checklist — Green Grid Mind website

`npm run build:prod` fails while any `TODO:` placeholder remains in `src/`, `public/` or the HTML entries.
`npm run build` (preview) always works.

## Owner decisions
- [ ] Contact e-mail address → `src/config.ts` → `CONTACT_EMAIL` (currently `TODO:kontakt@domain.tld`)
- [ ] Form endpoint (optional) → `src/config.ts` → `FORM_ENDPOINT`. Empty = mailto fallback (no server, no third party). If set, its origin is added to the CSP `connect-src` automatically.
- [ ] Legal entity, address, representative, register entry, VAT ID → `src/i18n/legal.ts` (Impressum)
- [ ] Own domain (then update `SITE_URL`, `base` in `vite.config.ts`, canonical/hreflang/og URLs in the HTML entries, `public/robots.txt`, `public/sitemap.xml`)
- [ ] Approve the logo proposal (row in front elevation, `src/components/Logo.tsx`, `public/favicon.svg`)
- [ ] Whether to publish a host payout figure — default: **no** (brief §2.2)

## Assets
- [ ] Hero video: generate per brief Appendix A, save as `assets-src/hero-source.mp4`, run `scripts/encode-hero.sh`.
      Until `public/media/hero.mp4` exists, the hero shows the front-elevation drawing (automatic, decided at build time).
- [ ] Re-render the 3D poster after visual changes: `node scripts/render-poster.mjs` (needs `vite preview` on port 4174)
- [ ] Re-render OG image / touch icon after copy changes: `node scripts/render-og.mjs`

## Legal review
- [ ] Impressum (§ 5 DDG) — all `TODO:` lines
- [ ] Datenschutzerklärung (Art. 13 DSGVO) — controller, e-mail provider, US transfer basis for GitHub Pages, supervisory authority
- [ ] Wording „feste monatliche Vergütung“ (Für Höfe, hero, meta description)
- [ ] Heat-option wording („optional, nicht im Basisumfang“, 20–25 °C only as heat-pump source)
- [ ] Confirm the consumer-dispute sentence in the Impressum

## Engineering review
- [ ] Coolant flow: water 15/21 °C (ΔT 6 K) but the flow „≈ 45–50 l/min“ is computed for ΔT 5 K — kept from legacy with tag SCHÄTZUNG (3D panel „Vorlauf- und Rücklaufleitung“, connections table)
- [ ] GPU type / count: site uses M = 12, L = 16 × RTX PRO 6000 BSE (tag ANNAHME); the economics workbook uses M = 8 × H100 PCIe
- [ ] LCP frame size: reference unit 40 kW vs. 15 kW needed (OFFEN)
- [ ] ≤ 60 s shed time: owner of the acceptance test (tag ZIELWERT until tested)

## Manual GitHub steps
- [ ] Repo **Settings → Pages → Build and deployment → Source: GitHub Actions** (the workflow `.github/workflows/deploy.yml` deploys `dist/` on every push to `main`)

## Later
- [ ] three.js upgrade beyond r128 (colour management, physically-correct lights since r155) — separate task with new parity baselines
- [ ] Pre-rendered EN/RU pages (static HTML per language for SEO)
- [ ] Cookieless, self-hosted analytics (only if wanted)
- [ ] `frame-ancestors 'none'` needs an HTTP header — not possible on GitHub Pages (ignored in `<meta>` CSP); add when moving to a host with header control
