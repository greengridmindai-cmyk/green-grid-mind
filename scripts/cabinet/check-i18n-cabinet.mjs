// Translation check for the node3d modules: every Russian text of cabinetData.js / siteData.js / the engines
// has a German and an English counterpart (src/components/node3d/i18n/{de,en}.ts) at the same key, and
// status tags and numbers are identical across languages. Also lists the rows withheld by the claims policy.
// Run: node scripts/cabinet/check-i18n-cabinet.mjs (part of `npm run check-i18n`; exit 1 on failure).
import { CABINET } from '../../src/components/node3d/cabinetData.js';
import { SITE } from '../../src/components/node3d/siteData.js';
import { SEASONS } from '../../src/components/node3d/energyModel.js';
import { extractText } from '../../src/components/node3d/i18n/text.ts';
import { flatten, policyMatches } from '../../src/components/node3d/i18n/policy.ts';
import { de } from '../../src/components/node3d/i18n/de.ts';
import { en } from '../../src/components/node3d/i18n/en.ts';

const TAG_RE = /\[(ПОДТВ|ОЦ|МОД|ДОП|НОРМ|ОТКР|ЦЕЛЬ)(?:\s*—[^\]]*)?\]/g;
const CYR = /[А-Яа-яЁё]/;
/** a bare status code (e.g. the status column of the connections table) stays as it is */
const CODE = /^(ПОДТВ|ОЦ|МОД|ДОП|НОРМ|ОТКР|ЦЕЛЬ)$/;
const tags = (s) => [...s.matchAll(TAG_RE)].map((m) => m[1]).join(' ');
/** Numbers as values: SI-grouped thousands joined, decimal comma → point; compared as a sorted multiset. */
const numbers = (s) =>
  [...s.replace(TAG_RE, ' ').matchAll(/\d+(?:[ \u00a0\u202f]\d{3})*(?:[.,]\d+)?/g)]
    .map((m) => String(Number(m[0].replace(/[ \u00a0\u202f]/g, '').replace(',', '.'))))
    .sort()
    .join(' ');

const master = extractText(CABINET, SITE, SEASONS);
const ru = new Map(flatten(master));
const errors = [];
let checked = 0;

for (const [lang, dict] of [
  ['de', de],
  ['en', en],
]) {
  const tr = new Map(flatten(dict));
  for (const [path, rv] of ru) {
    const v = tr.get(path);
    if (!CYR.test(rv)) {
      if (v !== undefined && v !== rv && !path.startsWith('scene.') && numbers(v) !== numbers(rv))
        errors.push(`${lang}: ${path}: language-neutral value changed`);
      continue;
    }
    checked++;
    if (CODE.test(rv)) {
      if (v !== rv) errors.push(`${lang}: status code changed in ${path}: ${rv} → ${v}`);
      continue;
    }
    if (v === undefined) {
      errors.push(`${lang}: missing ${path}`);
      continue;
    }
    if (!v.trim()) errors.push(`${lang}: empty ${path}`);
    if (CYR.test(v.replace(TAG_RE, '')))
      errors.push(`${lang}: Cyrillic text left in ${path}: "${v.slice(0, 70)}"`);
    if (tags(v) !== tags(rv))
      errors.push(`${lang}: status tags differ in ${path}: [${tags(rv)}] vs [${tags(v)}]`);
    if (numbers(v) !== numbers(rv))
      errors.push(`${lang}: numbers differ in ${path}: {${numbers(rv)}} vs {${numbers(v)}}`);
  }
  for (const path of tr.keys())
    if (!ru.has(path)) errors.push(`${lang}: extra key ${path} (no such row in the master)`);
}

const { rows, unhandled } = policyMatches(master);
for (const u of unhandled) errors.push(`policy (${u.rule}) matches text outside a table row: ${u.path}`);

if (rows.length) {
  console.log(`check-i18n-cabinet: ${rows.length} row(s) withheld from the website by the claims policy:`);
  for (const r of rows) console.log(`  - ${r.path} (${r.rule})`);
}
if (errors.length) {
  console.error(`check-i18n-cabinet: ${errors.length} problem(s)\n` + errors.join('\n'));
  process.exit(1);
}
console.log(
  `check-i18n-cabinet: ok (${checked / 2} texts × de, en; rev ${CABINET.revision.rev} / site ${SITE.revision.rev})`,
);
