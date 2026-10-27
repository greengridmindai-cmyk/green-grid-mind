// Builds one self-contained HTML page from a demo page: inlines its CSS and all relative ES modules
// (dependency order, imports/exports stripped); `three` stays a bare import resolved by the page's importmap (jsDelivr).
// Usage: node scripts/cabinet/build-standalone.mjs [page=scripts/cabinet/demo/site.html] [out=scripts/cabinet/dist/ggm_node_site.html]
// The website does NOT use this file; it is for sharing the model as a single page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'); // repo root
const PAGE = path.resolve(ROOT, process.argv[2] || 'scripts/cabinet/demo/site.html');
const OUT = path.resolve(ROOT, process.argv[3] || 'scripts/cabinet/dist/ggm_node_site.html');
const IMPORT_RE = /^import\s+(?:\{([^}]*)\}|(\*\s+as\s+\w+)|(\w+))\s+from\s+'([^']+)';\s*$/gm;

const order = [], seen = new Set(), bare = new Map();
function visit(file) {
  if (seen.has(file)) return; seen.add(file);
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(IMPORT_RE)) if (m[4].startsWith('.')) visit(path.resolve(path.dirname(file), m[4]));
  order.push(file);
}
function transform(file) {
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(IMPORT_RE, (all, named, star, def, from) => {
    if (!from.startsWith('.')) { bare.set(all.trim(), true); return ''; }
    if (!named) return '';                                  // default/namespace imports of local modules are not used
    return named.split(',').map(s => s.trim()).filter(Boolean).map(s => { const [a, b] = s.split(/\s+as\s+/); return b ? `const ${b} = ${a};` : ''; }).join('\n');
  });
  src = src.replace(/^export default \w+;\s*$/gm, '').replace(/^export (const|function|let|class|async function) /gm, '$1 ');
  if (/^\s*export\s/m.test(src)) throw new Error('unhandled export in ' + file);
  return `// ===== ${path.relative(ROOT, file)} =====\n${src}`;
}

const html = fs.readFileSync(PAGE, 'utf8');
const entry = html.match(/<script type="module" src="([^"]+)"><\/script>/);
const cssHref = html.match(/<link rel="stylesheet" href="([^"]+)">/);
visit(path.resolve(path.dirname(PAGE), entry[1]));
const body = order.map(transform).join('\n');
const code = [...bare.keys()].join('\n') + '\n' + body;
const css = fs.readFileSync(path.resolve(path.dirname(PAGE), cssHref[1]), 'utf8');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">';
const out = html.replace(cssHref[0], fonts + '\n<style>\n' + css + '\n</style>')
  .replace(/<!-- Local preview[^>]*-->\n/, '')
  .replace(entry[0], () => '<script type="module">\n' + code + '\n</script>');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log('written', path.relative(ROOT, OUT), (out.length / 1024).toFixed(0) + ' KB,', order.length, 'modules:', order.map(f => path.basename(f)).join(', '));
