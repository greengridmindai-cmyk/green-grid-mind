/**
 * Model layout — pure data, no three.js. Edit this file when a revision moves markers, camera views or
 * the exploded view. Positions in metres (see kit.js for the coordinate system).
 */
import { RACK_LAYOUT } from '../../../data/cabinet/rackLayout.ts';

/** U1 starts above the 100 mm plinth; 1U = 44.45 mm */
export const U0 = 0.10;
export const UH = 0.04445;
const uy = (u) => U0 + (u - 1) * UH;
const row = (id) => RACK_LAYOUT.find((r) => r.id === id).u;
/** vertical centre of a rack row */
const mid = (id) => { const [a, b] = row(id); return (uy(a) + uy(b + 1)) / 2; };

/** Names of the scene groups created by the builders (see index.js). ANCHORS and EXPLODE may only use these. */
export const GROUPS = ['room', 'ecab', 'rack', 'brick1', 'brick2', 'cpu', 'loadbank', 'net', 'fire', 'lcp', 'outdoor', 'tray', 'water', 'power', 'signal', 'air', 'dims', 'static'];

export const COLORS = {
  FRAME: 0xC9CCC5, // enclosure glass
  DARK: 0x2B302D, // plinths
  DARK2: 0x3A403C, // default equipment front
  HL: 0xecf0ea, // selection highlight
};

/**
 * Marker (numbered button) position per component: [group name, x, y, z] in the group's local space.
 * Group names are the ones passed to kit.grp() in the builders.
 */
export const ANCHORS = {
  rack: ['rack', 0.4, 2.02, 0.0],
  lcp: ['lcp', 0.95, 2.05, 0.0],
  chiller: ['outdoor', 0.7, 1.65, -2.85],
  pipes: ['water', 0.95, 0.12, -1.45],
  hrx: ['outdoor', 1.74, 1.02, -1.6],
  ecab: ['ecab', -0.4, 2.05, 0.0],
  board: ['ecab', -0.4, 1.8, -0.68],
  ems: ['ecab', -0.62, 1.4, -0.68],
  ups: ['ecab', -0.4, 0.36, 0.0],
  notaus: ['ecab', -0.12, 1.55, 0.04],
  pdu: ['rack', 0.05, 1.0, -1.14],
  brick1: ['brick1', 0.4, mid('brick1'), 0.0],
  brick2: ['brick2', 0.4, mid('brick2'), 0.0],
  cpu: ['cpu', 0.4, mid('cpu'), 0.0],
  loadbank: ['loadbank', 0.4, mid('load'), 0.0],
  net: ['net', 0.4, uy(row('tor')[0]) + 0.02, 0.0],
  fire: ['fire', 0.4, uy(row('fire')[0]) + 0.02, 0.0],
  sensors: ['rack', 0.7, 1.7, -0.03],
  nshv: ['room', -3.54, 1.75, -0.2],
  feeder: ['power', -2.2, 2.27, -0.62],
  tray: ['tray', -1.6, 2.36, -0.45],
  uplink: ['room', -1.2, 2.15, -1.72],
  pe: ['ecab', -0.52, 0.13, -0.69],
};

/** Components outside the cabinet row: the camera flies to them from further away. */
export const FLY_FAR = ['chiller', 'nshv', 'tray', 'uplink', 'feeder', 'pipes', 'hrx'];

/** Camera views: [camera position, target]. */
export const VIEWS = {
  iso: [[3.9, 3.0, 4.3], [0.05, 0.95, -0.6]],
  front: [[0.15, 1.1, 5.0], [0.15, 1.0, -0.5]],
  rear: [[0.35, 1.5, -6.4], [0.35, 0.95, -1.0]],
  top: [[0.0, 8.2, -0.55], [0.0, 0, -0.9]],
  rack: [[1.3, 1.35, 2.35], [0.42, 1.0, -0.55]],
  system: [[5.6, 4.6, 4.0], [-0.9, 0.7, -1.2]],
};

/** Exploded view: offset per group at full explosion. */
export const EXPLODE = {
  ecab: [-0.75, 0, 0],
  lcp: [0.75, 0, 0],
  brick1: [0, 0, 1.15],
  brick2: [0, 0, 0.9],
  cpu: [0, 0, 0.65],
  loadbank: [0, 0, 0.75],
  net: [0, 0, 0.45],
  fire: [0, 0, 0.45],
};
