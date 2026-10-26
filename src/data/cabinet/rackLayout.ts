/** IT-rack U layout (legacy table "Раскладка IT-шкафа"). U1 is at the bottom. */
import type { ConfigKey } from '../node.ts';

/** `y` = installed, `n` = not installed, number = GPU count */
export type RackCell = 'y' | 'n' | number;

export interface RackRow {
  id: 'fire' | 'patch' | 'oob' | 'tor' | 'fw' | 'blank' | 'load' | 'cpu' | 'brick2' | 'brick1' | 'pdu';
  /** U range [from, to]; `null` = 0U (vertical, rear) */
  u: [number, number] | null;
  cells: Record<ConfigKey, RackCell>;
  /** GPU rows are rendered as "{n} GPU" */
  gpu?: boolean;
}

export const RACK_LAYOUT: RackRow[] = [
  { id: 'fire', u: [42, 42], cells: { M: 'y', L: 'y', P0: 'y' } },
  { id: 'patch', u: [40, 41], cells: { M: 'y', L: 'y', P0: 'y' } },
  { id: 'oob', u: [39, 39], cells: { M: 'y', L: 'y', P0: 'y' } },
  { id: 'tor', u: [38, 38], cells: { M: 'y', L: 'y', P0: 'y' } },
  { id: 'fw', u: [37, 37], cells: { M: 'y', L: 'y', P0: 'y' } },
  { id: 'blank', u: [20, 36], cells: { M: 'n', L: 'n', P0: 'n' } },
  { id: 'load', u: [11, 19], cells: { M: 'n', L: 'n', P0: 'y' } },
  { id: 'cpu', u: [9, 10], cells: { M: 'y', L: 'y', P0: 'n' } },
  { id: 'brick2', u: [5, 8], cells: { M: 4, L: 8, P0: 'n' }, gpu: true },
  { id: 'brick1', u: [1, 4], cells: { M: 8, L: 8, P0: 4 }, gpu: true },
  { id: 'pdu', u: null, cells: { M: 'y', L: 'y', P0: 'y' } },
];

/**
 * Datasheet sources (legacy footer). `label` is a product name (never translated);
 * entries without a label take their text from the localized `sources` map.
 */
export const SOURCES: { id: string; label?: string; url: string }[] = [
  { id: 'lcp', label: 'Rittal LCP Rack CW 3311.260', url: 'https://www.rittal.com/pdf-creator/variant/ca-en/3311260' },
  {
    id: 'dell',
    label: 'Dell XE7745',
    url: 'https://www.delltechnologies.com/asset/de-ch/products/servers/technical-support/poweredge-xe7745-spec-sheet.pdf',
  },
  { id: 'hpe', label: 'HPE DL380a Gen12', url: 'https://www.hpe.com/us/en/compute/proliant-dl380a-gen12.html' },
  {
    id: 'gpu',
    label: 'RTX PRO 6000 BSE',
    url: 'https://www.akamai.com/site/en/documents/corporate/nvidia-rtx-pro-6000-blackwell-server-edition-datasheet.pdf',
  },
  { id: 'ups', label: 'Eaton 93PX 20 kVA', url: 'https://bechtle.com/gb/shop/eaton-93px-20kva-rt9u-ups-400-230v--4749166--p' },
  {
    id: 'emulator',
    url: 'https://www.datacenterdynamics.com/en/news/mafi-mushkila-launches-new-server-emulator-for-data-centers/',
  },
];
