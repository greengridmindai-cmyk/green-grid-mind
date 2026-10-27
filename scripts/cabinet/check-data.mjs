// Consistency check for src/cabinetData.js against the scene. Run: node scripts/cabinet/check-data.mjs
// Fails (exit 1) on: duplicate id/n, numbering gaps, unknown anchor group, missing fields, unknown status tags,
// scene ids without data or data ids without scene meshes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CABINET as D } from '../../src/components/node3d/cabinetData.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'); // repo root
const scene = fs.readFileSync(path.join(ROOT, 'src/components/node3d/cabinetScene.js'), 'utf8');
const err = [];
const TAGS = ['ПОДТВ', 'ОЦ', 'МОД', 'ДОП', 'НОРМ', 'ОТКР'];
const groupsInScene = new Set([...scene.matchAll(/grp\('([a-zA-Z0-9]+)'/g)].map(m => m[1]));

const ids = new Set(), nums = [];
for (const c of D.components) {
  for (const k of ['id', 'n', 'group', 'g', 'name', 'f', 'fs', 's', 'ps', 'st', 'l', 'anchor']) if (c[k] === undefined) err.push(`${c.id}: missing ${k}`);
  if (ids.has(c.id)) err.push(`duplicate id ${c.id}`); ids.add(c.id); nums.push(c.n);
  if (!TAGS.includes(c.st)) err.push(`${c.id}: unknown status ${c.st}`);
  if (c.anchor && !groupsInScene.has(c.anchor.group)) err.push(`${c.id}: anchor group '${c.anchor.group}' not created in cabinetScene.js`);
  if (!D.groups.some(g => g.key === c.group)) err.push(`${c.id}: unknown group ${c.group}`);
  if (!new RegExp(`'${c.id}'`).test(scene)) err.push(`${c.id}: no mesh registered with this id in cabinetScene.js`);
  const txt = JSON.stringify(c);
  for (const m of txt.matchAll(/\[([А-ЯЁ]{2,5})(?=[\]\s,—])/g)) if (!TAGS.includes(m[1])) err.push(`${c.id}: unknown tag [${m[1]}`);
}
nums.sort((a, b) => a - b).forEach((n, i) => { if (n !== i + 1) err.push(`numbering gap/duplicate at ${n} (expected ${i + 1})`); });
for (const k of ['M', 'L', 'P0']) if (!D.configs[k]) err.push(`config ${k} missing`);
if (!D.fireMatrix || !Array.isArray(D.fireMatrix.cols)) err.push('fireMatrix.cols missing');
else D.fireMatrix.rows.forEach((r, i) => { if (r.length !== D.fireMatrix.cols.length + 1) err.push(`fireMatrix row ${i} has ${r.length} cells, expected ${D.fireMatrix.cols.length + 1}`); });

console.log(`components ${D.components.length}, connections ${D.connections.length}, open items ${D.openItems.length}, rev ${D.revision.rev}`);
if (err.length) { console.error('FAIL\n' + err.join('\n')); process.exit(1); }
console.log('OK');
