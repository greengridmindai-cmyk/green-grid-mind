/** Project status timeline (§5.7). No dates except the ones given in the brief. */
import { n, type Q } from '../i18n/format.ts';

export type StepState = 'done' | 'progress' | 'planned';

export const STATUS_STEPS: { id: string; state: StepState; date?: { iso: string; precision: 'day' | 'month' }; q?: Q[] }[] = [
  { id: 'concept', state: 'done' },
  { id: 'ems', state: 'done' },
  { id: 'cooling', state: 'done', date: { iso: '2026-10-01', precision: 'month' } },
  { id: 'p0', state: 'progress', date: { iso: '2026-10-26', precision: 'day' } },
  { id: 'electrical', state: 'planned' },
  { id: 'site', state: 'planned', q: [n(24, 'kW', { cmp: '≥' })] },
  { id: 'tests', state: 'planned', q: [n(20)] },
  { id: 'first', state: 'planned' },
];
