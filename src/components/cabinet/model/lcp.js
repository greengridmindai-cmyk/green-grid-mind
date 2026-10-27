/** LCP Rack CW (300 mm, right of the rack): enclosure, water coil, 4 fans, controller, pipe stubs. */
import * as THREE from 'three';
import { COLORS } from './layout.js';

export function buildLcp(k) {
  const { M, box, add, grp, shell } = k;
  const gL = grp('lcp');
  shell(gL, 0.8, 1.1, 0, 2.0, -1.2, 0, 'lcp');
  add(gL, box(0.8, 1.1, 0, 0.1, -1.2, 0, M(COLORS.DARK)), 'lcp');
  add(gL, box(0.83, 1.07, 0.15, 1.85, -0.72, -0.64, M(0x6E8FA8, { metalness: .5, roughness: .4 })), 'lcp'); // coil
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.05, 28), M(0x23282A)); f.rotation.x = Math.PI / 2; f.position.set(0.95, 0.38 + i * 0.4, -0.45); add(gL, f, 'lcp');
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.055, 16), M(0x9AA09A)); hub.rotation.x = Math.PI / 2; hub.position.copy(f.position); gL.add(hub);
  }
  add(gL, box(0.86, 1.04, 1.86, 1.96, -0.25, -0.05, M(0x2B302D)), 'lcp');
  [0.9, 1.0].forEach((x, i) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 16), M(i ? 0xD4812A : 0x2F6FB8)); p.position.set(x, 0.07, -1.0); add(gL, p, 'pipes'); });
  return { gL };
}
