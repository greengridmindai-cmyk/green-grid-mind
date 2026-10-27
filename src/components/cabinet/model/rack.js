/**
 * IT rack 42U (800 mm): enclosure, rails, PDU A/B, sensors, equipment per rack unit and blanking panels.
 * WHAT is installed WHERE comes from src/data/cabinet/rackLayout.ts (the same table that drives the
 * "Rack-Belegung" table on the site) — change the rack there, not here.
 */
import * as THREE from 'three';
import { RACK_LAYOUT, blankRanges, gpuCount, isInstalled } from '../../../data/cabinet/rackLayout.ts';
import { COLORS } from './layout.js';

const ROW = Object.fromEntries(RACK_LAYOUT.map((r) => [r.id, r]));

/** Look of each rack row: depth (m), body colour, front colour. Units come from the layout table. */
const LOOK = {
  brick: { depth: 0.887, color: 0x4E5651 },
  cpu: { depth: 0.75, color: 0x5D6661 },
  load: { depth: 0.6, color: 0xC9A227, front: 0x8E6F12, module: 3 },
  fw: { depth: 0.45, color: 0x343A36 },
  tor: { depth: 0.45, color: 0x343A36, front: 0x2E5B8A },
  oob: { depth: 0.40, color: 0x343A36, front: 0x2E7D4F },
  patch: { depth: 0.10, color: 0x2B302D, fronts: [0x6E7671, 0x4A504C] },
  fire: { depth: 0.45, color: 0xB43A2A, front: 0x8E2A1E },
};

export function buildRack(k) {
  const { M, box, edges, add, uy, grp, shell, reg, purge, equipGlass, faceMats } = k;
  const gRack = grp('rack');
  shell(gRack, 0, 0.8, 0, 2.0, -1.2, 0, 'rack');
  add(gRack, box(0, 0.8, 0, 0.1, -1.2, 0, M(COLORS.DARK)), 'rack');
  [0.159, 0.641].forEach(x => { [-0.04, -1.0].forEach(z => add(gRack, box(x - 0.008, x + 0.008, 0.1, 1.97, z - 0.01, z + 0.01, M(0x7d8580)), 'rack')); });
  // PDUs
  [0.05, 0.75].forEach(x => { add(gRack, box(x - 0.028, x + 0.028, 0.14, 1.86, -1.17, -1.11, M(0x1F2321)), 'pdu'); for (let i = 0; i < 12; i++) add(gRack, box(x - 0.012, x + 0.012, 0.2 + i * 0.13, 0.24 + i * 0.13, -1.11, -1.105, M(0x9AA09A)), 'pdu'); });
  // sensors
  const sph = (x, y, z, c, cid) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), M(c, { emissive: c, emissiveIntensity: .25 })); s.position.set(x, y, z); add(gRack, s, cid); };
  [0.45, 1.05, 1.7].forEach(y => sph(0.7, y, -0.03, 0x2F6FB8, 'sensors'));
  [0.6, 1.4].forEach(y => sph(0.7, y, -1.17, 0xC93A2B, 'sensors'));
  add(gRack, box(0.94, 0.96, 0.105, 0.115, -1.15, -0.1, M(0xD9B44A)), 'sensors'); // leak cable under LCP
  // blanking (dynamic)
  const blankMat = M(0x5E6661, { transparent: true });
  const blanks = new THREE.Group(); gRack.add(blanks);
  function setBlanks(ranges) { purge(blanks); ranges.forEach(([a, b]) => { const p = box(0.18, 0.62, uy(a) + 0.001, uy(b + 1) - 0.001, -0.07, -0.06, blankMat); reg(p, 'rack'); blanks.add(p); }); }

  /** one piece of rack equipment: body (semi-transparent in glass mode) + front panel */
  function equip(parent, u, nU, depth, col, cid, front) {
    const y0 = uy(u), y1 = uy(u + nU);
    const mat = M(col, { transparent: true, opacity: 1 }); equipGlass.push(mat);
    const b = box(0.18, 0.62, y0 + 0.002, y1 - 0.002, -0.06 - depth, -0.06, mat); add(parent, b, cid);
    parent.add(edges(b, 0x111111, .6));
    const fm = M(front || COLORS.DARK2, { transparent: true }); faceMats.push(fm); const fp = box(0.165, 0.635, y0 + 0.002, y1 - 0.002, -0.06, -0.045, fm); add(parent, fp, cid);
    return b;
  }
  /** GPU cards (n of 8 slots filled), CPUs and fan wall of a 4U brick */
  function gpus(parent, u, n) {
    const yc = (uy(u) + uy(u + 4)) / 2;
    for (let i = 0; i < 8; i++) {
      const x = 0.215 + i * 0.052; const filled = i < n;
      if (filled) {
        const c = box(x - 0.018, x + 0.018, yc - 0.056, yc + 0.056, -0.92, -0.65, M(0x24453A, { metalness: .3, roughness: .5 })); add(parent, c, parent.userData.cid);
        add(parent, box(x - 0.019, x + 0.019, yc + 0.045, yc + 0.058, -0.92, -0.65, M(0xB89B4A, { metalness: .6, roughness: .4 })), parent.userData.cid);
      } else { const c = box(x - 0.018, x + 0.018, yc - 0.056, yc + 0.056, -0.92, -0.65, M(0xffffff)); const e = edges(c, 0x8a8f8b, .9); parent.add(e); }
    }
    // CPUs + fan wall
    add(parent, box(0.24, 0.33, uy(u) + 0.01, uy(u) + 0.04, -0.45, -0.35, M(0x8C918D, { metalness: .5 })), parent.userData.cid);
    add(parent, box(0.47, 0.56, uy(u) + 0.01, uy(u) + 0.04, -0.45, -0.35, M(0x8C918D, { metalness: .5 })), parent.userData.cid);
    const fw = M(0x1A1D1B, { transparent: true }); faceMats.push(fw); add(parent, box(0.19, 0.61, uy(u) + 0.01, uy(u + 4) - 0.01, -0.22, -0.17, fw), parent.userData.cid);
  }

  const gB1 = grp('brick1'); gB1.userData.cid = 'brick1';
  const gB2 = grp('brick2'); gB2.userData.cid = 'brick2';
  const gCPU = grp('cpu'), gLB = grp('loadbank'), gNet = grp('net'), gFire = grp('fire');

  /** rebuild the parts that depend on the configuration (M / L / P0) */
  function applyConfig(c, applyShell) {
    [gB1, gB2].forEach(g => purge(g));
    const [u1] = ROW.brick1.u, [u2] = ROW.brick2.u;
    equip(gB1, u1, 4, LOOK.brick.depth, LOOK.brick.color, 'brick1'); gpus(gB1, u1, gpuCount(ROW.brick1, c));
    equip(gB2, u2, 4, LOOK.brick.depth, LOOK.brick.color, 'brick2'); gpus(gB2, u2, gpuCount(ROW.brick2, c));
    gB2.visible = isInstalled(ROW.brick2, c);
    gCPU.visible = isInstalled(ROW.cpu, c);
    gLB.visible = isInstalled(ROW.load, c);
    setBlanks(blankRanges(c));
    applyShell();
  }

  // fixed equipment (positions from the rack layout table)
  { const [a, b] = ROW.cpu.u; equip(gCPU, a, b - a + 1, LOOK.cpu.depth, LOOK.cpu.color, 'cpu'); }
  { const [a, b] = ROW.load.u; const m = LOOK.load.module; for (let u = a; u + m - 1 <= b; u += m) equip(gLB, u, m, LOOK.load.depth, LOOK.load.color, 'loadbank', LOOK.load.front); }
  for (const id of ['fw', 'tor', 'oob']) equip(gNet, ROW[id].u[0], 1, LOOK[id].depth, LOOK[id].color, 'net', LOOK[id].front);
  { const [a, b] = ROW.patch.u; for (let u = a; u <= b; u++) equip(gNet, u, 1, LOOK.patch.depth, LOOK.patch.color, 'net', LOOK.patch.fronts[u - a]); }
  equip(gFire, ROW.fire.u[0], 1, LOOK.fire.depth, LOOK.fire.color, 'fire', LOOK.fire.front);

  return { gRack, blankMat, gB1, gB2, gCPU, gLB, gNet, gFire, applyConfig };
}
