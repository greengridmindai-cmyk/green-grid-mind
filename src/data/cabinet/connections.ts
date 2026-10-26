/** Connections table (legacy `CONN`). Localized texts: ./text.*.ts → conn.rows[id]. */
import { n, r, type Q } from '../../i18n/format.ts';
import type { TagKey } from '../node.ts';

export type ConnType = 'power' | 'data' | 'safety' | 'water' | 'air';

export interface ConnData {
  id: string;
  type: ConnType;
  tag: TagKey;
  q?: Q[];
}

export const CONNECTIONS: ConnData[] = [
  { id: 'feed', type: 'power', tag: 'asm', q: [n(5), n(25, 'mm²'), n(40, 'm', { cmp: '≤' }), n(400, 'V'), n(63), n(80, 'A')] },
  { id: 'upsIn', type: 'power', tag: 'est', q: [n(5), n(10, 'mm²'), n(400, 'V')] },
  { id: 'upsOut', type: 'power', tag: 'est', q: [n(5), n(6, 'mm²'), n(32, 'A'), n(400, 'V')] },
  { id: 'psu', type: 'power', tag: 'asm', q: [n(2), n(230, 'V')] },
  { id: 'lcp', type: 'power', tag: 'ok', q: [n(230, 'V'), n(400, 'V')] },
  { id: 'chiller', type: 'power', tag: 'est', q: [n(400, 'V')] },
  { id: 'ems', type: 'power', tag: 'asm', q: [n(24, 'V')] },
  { id: 's1', type: 'data', tag: 'asm', q: [n(1, 's')] },
  { id: 'bmc', type: 'data', tag: 'asm', q: [n(1)] },
  { id: 'pduUps', type: 'data', tag: 'asm', q: [n(10, 's')] },
  { id: 'lcpChiller', type: 'data', tag: 'est', q: [n(30, 's')] },
  { id: 'fire', type: 'data', tag: 'asm' },
  { id: 'steuerbox', type: 'data', tag: 'open' },
  { id: 'internet', type: 'data', tag: 'asm' },
  { id: 'notaus', type: 'safety', tag: 'asm' },
  { id: 'supply', type: 'water', tag: 'ok', q: [r(32, 40), r(30, 35, '%'), n(15, '°C')] },
  {
    id: 'return',
    type: 'water',
    tag: 'est',
    q: [r(32, 40), n(21, '°C', { approx: true }), r(45, 50, 'l/min', { approx: true })],
  },
  { id: 'heat', type: 'water', tag: 'est', q: [r(20, 25, '°C')] },
  { id: 'air', type: 'air', tag: 'est', q: [n(3000, 'm³/h', { approx: true }), n(15, 'kW'), n(15, 'K')] },
];
