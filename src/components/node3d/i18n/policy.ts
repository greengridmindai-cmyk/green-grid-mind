/**
 * Website claims policy (brief §2.2, LAUNCH_CHECKLIST.md) applied to the module data at render time:
 * no payback figures and no farm names on the site. Rows of the Russian master that match are withheld in
 * every language (they stay in cabinetData.js / siteData.js; the owner decides in the package). The list
 * is printed by `npm run check-i18n`; a match outside a table row fails the check.
 */
import type { CabinetData } from '../cabinetData.d.ts';
import type { SiteData } from '../siteData.d.ts';
import type { Node3dText } from './text.ts';

const RULES: { id: string; re: RegExp }[] = [
  { id: 'payback', re: /окупаем/i },
  { id: 'farm-name', re: /\b[A-ZÄÖÜ][a-zäöüß]+hof\b/ },
];

/** Paths whose last segment is a row index; a matching cell withholds the whole row. */
const ROW_PATHS = [
  /^(cabinet\.components\.[^.]+\.s\.\d+)\.\d+$/,
  /^(cabinet\.(?:connections|openItems|review|rackLayout)\.\d+)\.\d+$/,
  /^(cabinet\.fireMatrix\.rows\.\d+)\.\d+$/,
  /^(site\.sites\.[^.]+\.facts\.\d+)\.\d+$/,
  /^(site\.roomFacts\.\d+)\.\d+$/,
  /^(cabinet\.components\.[^.]+\.ps)$/,
];

export function flatten(obj: unknown, prefix = ''): [string, string][] {
  if (typeof obj === 'string') return [[prefix, obj]];
  const out: [string, string][] = [];
  if (Array.isArray(obj))
    obj.forEach((v, i) => out.push(...flatten(v, prefix ? `${prefix}.${i}` : String(i))));
  else if (obj && typeof obj === 'object')
    for (const [k, v] of Object.entries(obj)) out.push(...flatten(v, prefix ? `${prefix}.${k}` : k));
  return out;
}

export interface Withheld {
  path: string;
  rule: string;
  text: string;
}

/** Rows withheld by the policy (computed on the Russian master) and matches that cannot be withheld. */
export function policyMatches(master: Node3dText): { rows: Withheld[]; unhandled: Withheld[] } {
  const rows: Withheld[] = [];
  const unhandled: Withheld[] = [];
  for (const [path, text] of flatten(master)) {
    if (path.startsWith('scene.')) continue;
    const rule = RULES.find((r) => r.re.test(text));
    if (!rule) continue;
    const row = ROW_PATHS.map((re) => re.exec(path)?.[1]).find(Boolean);
    const w = { path: row ?? path, rule: rule.id, text };
    if (!row) unhandled.push(w);
    else if (!rows.some((x) => x.path === row)) rows.push(w);
  }
  return { rows, unhandled };
}

/** Remove withheld rows from the live module objects (after the translation was applied). */
export function applyPolicy(cab: CabinetData, site: SiteData, rows: Withheld[]): void {
  const sorted = [...rows].sort((a, b) => b.path.localeCompare(a.path, 'en', { numeric: true }));
  for (const { path } of sorted) {
    const p = path.split('.');
    const idx = Number(p[p.length - 1]);
    if (p[0] === 'cabinet' && p[1] === 'components') {
      const comp = cab.components.find((c) => c.id === p[2]);
      if (!comp) continue;
      if (p[3] === 'ps') comp.ps = comp.fs;
      else comp.s.splice(idx, 1);
    } else if (p[0] === 'cabinet' && p[1] === 'fireMatrix') cab.fireMatrix.rows.splice(idx, 1);
    else if (p[0] === 'cabinet')
      (cab[p[1] as 'connections' | 'openItems' | 'review' | 'rackLayout'] as unknown[]).splice(idx, 1);
    else if (p[0] === 'site' && p[1] === 'sites') site.sites.find((s) => s.id === p[2])?.facts.splice(idx, 1);
    else if (p[0] === 'site' && p[1] === 'roomFacts') site.roomFacts.splice(idx, 1);
  }
}
