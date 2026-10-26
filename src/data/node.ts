/**
 * Language-independent facts about the GGM-Node (brief §14.1, §14.2, §5.2 D, §5.3).
 * Every number on the site is defined here once; copy files reference keys.
 */
import { dims, n, pair, r, type Q } from '../i18n/format.ts';
import type { Dict } from '../i18n/de.ts';

type CellKey = keyof Dict['knoten']['configs']['cells'];

export type TagKey = 'ok' | 'est' | 'asm' | 'spec' | 'open';
export type ConfigKey = 'M' | 'L' | 'P0';
export const CONFIGS: ConfigKey[] = ['M', 'L', 'P0'];

export const REV = { rev: '0.1', date: '2026-10-26' } as const;

/** Row of the GGM-Node: section widths (mm), height, depth. */
export const ROW = {
  sections: [
    { id: 'ecab', w: 800 },
    { id: 'rack', w: 800 },
    { id: 'lcp', w: 300 },
  ],
  width: 1900,
  depth: 1200,
  height: 2000,
} as const;

/** IT load per configuration (toolbar labels, table). */
export const IT_LOAD: Record<ConfigKey, Q> = { M: n(10, 'kW'), L: n(15, 'kW'), P0: n(15, 'kW') };

/** Service clearance in front of the row (3D dimension label). */
export const SERVICE_ZONE = n(1200, 'mm', { cmp: '≥' });

export const HERO_FACTS = {
  itLoad: r(10, 15, 'kW'),
  sections: n(3),
  rows: n(1),
  room: dims([3.2, 3.0], 'm', 1),
};

/** Spec rows in "GGM-Node" (§5.3). `q` values are interpolated into the localized template. */
export const NODE_SPECS: { id: string; q: Q[]; tag?: TagKey }[] = [
  { id: 'row', q: [dims([1900, 1200, 2000], 'mm')] },
  { id: 'it', q: [n(15, 'kW')] },
  { id: 'rack', q: [] },
  { id: 'lcp', q: [n(15, '°C')] },
  { id: 'ups', q: [n(20, 'kVA')], tag: 'ok' },
  { id: 'feeder', q: [n(5), n(25, 'mm²'), n(40, 'm', { cmp: '≤' })], tag: 'asm' },
];

/** Five engineering decisions (§5.2 D). */
export const DECISIONS: { id: 'power' | 'air' | 'cooling' | 'reserve' | 'heat'; value: Q; tag: TagKey }[] = [
  { id: 'power', value: n(60, 's', { cmp: '≤' }), tag: 'spec' },
  { id: 'air', value: n(3000, 'm³/h'), tag: 'est' },
  { id: 'cooling', value: pair(15, 21, '°C'), tag: 'est' },
  { id: 'reserve', value: n(20, 'kVA'), tag: 'ok' },
  { id: 'heat', value: r(10, 16, 'kW'), tag: 'est' },
];

/** Configuration comparison table (§14.1). Cells are Q values or keys into localized text. */
export type Cell = { q: Q } | { text: CellKey; q?: Q[] };
export interface ConfigRow {
  id: 'use' | 'it' | 'gpu' | 'pit' | 'heat' | 'summer' | 'winter' | 'reserve' | 'fuse' | 'feeder';
  tag?: TagKey;
  cells?: Record<ConfigKey, Cell>;
  /** merged cell spanning all configurations */
  merged?: { text: CellKey; q?: Q[] };
}

export const CONFIG_ROWS: ConfigRow[] = [
  { id: 'use', cells: { M: { text: 'useM' }, L: { text: 'useL' }, P0: { text: 'useP0' } } },
  {
    id: 'it',
    cells: { M: { q: IT_LOAD.M }, L: { q: IT_LOAD.L }, P0: { text: 'itP0', q: [IT_LOAD.P0] } },
  },
  {
    id: 'gpu',
    tag: 'asm',
    cells: {
      M: { text: 'gpuSplit', q: [n(12), n(8), n(4)] },
      L: { text: 'gpuSplit', q: [n(16), n(8), n(8)] },
      P0: { text: 'gpuP0', q: [n(4), n(3), n(3.75, 'kW', { d: 2 })] },
    },
  },
  {
    id: 'pit',
    tag: 'est',
    cells: {
      M: { q: n(9.8, 'kW', { approx: true }) },
      L: { text: 'upTo', q: [n(13.4, 'kW', { approx: true }), n(15)] },
      P0: { text: 'itP0', q: [n(15, 'kW', { approx: true })] },
    },
  },
  {
    id: 'heat',
    tag: 'est',
    cells: {
      M: { q: n(10.3, 'kW', { approx: true }) },
      L: { q: n(15.4, 'kW', { approx: true }) },
      P0: { q: n(15.4, 'kW', { approx: true }) },
    },
  },
  {
    id: 'summer',
    tag: 'est',
    cells: {
      M: { q: n(14, 'kW', { approx: true }) },
      L: { q: n(21, 'kW', { approx: true }) },
      P0: { q: n(21, 'kW', { approx: true }) },
    },
  },
  {
    id: 'winter',
    tag: 'est',
    cells: {
      M: { q: n(11.5, 'kW', { approx: true }) },
      L: { q: n(17, 'kW', { approx: true }) },
      P0: { q: n(17, 'kW', { approx: true }) },
    },
  },
  {
    id: 'reserve',
    cells: {
      M: { q: n(16, 'kW', { cmp: '≥' }) },
      L: { q: n(24, 'kW', { cmp: '≥' }) },
      P0: { text: 'reserveP0', q: [n(24, 'kW', { cmp: '≥' })] },
    },
  },
  {
    id: 'fuse',
    cells: {
      M: { text: 'fuseNH', q: [n(63, 'A')] },
      L: { text: 'fuseNH', q: [n(80, 'A')] },
      P0: { text: 'fuseG', q: [n(80, 'A')] },
    },
  },
  {
    id: 'feeder',
    tag: 'asm',
    merged: { text: 'feederSame', q: [n(5), n(25, 'mm²'), n(40, 'm', { cmp: '≤' })] },
  },
];

/** Site requirements (§14.2) — used in "Für Höfe" and Standort-Check. */
export const SITE_REQS: { id: 'room' | 'reserve' | 'floor' | 'clearance' | 'cable' | 'outdoor'; value?: Q }[] = [
  { id: 'room', value: dims([3.2, 3.0], 'm', 1) },
  { id: 'reserve', value: n(24, 'kW', { cmp: '≥' }) },
  { id: 'floor', value: n(500, 'kg/m²') },
  { id: 'clearance', value: n(1.2, 'm', { d: 1 }) },
  { id: 'cable', value: n(40, 'm', { cmp: '≤' }) },
  { id: 'outdoor' },
];

/** Values interpolated into site-requirement texts. */
export const SITE_VARS = {
  height: n(2.4, 'm', { d: 1 }),
  door: n(0.9, 'm', { d: 1 }),
  reserveM: n(16, 'kW'),
  rear: n(0.8, 'm', { d: 1 }),
  reserveL: n(24, 'kW', { cmp: '≥' }),
  reserveMid: r(16, 24, 'kW'),
  reserveLow: n(16, 'kW', { cmp: '<' }),
  floor: n(500, 'kg/m²'),
  cable: n(40, 'm', { cmp: '≤' }),
  cableFar: n(40, 'm', { cmp: '>' }),
  room: dims([3.2, 3.0], 'm', 1),
};
