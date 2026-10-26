// QA screenshot report (§12.6): every section at the four reference viewports → docs/qa/screens/*.jpg
// Usage: npm run build && npx vite preview --port 4174 & node scripts/qa-screens.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.QA_URL ?? 'http://localhost:4174/green-grid-mind/';
const SIZES = [
  [1487, 1058, 'desktop-1487'],
  [1440, 900, 'desktop-1440'],
  [834, 1194, 'tablet-834'],
  [390, 844, 'phone-390'],
];
const SECTIONS = [
  'top',
  'prinzip',
  'knoten',
  'modell',
  'hoefe',
  'standort-check',
  'unternehmen',
  'status',
  'kontakt',
];
mkdirSync('docs/qa/screens', { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const [w, h, name] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 500) await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(800);
  for (const id of SECTIONS) {
    await page.evaluate((s) => {
      const el = document.getElementById(s);
      if (!el) return;
      window.scrollTo(0, s === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 72);
    }, id);
    await page.waitForTimeout(id === 'modell' ? 3500 : 700);
    await page.screenshot({ path: `docs/qa/screens/${name}-${id}.jpg`, type: 'jpeg', quality: 70 });
  }
  await page.close();
}
await browser.close();
console.log('docs/qa/screens written');
