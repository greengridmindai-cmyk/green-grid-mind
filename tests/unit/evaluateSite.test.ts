import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSite, type SiteInput } from '../../src/lib/evaluateSite.ts';

const ideal: SiteInput = {
  state: 'by',
  pv: 120,
  bess: 'yes',
  reserve: 'ge24',
  room: 'yes',
  floor: 'yes',
  distance: 'near',
  outdoor: 'yes',
  fire: 'yes',
};
const ev = (patch: Partial<SiteInput>) => evaluateSite({ ...ideal, ...patch });

test('1 ideal Bavarian farm with ≥ 24 kW → suitable for Node L', () => {
  const r = evaluateSite(ideal);
  assert.equal(r.status, 'suitable-L');
  assert.equal(r.candidate, 'L');
  assert.ok(r.criteria.every((c) => c.mark === 'ok'));
});

test('2 Baden-Württemberg with 16–24 kW → suitable for Node M', () => {
  const r = ev({ state: 'bw', reserve: '16to24' });
  assert.equal(r.status, 'suitable-M');
  assert.equal(r.candidate, 'M');
});

test('3 other federal state → outside planning area, regardless of other answers', () => {
  const r = ev({ state: 'other', fire: 'no' });
  assert.equal(r.status, 'outside');
  assert.ok(r.notes.includes('outside'));
});

test('4 room = no → not suitable, room listed as failed', () => {
  const r = ev({ room: 'no' });
  assert.equal(r.status, 'not-suitable');
  assert.deepEqual(r.failed, ['room']);
});

test('5 outdoor and fire = no → not suitable, both listed', () => {
  const r = ev({ outdoor: 'no', fire: 'no' });
  assert.equal(r.status, 'not-suitable');
  assert.deepEqual(r.failed, ['outdoor', 'fire']);
});

test('6 reserve < 16 kW → not suitable with power-limit note', () => {
  const r = ev({ reserve: 'lt16' });
  assert.equal(r.status, 'not-suitable');
  assert.ok(r.notes.includes('lowReserve'));
  assert.equal(r.candidate, null);
});

test('7 reserve unknown → site visit needed', () => {
  const r = ev({ reserve: 'unknown' });
  assert.equal(r.status, 'check');
  assert.equal(r.candidate, null);
});

test('8 floor = no → check (fixable), not a hard stop', () => {
  const r = ev({ floor: 'no' });
  assert.equal(r.status, 'check');
  assert.ok(r.notes.includes('fixable'));
  assert.equal(r.candidate, 'L');
});

test('9 distance > 40 m → check (fixable)', () => {
  const r = ev({ distance: 'far' });
  assert.equal(r.status, 'check');
  assert.ok(r.notes.includes('fixable'));
});

test('10 any "unsure" → check unless a hard stop exists', () => {
  assert.equal(ev({ room: 'unsure' }).status, 'check');
  assert.equal(ev({ outdoor: 'unsure', fire: 'no' }).status, 'not-suitable');
});

test('11 PV and battery never gate the result', () => {
  assert.equal(ev({ pv: null, bess: 'no' }).status, 'suitable-L');
  assert.equal(ev({ pv: 0 }).status, 'suitable-L');
  assert.ok(ev({ pv: 80 }).notes.includes('pv'));
  assert.ok(!ev({ pv: null }).notes.includes('pv'));
});

test('12 missing required answers → incomplete', () => {
  const r = evaluateSite({ state: 'by', reserve: 'ge24' });
  assert.equal(r.status, 'incomplete');
  assert.ok(r.criteria.some((c) => !c.answered));
});

test('13 hard stop is reported even while incomplete', () => {
  assert.equal(evaluateSite({ fire: 'no' }).status, 'not-suitable');
});

test('14 low reserve combined with a hard stop lists both', () => {
  const r = ev({ reserve: 'lt16', room: 'no' });
  assert.deepEqual(r.failed, ['room', 'reserve']);
});

test('15 every criterion has exactly one mark', () => {
  const r = ev({ floor: 'unsure', distance: 'unsure' });
  assert.equal(r.criteria.length, 7);
  assert.equal(r.status, 'check');
  assert.deepEqual(
    r.criteria.filter((c) => c.mark === 'unknown').map((c) => c.id),
    ['floor', 'distance'],
  );
});
