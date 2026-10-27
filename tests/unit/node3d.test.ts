/**
 * The site's own figures (src/data/node.ts) must agree with the node3d package data (cabinetData.js,
 * siteData.js) — the package is the single source; node.ts only keeps them as typed quantities for the
 * sections outside the 3D chunk. Also: the claims policy withholds exactly the expected rows.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CABINET } from '../../src/components/node3d/cabinetData.js';
import { SITE } from '../../src/components/node3d/siteData.js';
import { SEASONS } from '../../src/components/node3d/energyModel.js';
import { extractText } from '../../src/components/node3d/i18n/text.ts';
import { policyMatches } from '../../src/components/node3d/i18n/policy.ts';
import {
  CONFIGS,
  CONFIG_ROWS,
  DECISIONS,
  GPU_PER_BRICK,
  NODE_SPECS,
  REV,
  SITE_REQS,
  type ConfigKey,
} from '../../src/data/node.ts';
import type { Q } from '../../src/i18n/format.ts';

function must<T>(x: T | undefined | null, msg: string): T {
  assert.ok(x != null, msg);
  return x;
}
const nums = (s: string) => [...s.matchAll(/\d+(?:,\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
const row = (c: ConfigKey, label: string) => {
  const r = CABINET.configs[c].rows.find((x) => x[0] === label);
  assert.ok(r, `${c}: row ${label}`);
  return r[1];
};
const cell = (id: string, c: ConfigKey): Q => {
  const r = CONFIG_ROWS.find((x) => x.id === id)?.cells?.[c];
  assert.ok(r, `${id}.${c}`);
  return 'q' in r && r.q && !Array.isArray(r.q) ? r.q : must((r as { q: Q[] }).q[0], `${id}.${c} q`);
};
const val = (q: Q) => (q.k === 'n' ? q.v : NaN);

test('revision equals cabinetData.revision', () => {
  assert.equal(REV.rev, CABINET.revision.rev);
  assert.equal(REV.date, CABINET.revision.date.split('.').reverse().join('-'));
});

test('P_node summer / winter equal the cabinet configs (at full IT load)', () => {
  for (const c of CONFIGS) {
    const s = row(c, 'P_node лето / зима');
    // L lists the 15 kW IT values in brackets
    const [summer, winter] = c === 'L' ? nums(s.slice(s.indexOf('('))) : nums(s);
    assert.equal(val(cell('summer', c)), summer, `${c} summer`);
    assert.equal(val(cell('winter', c)), winter, `${c} winter`);
  }
});

test('P_IT, heat, reserve and feeder protection equal the cabinet configs', () => {
  assert.equal(val(cell('pit', 'M')), nums(row('M', 'P_IT'))[0]);
  assert.equal(val(cell('pit', 'L')), nums(row('L', 'P_IT'))[0]);
  for (const c of CONFIGS) {
    assert.equal(val(cell('heat', c)), nums(row(c, 'Тепло в контуре'))[0], `${c} heat`);
    assert.equal(val(cell('reserve', c)), nums(row(c, 'Резерв ввода'))[0], `${c} reserve`);
  }
  for (const c of ['M', 'L'] as const) {
    assert.match(row(c, 'Защита фидера'), /^NH00 gG 80 A/);
    assert.equal(val(cell('fuse', c)), 80);
  }
  const req = SITE_REQS.find((r) => r.id === 'reserve')?.value;
  assert.equal(req && val(req), nums(row('L', 'Резерв ввода'))[0], 'site requirement = reserve L');
  assert.equal(SITE.node.L.reserveKW, nums(row('L', 'Резерв ввода'))[0]);
});

test('GPUs per Brick equal the rack layout', () => {
  const idx: Record<ConfigKey, number> = { M: 2, L: 3, P0: 4 };
  const brick = (name: string) => CABINET.rackLayout.find((r) => r[1] === name);
  for (const c of CONFIGS) {
    const [b1, b2] = GPU_PER_BRICK[c];
    assert.equal(nums(must(brick('GPU-Brick #1'), 'brick 1')[idx[c]] ?? '')[0] ?? 0, b1, `${c} brick 1`);
    assert.equal(nums(must(brick('GPU-Brick #2'), 'brick 2')[idx[c]] ?? '')[0] ?? 0, b2, `${c} brick 2`);
  }
});

test('supply temperature on the site equals the cabinet legend (16–18 °C)', () => {
  const supply = must(
    CABINET.text.legend.find((l) => l[0] === 'supply'),
    'legend supply',
  )[1];
  const [a, b] = nums(supply);
  const cooling = must(
    DECISIONS.find((d) => d.id === 'cooling'),
    'decision cooling',
  ).value;
  const lcp = must(NODE_SPECS.find((x) => x.id === 'lcp')?.q[0], 'spec lcp');
  for (const q of [cooling, lcp]) {
    assert.equal(q.k, 'r');
    if (q.k === 'r') assert.deepEqual([q.a, q.b], [a, b]);
  }
});

test('claims policy withholds the payback rows, nothing unhandled', () => {
  const { rows, unhandled } = policyMatches(extractText(CABINET, SITE, SEASONS));
  assert.deepEqual(unhandled, []);
  assert.deepEqual(rows.map((r) => r.rule).sort(), ['payback', 'payback']);
});
