// Fails the production build while any `TODO:` placeholder remains in src/ or public/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src', 'public', 'impressum', 'datenschutz', 'index.html'];
const TEXT = /\.(ts|tsx|js|mjs|css|html|json|txt|xml|md|svg)$/;
const hits = [];

function walk(p) {
  const st = statSync(p, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isDirectory()) {
    for (const f of readdirSync(p)) walk(join(p, f));
    return;
  }
  if (!TEXT.test(p)) return;
  readFileSync(p, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.includes('TODO:')) hits.push(`${relative('.', p)}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
}
ROOTS.forEach(walk);

if (hits.length) {
  console.error(`check-launch: ${hits.length} TODO: placeholder(s) remain — production build blocked.\n`);
  console.error(hits.join('\n'));
  process.exit(1);
}
console.log('check-launch: no TODO: placeholders.');
