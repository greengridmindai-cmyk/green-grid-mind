// Renders public/media/site-poster.webp (level 1 of the node3d site scene) — shown while the 3D chunk loads.
// Usage: npm run build && npx vite preview --port 4174 & node scripts/render-poster.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = process.env.POSTER_URL ?? 'http://localhost:4174/green-grid-mind/?e2e#modell';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, reducedMotion: 'reduce' });
await page.goto(URL);
await page.waitForFunction(() => '__ggm' in window, null, { timeout: 60_000 });
await page.addStyleTag({
  content:
    '.n3d-stage{width:1440px!important;height:900px!important;min-height:0!important;border:0!important}.n3d-grid{grid-template-columns:1440px!important}.n3d-panel{display:none!important}',
});
await page.waitForSelector('.n3d-panel-in', { state: 'attached' });
await page.evaluate(() => document.querySelector('.n3d-stage')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(2500);
const data = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/webp', 0.78));
      };
      img.src = window.__ggm.screenshot();
    }),
);
mkdirSync('public/media', { recursive: true });
const buf = Buffer.from(data.split(',')[1], 'base64');
writeFileSync('public/media/site-poster.webp', buf);
console.log(`site-poster.webp ${(buf.length / 1024).toFixed(1)} KB`);
await browser.close();
