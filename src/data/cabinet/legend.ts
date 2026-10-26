/** 3D legend — colours are the legacy 3D materials (air particles, pipes, cables, signal lines). */
import { n, pair, type Q } from '../../i18n/format.ts';

export const LEGEND: { k: 'cold' | 'hot' | 'supply' | 'ret' | 'power' | 'data'; color: string; q?: Q }[] = [
  { k: 'cold', color: '#2F6FB8' },
  { k: 'hot', color: '#C93A2B' },
  { k: 'supply', color: '#2F6FB8', q: n(15, '°C') },
  { k: 'ret', color: '#D4812A', q: n(21, '°C', { approx: true }) },
  { k: 'power', color: '#9A6A12', q: pair(400, 230, 'V') },
  { k: 'data', color: '#1F8571' },
];
