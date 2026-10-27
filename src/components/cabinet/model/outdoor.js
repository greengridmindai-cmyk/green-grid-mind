/**
 * Outside and room periphery: outdoor chiller with free cooling, heat-recovery option,
 * farm main distribution (NSHV), cable tray, uplink entry, drip tray under the pipes.
 */
import * as THREE from 'three';
export function buildOutdoor(k, { gRoom }) {
  const { M, box, edges, add, grp } = k;
  const gOut = grp('outdoor');
  add(gOut, box(-0.05, 1.45, 0, 0.1, -3.35, -2.35, M(0x8E948F)), 'chiller');
  const ch = box(0, 1.4, 0.1, 1.45, -3.3, -2.4, M(0xD6D8D2)); add(gOut, ch, 'chiller'); gOut.add(edges(ch, 0x5d6661, .8));
  add(gOut, box(-0.005, 0.002, 0.25, 1.35, -3.25, -2.45, M(0x5C6560)), 'chiller'); // FC coil side
  add(gOut, box(1.398, 1.405, 0.25, 1.35, -3.25, -2.45, M(0x5C6560)), 'chiller');
  [0.37, 1.03].forEach(x => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 32), M(0x23282A)); f.position.set(x, 1.48, -2.85); add(gOut, f, 'chiller'); const r = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 8, 32), M(0x9AA09A)); r.rotation.x = Math.PI / 2; r.position.set(x, 1.51, -2.85); gOut.add(r); });
  // heat recovery option (indoor, near wall)
  const hx = box(1.62, 1.86, 0.25, 0.95, -1.68, -1.52, M(0xB0B6B0, { transparent: true, opacity: .55 })); add(gOut, hx, 'hrx'); gOut.add(edges(hx, 0x6b736e, .9));
  // NSHV
  add(gRoom, box(-3.8, -3.55, 0.95, 2.0, -0.65, 0.25, M(0xD5D6CF)), 'nshv');
  add(gRoom, box(-3.551, -3.54, 1.45, 1.58, -0.30, -0.15, M(0x2F4F6F)), 'nshv');
  // tray
  const gTray = grp('tray');
  const tray = box(-3.55, 1.2, 2.28, 2.30, -0.78, -0.42, M(0x9AA09A, { metalness: .5, roughness: .5 })); add(gTray, tray, 'tray');
  add(gTray, box(-3.55, 1.2, 2.30, 2.36, -0.605, -0.595, M(0x9AA09A, { metalness: .5 })), 'tray');
  // uplink entry
  add(gRoom, box(-1.3, -1.1, 2.05, 2.25, -1.76, -1.72, M(0x2E5B8A)), 'uplink');
  // drip tray
  add(gRoom, box(0.84, 1.06, 0.0, 0.03, -1.72, -0.95, M(0x8E948F, { transparent: true, opacity: .8 })), 'pipes');
  return { gOut, gTray };
}
