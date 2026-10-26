/**
 * Component register of the 3D cabinet model (extracted from legacy `COMP`).
 * Language-independent: ids, numbers, groups, spec quantities and epistemic tags.
 * Localized names, functions, spec labels/templates and links: ./text.{de,en,ru}.ts
 */
import { dims, n, pair, r, type Q } from '../../i18n/format.ts';
import type { ConfigKey, TagKey } from '../node.ts';

export type GroupKey = 'shell' | 'power' | 'it' | 'ext';

export const COMP_IDS = [
  'rack',
  'lcp',
  'chiller',
  'pipes',
  'hrx',
  'ecab',
  'board',
  'ems',
  'ups',
  'notaus',
  'pdu',
  'brick1',
  'brick2',
  'cpu',
  'loadbank',
  'net',
  'fire',
  'sensors',
  'nshv',
  'feeder',
  'tray',
  'uplink',
  'pe',
] as const;
export type CompId = (typeof COMP_IDS)[number];

export interface CompSpec {
  id: string;
  /** quantities interpolated as {q0}, {q1}, … into the localized label/value templates */
  q?: Q[];
  tag?: TagKey;
  /** language-independent label (e.g. configuration codes) */
  lbl?: string;
}

export interface CompData {
  id: CompId;
  n: number;
  g: GroupKey;
  specs: CompSpec[];
}

export const COMPONENTS: CompData[] = [
  {
    id: 'rack',
    n: 1,
    g: 'shell',
    specs: [
      { id: 'class', q: [dims([800, 2000, 1200], 'mm')], tag: 'ok' },
      { id: 'height', q: [n(482.6, 'mm')] },
      { id: 'depth', q: [n(1200, 'mm'), r(887, 900, 'mm', { approx: true })] },
      { id: 'ip', tag: 'open' },
    ],
  },
  {
    id: 'lcp',
    n: 2,
    g: 'shell',
    specs: [
      { id: 'ref', q: [dims([300, 2000, 1200], 'mm')], tag: 'ok' },
      { id: 'power', q: [n(40, 'kW'), n(55, 'kW'), n(4)], tag: 'ok' },
      { id: 'water', q: [n(15, '°C'), n(40)] },
      { id: 'air', q: [n(8000, 'm³/h'), n(210, 'kg')] },
      { id: 'size', q: [n(15, 'kW')], tag: 'open' },
    ],
  },
  {
    id: 'chiller',
    n: 3,
    g: 'shell',
    specs: [
      { id: 'refrigerant', tag: 'asm' },
      { id: 'capacity', q: [r(18, 20, 'kW'), pair(15, 21, '°C')], tag: 'est' },
      { id: 'freecool', q: [r(10, 12, '°C'), n(55, '%', { approx: true })], tag: 'est' },
      { id: 'hydro' },
      { id: 'glycol', q: [r(30, 35, '%'), n(-15), n(-20, '°C')], tag: 'est' },
      { id: 'noise', tag: 'open' },
    ],
  },
  {
    id: 'pipes',
    n: 4,
    g: 'shell',
    specs: [
      { id: 'size', q: [r(32, 40)], tag: 'est' },
      { id: 'flow', q: [r(45, 50, 'l/min', { approx: true }), n(5, 'K'), n(15, 'kW')], tag: 'est' },
      { id: 'insulation' },
      { id: 'wall' },
      { id: 'fittings' },
    ],
  },
  {
    id: 'hrx',
    n: 5,
    g: 'shell',
    specs: [{ id: 'heat', q: [r(10, 16, 'kW', { approx: true })], tag: 'est' }, { id: 'status' }],
  },
  {
    id: 'ecab',
    n: 6,
    g: 'power',
    specs: [
      { id: 'size', q: [dims([800, 2000, 800], 'mm')], tag: 'asm' },
      { id: 'vent' },
      { id: 'losses', q: [r(0.5, 0.8, 'kW', { approx: true })], tag: 'est' },
    ],
  },
  {
    id: 'board',
    n: 7,
    g: 'power',
    specs: [
      { id: 'input', q: [n(63, 'A'), n(80, 'A')] },
      { id: 'spd' },
      { id: 'leak', q: [n(300, 'mA', { cmp: '≤' })], tag: 'asm' },
      { id: 'groups', q: [n(30, '%', { cmp: '≥' })] },
      { id: 'metering' },
      { id: 'details' },
    ],
  },
  {
    id: 'ems',
    n: 8,
    g: 'power',
    specs: [
      { id: 'ctrl' },
      { id: 'parts', q: [n(24, 'V')] },
      { id: 'proto' },
      { id: 'shed', q: [n(60, 's', { cmp: '≤' })], tag: 'spec' },
    ],
  },
  {
    id: 'ups',
    n: 9,
    g: 'power',
    specs: [
      { id: 'class', tag: 'ok' },
      { id: 'size', q: [dims([438, 387, 691], 'mm'), n(148, 'kg')] },
      {
        id: 'autonomy',
        q: [n(4, 'min', { approx: true }), n(15, 'kW'), n(7, 'min', { approx: true }), n(10, 'kW')],
        tag: 'ok',
      },
      { id: 'scheme' },
      { id: 'batteries' },
    ],
  },
  { id: 'notaus', n: 10, g: 'power', specs: [{ id: 'test' }] },
  {
    id: 'pdu',
    n: 11,
    g: 'it',
    specs: [
      { id: 'type', q: [n(400, 'V'), n(32, 'A'), n(22, 'kVA', { approx: true })], tag: 'est' },
      { id: 'sockets' },
      { id: 'mgmt' },
    ],
  },
  {
    id: 'brick1',
    n: 12,
    g: 'it',
    specs: [
      { id: 'gpu', q: [n(8), n(96, 'GB'), n(600, 'W')], tag: 'open' },
      { id: 'platform', tag: 'ok' },
      { id: 'cpuram', q: [n(2), r(0.75, 1, 'TB')] },
      { id: 'power', q: [r(6.3, 6.6, 'kW', { approx: true })], tag: 'est' },
      { id: 'depth', q: [n(887, 'mm', { approx: true })] },
      { id: 'cap' },
    ],
  },
  {
    id: 'brick2',
    n: 13,
    g: 'it',
    specs: [
      { id: 'm', lbl: 'M', q: [n(4), n(520, 'W', { approx: true })] },
      { id: 'l', lbl: 'L', q: [n(8), n(600, 'W')] },
      { id: 'p0', lbl: 'P0' },
    ],
  },
  {
    id: 'cpu',
    n: 14,
    g: 'it',
    specs: [
      { id: 'comp', q: [n(1), r(256, 512, 'GB'), r(30, 60, 'TB')], tag: 'est' },
      { id: 'power', q: [r(0.4, 0.6, 'kW', { approx: true })] },
    ],
  },
  {
    id: 'loadbank',
    n: 15,
    g: 'it',
    specs: [{ id: 'comp', q: [n(3), n(3.75, 'kW', { d: 2 })], tag: 'ok' }, { id: 'form' }],
  },
  {
    id: 'net',
    n: 16,
    g: 'it',
    specs: [{ id: 'firewall' }, { id: 'tor' }, { id: 'oob' }, { id: 'patch' }],
  },
  {
    id: 'fire',
    n: 17,
    g: 'it',
    specs: [
      { id: 'class', tag: 'open' },
      { id: 'agent', tag: 'open' },
    ],
  },
  {
    id: 'sensors',
    n: 18,
    g: 'it',
    specs: [{ id: 'tin', q: [n(3)] }, { id: 'tout', q: [n(2)] }, { id: 'other' }],
  },
  { id: 'nshv', n: 19, g: 'ext', specs: [{ id: 'analyzer', q: [n(1, 's')] }, { id: 'works' }] },
  {
    id: 'feeder',
    n: 20,
    g: 'ext',
    specs: [
      { id: 'cable', q: [n(5), n(25, 'mm²'), n(40, 'm', { cmp: '≤' })] },
      { id: 'drop', q: [n(0.4, '%', { approx: true }), n(40, 'm')] },
      { id: 'protection', q: [n(63), n(80, 'A')] },
    ],
  },
  { id: 'tray', n: 21, g: 'ext', specs: [{ id: 'sep' }] },
  { id: 'uplink', n: 22, g: 'ext', specs: [{ id: 'upload', tag: 'open' }] },
  { id: 'pe', n: 23, g: 'ext', specs: [{ id: 'norm' }] },
];

/** Components that exist only in some configurations (legacy `visibleChainIgnoringLayers`). */
export const AVAILABLE_IN: Partial<Record<CompId, ConfigKey[]>> = {
  brick2: ['M', 'L'],
  cpu: ['M', 'L'],
  loadbank: ['P0'],
};
export const isAvailable = (id: CompId, c: ConfigKey) => AVAILABLE_IN[id]?.includes(c) ?? true;

export const COMP_BY_ID: Record<CompId, CompData> = Object.fromEntries(COMPONENTS.map((c) => [c.id, c])) as Record<
  CompId,
  CompData
>;
