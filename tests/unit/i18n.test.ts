import { test } from 'node:test';
import assert from 'node:assert/strict';
import { de } from '../../src/i18n/de.ts';
import { en } from '../../src/i18n/en.ts';
import { ru } from '../../src/i18n/ru.ts';
import { textDe } from '../../src/data/cabinet/text.de.ts';
import { textEn } from '../../src/data/cabinet/text.en.ts';
import { textRu } from '../../src/data/cabinet/text.ru.ts';
import { COMPONENTS } from '../../src/data/cabinet/components.ts';
import { CONNECTIONS } from '../../src/data/cabinet/connections.ts';

function keys(o: unknown, p = ''): string[] {
  if (typeof o === 'string') return [p];
  if (Array.isArray(o)) return o.flatMap((v, i) => keys(v, `${p}.${i}`));
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k));
  return [p];
}

test('dictionaries have identical key shapes', () => {
  assert.deepEqual(keys(en).sort(), keys(de).sort());
  assert.deepEqual(keys(ru).sort(), keys(de).sort());
});

test('cabinet texts have identical key shapes', () => {
  assert.deepEqual(keys(textEn).sort(), keys(textDe).sort());
  assert.deepEqual(keys(textRu).sort(), keys(textDe).sort());
});

test('every component spec and connection has a text entry in every language', () => {
  for (const t of [textDe, textEn, textRu]) {
    for (const c of COMPONENTS) {
      const ct = t.comp[c.id];
      assert.ok(ct, c.id);
      for (const s of c.specs) assert.ok(ct.specs[s.id], `${c.id}.${s.id}`);
      assert.equal(Object.keys(ct.specs).length, c.specs.length, `${c.id} spec count`);
    }
    for (const r of CONNECTIONS) assert.ok(t.conn.rows[r.id], r.id);
  }
});
