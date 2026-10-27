/**
 * Closed air loop as particles: cold front zone → through the installed servers → hot rear zone → LCP → back.
 * Particles enter the servers only at the heights of equipment installed in the current configuration.
 */
import * as THREE from 'three';
import { installedRanges } from '../../../data/cabinet/rackLayout.ts';

const NP = 900;
const SEG = [0.16, 0.40, 0.12, 0.06, 0.20, 0.06]; const SEGC = []; { let a = 0; SEG.forEach(s => { a += s; SEGC.push(a); }); }

export function buildAirflow(k, getConfig) {
  const { grp, uy } = k;
  const gAir = grp('air');
  const airGeo = new THREE.BufferGeometry(); const pos = new Float32Array(NP * 3), col = new Float32Array(NP * 3);
  airGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); airGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const airPts = new THREE.Points(airGeo, new THREE.PointsMaterial({ size: 0.042, vertexColors: true, transparent: true, opacity: .9, depthWrite: false }));
  gAir.add(airPts);
  const P = []; const cCold = new THREE.Color(0x2F6FB8), cHot = new THREE.Color(0xC93A2B), tmpC = new THREE.Color();
  function zonesY() { return installedRanges(getConfig()).map(([a, b]) => [uy(a), uy(b + 1)]); }
  function respawn(p) { const z = zonesY(); const tot = z.reduce((a, b) => a + (b[1] - b[0]), 0); let r = Math.random() * tot; let y = z[0][0]; for (const [a, b] of z) { if (r < b - a) { y = a + r; break; } r -= b - a; } p.y = y + 0.005; p.x = 0.2 + Math.random() * 0.4; p.yl = 0.2 + Math.random() * 1.65; }
  for (let i = 0; i < NP; i++) { const p = { t: Math.random(), v: 0.06 + Math.random() * 0.05 }; respawn(p); P.push(p); }
  function airPos(p, out) {
    let t = p.t, i = 0; while (i < SEG.length - 1 && t > SEGC[i]) i++; const t0 = i ? SEGC[i - 1] : 0; const kk = (t - t0) / SEG[i]; let x, y, z, h;
    const yl = p.yl;
    switch (i) {
      case 0: x = 0.78 + (p.x - 0.78) * kk; y = yl + (p.y - yl) * kk; z = -0.025; h = 0; break;
      case 1: x = p.x; y = p.y; z = -0.03 - 1.12 * kk; h = kk; break;
      case 2: x = p.x + (0.86 - p.x) * kk; y = p.y; z = -1.16; h = 1; break;
      case 3: x = 0.86 + 0.09 * kk; y = p.y + (yl - p.y) * kk; z = -1.16 + 0.12 * kk; h = 1; break;
      case 4: x = 0.95; y = yl; z = -1.04 + 0.9 * kk; h = kk < 0.45 ? 1 : Math.max(0, 1 - (kk - 0.45) / 0.12); break;
      default: x = 0.95 - 0.17 * kk; y = yl; z = -0.14 + 0.115 * kk; h = 0;
    }
    out[0] = x; out[1] = y; out[2] = z; return h;
  }
  const o3 = [0, 0, 0];
  /** advance all particles by dt seconds */
  function step(dt) {
    for (let i = 0; i < NP; i++) { const p = P[i]; p.t += dt * p.v; if (p.t >= 1) { p.t -= 1; respawn(p); } const h = airPos(p, o3); pos[i * 3] = o3[0]; pos[i * 3 + 1] = o3[1]; pos[i * 3 + 2] = o3[2]; tmpC.copy(cCold).lerp(cHot, h); col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b; }
    airGeo.attributes.position.needsUpdate = true; airGeo.attributes.color.needsUpdate = true;
  }
  /** initial particle positions (no movement) */
  function warm() {
    for (let i = 0; i < NP; i++) { const h = airPos(P[i], o3); pos.set(o3, i * 3); tmpC.copy(cCold).lerp(cHot, h); col.set([tmpC.r, tmpC.g, tmpC.b], i * 3); }
    airGeo.attributes.position.needsUpdate = true;
  }
  /** after a configuration change */
  function respawnAll() { P.forEach(respawn); }
  return { gAir, step, warm, respawnAll };
}
