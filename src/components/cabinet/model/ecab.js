/** Energy cabinet E/USV (800 mm, left of the rack): enclosure, GGM board with DIN rows, EMS, UPS, PE bar, Not-Aus. */
import * as THREE from 'three';
import { COLORS } from './layout.js';

export function buildEnergyCabinet(k) {
  const { M, box, add, grp, shell } = k;
  const gE = grp('ecab');
  shell(gE, -0.8, 0, 0, 2.0, -0.8, 0, 'ecab');
  add(gE, box(-0.8, 0, 0, 0.1, -0.8, 0, M(COLORS.DARK)), 'ecab');
  add(gE, box(-0.76, -0.04, 1.04, 1.96, -0.79, -0.77, M(0xD8D9D2)), 'board');
  // DIN rows
  const comp = (x0, x1, y0, y1, c, cid) => add(gE, box(x0, x1, y0, y1, -0.77, -0.70, M(c)), cid);
  comp(-0.72, -0.60, 1.76, 1.93, 0x4A4F4C, 'board'); // NH00
  comp(-0.58, -0.51, 1.80, 1.92, 0x6B4C9A, 'board'); // SPD
  comp(-0.49, -0.40, 1.80, 1.92, 0xE2E2DA, 'board'); // RCD/RCM
  for (let i = 0; i < 9; i++) comp(-0.38 + i * 0.035, -0.355 + i * 0.035, 1.81, 1.91, 0xEDEDE6, 'board');
  comp(-0.72, -0.62, 1.55, 1.68, 0x2F4F6F, 'board'); // MID
  comp(-0.60, -0.50, 1.55, 1.68, 0x2F4F6F, 'board'); // P_cool meter
  for (let i = 0; i < 8; i++) comp(-0.47 + i * 0.035, -0.445 + i * 0.035, 1.56, 1.66, 0xEDEDE6, 'board');
  comp(-0.72, -0.60, 1.33, 1.47, 0x1F7A5A, 'ems'); // WAGO CC100
  comp(-0.58, -0.52, 1.33, 1.47, 0x9AA09A, 'ems'); // 24V
  for (let i = 0; i < 3; i++) comp(-0.50 + i * 0.03, -0.475 + i * 0.03, 1.34, 1.45, 0xD2B33A, 'ems'); // relays
  comp(-0.38, -0.25, 1.34, 1.44, 0x2B302D, 'ems'); // OT switch
  add(gE, box(-0.74, -0.06, 1.12, 1.16, -0.77, -0.73, M(0x8E948F)), 'board'); // terminals
  add(gE, box(-0.62, -0.18, 0.15, 0.537, -0.741, -0.05, M(0x2A2E2C)), 'ups');
  add(gE, box(-0.62, -0.18, 0.43, 0.52, -0.05, -0.035, M(0x3E4541)), 'ups');
  add(gE, box(-0.52, -0.28, 0.70, 0.90, -0.70, -0.58, M(0x55605A)), 'ups'); // service bypass
  add(gE, box(-0.74, -0.30, 0.105, 0.125, -0.72, -0.66, M(0xB87333, { metalness: .6, roughness: .35 })), 'pe');
  // Not-Aus
  const na = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.035, 24), M(0xC8271E)); na.rotation.x = Math.PI / 2; na.position.set(-0.12, 1.45, 0.03); add(gE, na, 'notaus');
  const nab = box(-0.18, -0.06, 1.39, 1.51, 0, 0.012, M(0xE8C21A)); add(gE, nab, 'notaus');
  return { gE };
}
