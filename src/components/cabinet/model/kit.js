/**
 * Geometry kit — shared helpers and registries used by every model builder (./*.js).
 * Units: metres. Origin: front-left corner of the IT rack at floor level; x → right, y ↑, z → towards the viewer
 * (the rear of the row is at z = −1.2). Rack units: U1 starts at U0 = 0.10 m (plinth), 1U = 44.45 mm.
 */
import * as THREE from 'three';
import { U0, UH, COLORS } from './layout.js';

export function createKit(scene) {
  const pickables = [];
  const compMeshes = {};
  const shellMats = [];
  const shellMeshes = [];
  const equipGlass = [];
  const faceMats = [];

  /** register a mesh as clickable part of component `cid` */
  function reg(o, cid) { o.userData.cid = cid; pickables.push(o); (compMeshes[cid] = compMeshes[cid] || []).push(o); return o; }
  /** standard material */
  function M(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .72, metalness: .08 }, o || {})); }
  /** axis-aligned box between two corners */
  function box(x0, x1, y0, y1, z0, z1, m) { const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); const b = new THREE.Mesh(g, m); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return b; }
  /** outline of a mesh */
  function edges(mesh, color, op) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color, transparent: true, opacity: op == null ? 1 : op })); e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); return e; }
  /** add to a group, optionally registering it for component `cid` */
  function add(parent, o, cid) { parent.add(o); if (cid) reg(o, cid); return o; }
  /** rack unit → height in metres */
  const uy = (u) => U0 + (u - 1) * UH;
  /** named top-level group */
  function grp(name) { const g = new THREE.Group(); g.name = name; scene.add(g); g.userData.base = new THREE.Vector3(); return g; }
  /** transparent cabinet enclosure (glass / solid / hidden via the engine's applyShell) */
  function shell(parent, x0, x1, y0, y1, z0, z1, cid) {
    const m = M(COLORS.FRAME, { transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
    const b = box(x0, x1, y0, y1, z0, z1, m); b.renderOrder = 5; parent.add(b); reg(b, cid); b.userData.shell = true;
    shellMats.push(m); shellMeshes.push(b);
    const e = edges(b, 0x5d6661, .85); parent.add(e);
    return b;
  }
  /** remove all children of a group and unregister them */
  function purge(g) { g.traverse(o => { if (o === g) return; const i = pickables.indexOf(o); if (i >= 0) pickables.splice(i, 1); const cid = o.userData && o.userData.cid; if (cid && compMeshes[cid]) compMeshes[cid] = compMeshes[cid].filter(x => x !== o); if (o.material) { const j = equipGlass.indexOf(o.material); if (j >= 0) equipGlass.splice(j, 1); } }); g.clear(); }
  /** smooth tube along points (pipes, cables) */
  function tube(pts, r, color, cid, parent) { const cur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.08); const t = new THREE.Mesh(new THREE.TubeGeometry(cur, Math.max(40, pts.length * 24), r, 10, false), M(color, { roughness: .5 })); add(parent, t, cid); t.userData.curve = cur; return t; }
  /** dashed polyline */
  function dashed(parent, pts, color, dashSize, gapSize) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), new THREE.LineDashedMaterial({ color, dashSize, gapSize })); l.computeLineDistances(); parent.add(l); return l; }

  return { scene, reg, M, box, edges, add, uy, grp, shell, purge, tube, dashed, pickables, compMeshes, shellMats, shellMeshes, equipGlass, faceMats };
}
