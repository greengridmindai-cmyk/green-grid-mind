// Renders public/media/cabinet-poster.webp from the iso view of the 3D model (§8.5).
// Usage: npm run build && npx vite preview --port 4174 & node scripts/render-poster.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = process.env.POSTER_URL ?? 'http://localhost:4174/green-grid-mind/?e2e#modell';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(URL);
await page.waitForFunction(() => '__ggm' in window, null, { timeout: 60_000 });
await page.addStyleTag({
  content: '.cab-stage{width:1440px!important;height:900px!important;min-height:0!important;border:0!important}.cab-grid{grid-template-columns:1440px!important}.cab-side{display:none!important}',
});
await page.evaluate(() => document.querySelector('.cab-stage')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(500);
await page.evaluate(() => window.__ggm.setView('iso', true));
await page.waitForTimeout(2500);
const data = await page.evaluate(() => window.__ggm.canvas.toDataURL('image/webp', 0.78));
mkdirSync('public/media', { recursive: true });
const buf = Buffer.from(data.split(',')[1], 'base64');
writeFileSync('public/media/cabinet-poster.webp', buf);
console.log(`cabinet-poster.webp ${(buf.length / 1024).toFixed(1)} KB`);
await browser.close();
