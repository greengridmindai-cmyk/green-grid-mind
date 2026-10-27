import { test } from 'node:test';
import assert from 'node:assert/strict';
import { de } from '../../src/i18n/de.ts';
import { en } from '../../src/i18n/en.ts';
import { ru } from '../../src/i18n/ru.ts';

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
