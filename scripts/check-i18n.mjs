// i18n completeness (§12.2a b/c):
//  (b) EN/RU values are non-empty and differ from German unless language-neutral or whitelisted
//  (c) no never-translated term (src/i18n/terms.ts) written as plain text in a translation string
// (a) — no literal strings in JSX — is enforced by ESLint `react/jsx-no-literals` (see package.json).
import { flatten, loadSources } from './i18n-sources.mjs';

const { sets, TERMS, SAME_IN_ALL_LANGS } = await loadSources();
const errors = [];

const PLACEHOLDER = /\{[A-Za-z0-9_]+\}/g;
const hasWords = (s) => /\p{L}{2,}/u.test(s.replace(PLACEHOLDER, ''));
const whitelisted = (path) =>
  SAME_IN_ALL_LANGS.some((p) =>
    new RegExp(`^${p.replace(/\./g, '\\.').replace(/\*/g, '[^.]+')}$`).test(path),
  );

// Term texts per language
const termTexts = (lang) =>
  Object.entries(TERMS)
    .map(([k, t]) => [k, typeof t.text === 'string' ? t.text : t.text[lang]])
    .sort((a, b) => b[1].length - a[1].length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termRegex = (text) => new RegExp(`(?<![\\p{L}\\p{N}_])${esc(text)}(?![\\p{L}\\p{N}_])`, 'u');

for (const set of sets) {
  const de = new Map(flatten(set.de));
  for (const lang of ['en', 'ru']) {
    const tr = new Map(flatten(set[lang]));
    for (const [path, dv] of de) {
      const v = tr.get(path);
      if (v === undefined) errors.push(`[${set.name}] ${lang}: missing ${path}`);
      else if (v.trim() === '' && dv.trim() !== '') errors.push(`[${set.name}] ${lang}: empty ${path}`);
      else if (v === dv && hasWords(v) && !whitelisted(path))
        errors.push(`[${set.name}] ${lang}: identical to German ${path} = "${v.slice(0, 60)}"`);
    }
    for (const path of tr.keys()) if (!de.has(path)) errors.push(`[${set.name}] ${lang}: extra key ${path}`);
  }
  for (const lang of ['de', 'en', 'ru']) {
    const terms = termTexts(lang);
    for (const [path, v] of flatten(set[lang])) {
      const text = v.replace(PLACEHOLDER, ' ');
      for (const [key, t] of terms) {
        if (termRegex(t).test(text)) {
          errors.push(`[${set.name}] ${lang}: term "${t}" as plain text in ${path} — use {${key}}`);
          break;
        }
      }
      for (const m of v.matchAll(PLACEHOLDER)) {
        const k = m[0].slice(1, -1);
        if (/^[A-Z]/.test(k) && !(k in TERMS) && !/^q\d*$/.test(k) && !/^[a-z]/.test(k))
          errors.push(`[${set.name}] ${lang}: unknown placeholder ${m[0]} in ${path}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`check-i18n: ${errors.length} problem(s)\n` + errors.join('\n'));
  process.exit(1);
}
console.log(`check-i18n: ok (${sets.map((s) => s.name).join(', ')})`);
