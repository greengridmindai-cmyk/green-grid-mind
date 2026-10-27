// Visual check of the site scene: serves the repo, opens demo/site.html, walks 3 sites × 4 levels and saves PNGs.
// Usage: node scripts/cabinet/render-site.mjs [outDir=shots-site] [width=1440] [height=900]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'); // repo root
const OUT = path.resolve(process.argv[2] || 'shots-site');
const VW = +(process.argv[3] || 1440), VH = +(process.argv[4] || 900);
const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright');
let THREE_DIR = null; try { THREE_DIR = path.dirname(require.resolve('three/package.json')); } catch { /* CDN */ }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, colorScheme: 'dark' });
const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
if (THREE_DIR) await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\//, r => r.fulfill({ path: path.join(THREE_DIR, new URL(r.request().url()).pathname.replace(/^\/npm\/three@0\.128\.0\//, '')), contentType: 'text/javascript' }));
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(`http://localhost:${server.address().port}/scripts/cabinet/demo/site.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.GGMSITE && window.GGMSITE.getState().siteData, null, { timeout: 30000 });
const stage = await page.$('.stage');
const shot = async name => { await page.waitForTimeout(700); await (VW < 700 ? page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true }) : stage.screenshot({ path: path.join(OUT, name + '.png') })); process.stdout.write(name + ' '); };
const ev = (fn, arg) => page.evaluate(fn, arg);
const sites = await ev(() => window.GGMSITE.data.sites.map(s => s.id));
const only = process.env.SITES ? process.env.SITES.split(',') : sites;
for (const id of only) {
  await ev(async id => { await window.GGMSITE.setSite(id); }, id); await page.waitForTimeout(400);
  await shot(`${id}_1_site`);
  await ev(async () => { const s = window.GGMSITE; s.setConfig('L'); await s.setLevel('building'); }); await shot(`${id}_2_building_L`);
  await ev(() => window.GGMSITE.setConfig('M')); await shot(`${id}_2_building_M`);
  await ev(() => window.GGMSITE.setTime(22)); await shot(`${id}_2_building_M_night`);
  await ev(async () => { const s = window.GGMSITE; s.setTime(13); s.setConfig('L'); await s.setLevel('room'); }); await shot(`${id}_3_room`);
  await ev(async () => { await window.GGMSITE.setLevel('cabinet'); }); await shot(`${id}_4_cabinet`);
  await ev(async () => { await window.GGMSITE.setLevel('site'); });
  if (VW < 700) break;
}
// transition frame (mid-flight into the cabinet)
await ev(async () => { const s = window.GGMSITE; await s.setSite(s.data.sites[0].id); await s.setLevel('room'); });
await page.evaluate(() => { window.GGMSITE.setLevel('cabinet'); }); await page.waitForTimeout(600); await stage.screenshot({ path: path.join(OUT, 'zz_transition.png') });
// tour step 3
await ev(() => window.GGMSITE.setLevel('site')); await page.waitForTimeout(2500);
await ev(() => { window.GGMSITE.tour('start'); }); await page.waitForTimeout(2600); await ev(() => window.GGMSITE.tour('next')); await page.waitForTimeout(3200); await shot('zz_tour_step2');
await ev(() => window.GGMSITE.tour('stop'));
const mem = await ev(() => 0);
console.log('\n' + (errors.length ? 'errors:\n' + errors.join('\n') : 'no console errors'), mem);
await browser.close(); server.close();
process.exit(errors.some(e => !/fonts|ERR_FAILED|net::/.test(e)) ? 1 : 0);
