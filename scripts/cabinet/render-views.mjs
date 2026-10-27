// Visual regression helper: serves the repo, opens demo/index.html in headless Chromium and saves PNGs of fixed views.
// Usage: node scripts/cabinet/render-views.mjs [outDir=shots] [theme=light|dark]
// Requires `playwright` (dev dependency) and `three@0.128.0` in node_modules (CDN requests are redirected to it,
// so the check works offline and always uses the pinned version).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'); // repo root
const OUT = path.resolve(process.argv[2] || 'shots');
const THEME = process.argv[3] || 'light';
const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright');
let THREE_DIR = null;
try { THREE_DIR = path.dirname(require.resolve('three/package.json')); } catch { /* falls back to CDN */ }

const SHOTS = [
  ['01_iso_L', { config: 'L', view: 'iso' }],
  ['02_front', { config: 'L', view: 'front', layers: { air: false } }],
  ['03_rack_air', { config: 'L', view: 'rack', shell: 'glass' }],
  ['04_explode', { config: 'L', view: 'iso', layers: { explode: true } }],
  ['05_system', { config: 'L', view: 'system', layers: { air: false } }],
  ['06_hydro', { config: 'L', view: 'hydro', layers: { air: false } }],
  ['07_fire', { config: 'L', view: 'fire', layers: { air: false, water: false } }],
  ['08_M', { config: 'M', view: 'rack', layers: { air: false } }],
  ['09_P0', { config: 'P0', view: 'rack', layers: { air: false } }],
  ['10_dims_top', { config: 'L', view: 'top', layers: { dims: true, air: false } }],
  ['11_solid', { config: 'L', view: 'iso', shell: 'solid', layers: { air: false } }],
  ['12_select_hyd', { config: 'L', view: 'hydro', select: 'hyd', layers: { air: false } }],
  ['13_rear', { config: 'L', view: 'rear', layers: { air: false } }],
];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1, colorScheme: THEME });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
if (THREE_DIR) await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\//, r => {
  const rel = new URL(r.request().url()).pathname.replace(/^\/npm\/three@0\.128\.0\//, '');
  r.fulfill({ path: path.join(THREE_DIR, rel), contentType: 'text/javascript' });
});
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(`http://localhost:${port}/scripts/cabinet/demo/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.GGM && window.GGM.getState, null, { timeout: 30000 });
const viewer = await page.$('#viewer');
for (const [name, s] of SHOTS) {
  await page.evaluate(s => {
    const g = window.GGM; g.select(null);
    g.setConfig(s.config); g.setShell(s.shell || 'glass');
    const base = { explode: false, air: true, water: true, power: true, signals: true, fire: true, numbers: true, dims: false };
    Object.entries(Object.assign(base, s.layers || {})).forEach(([k, v]) => g.setLayer(k, v));
    g.setView(s.view, true); if (s.select) g.select(s.select);
  }, s);
  await page.waitForTimeout(s.layers && s.layers.explode ? 1600 : 500);
  await viewer.screenshot({ path: path.join(OUT, `${name}_${THEME}.png`) });
  process.stdout.write(name + ' ');
}
const state = await page.evaluate(() => window.GGM.getState());
console.log('\nstate', JSON.stringify(state));
console.log(errors.length ? 'console errors:\n' + errors.join('\n') : 'no console errors');
await browser.close(); server.close();
process.exit(errors.some(e => !/fonts|ERR_FAILED|net::/.test(e)) ? 1 : 0);
