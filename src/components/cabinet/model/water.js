/** Water circuit: supply 15 °C (blue) and return ≈ 21 °C (orange) between chiller and LCP, heat-recovery branch, flow beads. */
import * as THREE from 'three';
export function buildWater(k) {
  const { grp, tube, dashed } = k;
  const gWater = grp('water');
  const supPts = [[0.9, 0.45, -2.4], [0.9, 0.4, -2.2], [0.9, 0.36, -1.95], [0.9, 0.32, -1.75], [0.9, 0.1, -1.62], [0.9, 0.05, -1.4], [0.9, 0.05, -1.12], [0.9, 0.1, -1.0]];
  const retPts = [[1.0, 0.1, -1.0], [1.0, 0.05, -1.12], [1.0, 0.05, -1.4], [1.0, 0.1, -1.62], [1.0, 0.32, -1.75], [1.0, 0.36, -1.95], [1.0, 0.4, -2.2], [1.0, 0.45, -2.4]];
  const tSup = tube(supPts, 0.026, 0x2F6FB8, 'pipes', gWater), tRet = tube(retPts, 0.026, 0xD4812A, 'pipes', gWater);
  // HX dashed branch
  dashed(gWater, [[1.0, 0.06, -1.45], [1.4, 0.06, -1.6], [1.62, 0.4, -1.6]], 0xD4812A, .05, .035);
  const beads = [];
  [[tSup, 0x7FB3F0], [tRet, 0xF6C27D]].forEach(([t, c]) => { for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: c })); b.userData = { curve: t.userData.curve, u: i / 14 }; gWater.add(b); beads.push(b); } });
  /** advance the flow beads by dt seconds */
  function step(dt) { beads.forEach(b => { b.userData.u = (b.userData.u + dt * 0.09) % 1; b.position.copy(b.userData.curve.getPointAt(b.userData.u)); }); }
  return { gWater, step };
}
