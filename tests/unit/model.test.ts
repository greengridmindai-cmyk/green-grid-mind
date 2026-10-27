/**
 * Consistency of the 3D model data — runs in milliseconds, catches most mistakes of a model update
 * before the (slower) visual regression test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENTS, AVAILABLE_IN } from '../../src/data/cabinet/components.ts';
import { RACK_LAYOUT, blankRanges, installedRanges } from '../../src/data/cabinet/rackLayout.ts';
import { MODEL_REVISION } from '../../src/data/cabinet/revision.ts';
import { textDe } from '../../src/data/cabinet/text.de.ts';
import { textEn } from '../../src/data/cabinet/text.en.ts';
import { textRu } from '../../src/data/cabinet/text.ru.ts';
import { ANCHORS, EXPLODE, GROUPS, VIEWS } from '../../src/components/cabinet/model/layout.js';

const ids = COMPONENTS.map((c) => c.id);

test('every component has a 3D marker and every marker belongs to a component', () => {
  assert.deepEqual(Object.keys(ANCHORS).sort(), [...ids].sort());
  for (const [id, a] of Object.entries(ANCHORS)) {
    assert.ok(GROUPS.includes(a[0]), `${id}: unknown group "${a[0]}"`);
    assert.equal(a.length, 4, `${id}: [group, x, y, z]`);
    assert.ok(
      a.slice(1).every((v: unknown) => typeof v === 'number' && Number.isFinite(v)),
      `${id}: coordinates`,
    );
  }
});

test('component numbers are 1…n without gaps or duplicates', () => {
  assert.deepEqual(
    COMPONENTS.map((c) => c.n),
    COMPONENTS.map((_, i) => i + 1),
  );
});

test('every component has name, function and spec texts in DE, EN and RU', () => {
  for (const t of [textDe, textEn, textRu])
    for (const c of COMPONENTS) {
      const ct = t.comp[c.id];
      assert.ok(ct?.name && ct.f, `${c.id}: name/function`);
      for (const s of c.specs) assert.ok(ct.specs[s.id], `${c.id}.${s.id}`);
    }
});

test('rack layout: units within 1…42, no overlaps, bricks are 4U with ≤ 8 GPU', () => {
  const used = new Map<number, string>();
  for (const r of RACK_LAYOUT) {
    if (!r.u) continue;
    const [a, b] = r.u;
    assert.ok(a >= 1 && b <= 42 && a <= b, `${r.id}: range ${a}–${b}`);
    for (let u = a; u <= b; u++) {
      assert.ok(!used.has(u), `U${u} used by ${used.get(u)} and ${r.id}`);
      used.set(u, r.id);
    }
    if (r.gpu) {
      assert.equal(b - a + 1, 4, `${r.id}: 4U`);
      for (const v of Object.values(r.cells))
        assert.ok(v === 'n' || (typeof v === 'number' && v <= 8), `${r.id}: GPU count`);
    }
  }
});

test('derived rack data matches the approved model (rev 0.1 baseline)', () => {
  assert.deepEqual(blankRanges('M'), [[11, 36]]);
  assert.deepEqual(blankRanges('L'), [[11, 36]]);
  assert.deepEqual(blankRanges('P0'), [
    [5, 10],
    [20, 36],
  ]);
  assert.deepEqual(installedRanges('L'), [
    [1, 10],
    [37, 42],
  ]);
  assert.deepEqual(AVAILABLE_IN.loadbank, ['P0']);
  assert.deepEqual(AVAILABLE_IN.brick2, ['M', 'L']);
});

test('views and exploded view reference valid groups', () => {
  for (const k of ['iso', 'front', 'rear', 'top', 'rack', 'system'])
    assert.ok(VIEWS[k as keyof typeof VIEWS], k);
  for (const g of Object.keys(EXPLODE)) assert.ok(GROUPS.includes(g as (typeof GROUPS)[number]), g);
});

test('model revision is set', () => {
  assert.match(MODEL_REVISION.rev, /^\d+\.\d+$/);
  assert.match(MODEL_REVISION.date, /^\d{4}-\d{2}-\d{2}$/);
});
