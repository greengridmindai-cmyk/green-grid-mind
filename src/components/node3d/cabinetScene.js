// GGM-Node cabinet — Three.js scene (three@0.128.0, pinned).
// Public API: mountCabinet(host, options) → CabinetHandle (see cabinetScene.d.ts and CLAUDE.md).
// Coordinate system: metres; x = along the row (E-cabinet −0.8…0, IT rack 0…0.8, LCP 0.8…1.1),
// y = up (floor 0), z = towards the front (front faces at z = 0, rack back at z = −1.2, building wall z = −1.75…−1.95).
// Rack units: U1 bottom edge at y = 0.10, 1U = 0.04445 m (helper uy(u)).

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CABINET } from './cabinetData.js';

export const VIEWS = {
  iso:    [[3.9, 3.0, 4.3], [0.05, 0.95, -0.6]],
  front:  [[0.15, 1.1, 5.0], [0.15, 1.0, -0.5]],
  rear:   [[0.35, 1.5, -6.4], [0.35, 0.95, -1.0]],
  top:    [[0.0, 8.2, -0.55], [0.0, 0, -0.9]],
  rack:   [[1.25, 1.45, 2.9], [0.4, 0.85, -0.6]],
  hydro:  [[3.0, 1.75, 0.9], [1.2, 0.65, -1.45]],
  system: [[5.6, 4.6, 4.0], [-0.9, 0.7, -1.2]],
  fire:   [[2.9, 3.6, 6.4], [-1.6, 1.25, 0.2]],
};
export const LAYERS = ['explode', 'air', 'water', 'power', 'signals', 'fire', 'numbers', 'dims', 'scale'];

/** Camera pose of a named view for a given aspect ratio (narrow screens pull the camera back). Used by siteScene for pose-matched transitions. */
export function poseFor(view, aspect) {
  const [p, t] = VIEWS[view]; const a = aspect || 1.4; const k = a < 1.25 ? Math.min(2.2, Math.pow(1.25 / a, 0.85)) : 1;
  return [[t[0] + (p[0] - t[0]) * k, t[1] + (p[1] - t[1]) * k, t[2] + (p[2] - t[2]) * k], t.slice()];
}
export const CONFIGS = ['M', 'L', 'P0'];
export const SHELLS = ['glass', 'solid', 'hidden'];

// Scene palette per theme. Physical-flow colours (air, water, power, data, fire) are identical in both themes.
export const PALETTES = {
  light: { scene: '#DDE2DD', wall: '#B5BAB2', floor: '#CBD1CB', ground: '#B9C0B4', grid: '#AEB6AF', ink: '#18201D', muted: '#5A6661' },
  dark:  { scene: '#0C0F0D', wall: '#2B332E', floor: '#141916', ground: '#1B211D', grid: '#2A332D', ink: '#ECF0EA', muted: '#9AA39C' },
};
export const FLOW = { cold: 0x2F6FB8, hot: 0xC93A2B, supply: 0x2F6FB8, ret: 0xD4812A, power: 0x9A6A12, data: 0x1F8571, fire: 0xC8271E };

const DEFAULTS = {
  config: 'L', view: 'iso', shell: 'glass', theme: 'light',
  layers: { explode: false, air: true, water: true, power: true, signals: true, fire: true, numbers: true, dims: false, scale: false },
  markers: true, injectStyles: true, font: '"JetBrains Mono", "IBM Plex Mono", Menlo, monospace',
  pixelRatioCap: 2, reducedMotion: undefined,
};

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const css = `.ggm-cab{position:relative;overflow:hidden}.ggm-cab canvas{display:block;width:100%;height:100%;touch-action:none}
.ggm-cab-mk{position:absolute;inset:0;pointer-events:none}
.ggm-mk{position:absolute;left:0;top:0;pointer-events:auto;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;border:1.5px solid currentColor;background:var(--ggm-mk-bg,#F4F5F2);color:var(--ggm-mk-ink,#18201D);font:600 11px/21px "JetBrains Mono","IBM Plex Mono",monospace;text-align:center;cursor:pointer;padding:0;box-shadow:0 1px 3px rgba(0,0,0,.18)}
.ggm-mk.sel{background:var(--ggm-mk-sel,#C2461C);border-color:var(--ggm-mk-sel,#C2461C);color:#fff}
.ggm-mk:focus-visible{outline:2px solid var(--ggm-mk-sel,#C2461C);outline-offset:2px}`;
  const st = document.createElement('style'); st.setAttribute('data-ggm-cabinet', ''); st.textContent = css; document.head.appendChild(st);
}

export function mountCabinet(host, options = {}) {
  const O = Object.assign({}, DEFAULTS, options, { layers: Object.assign({}, DEFAULTS.layers, options.layers || {}) });
  if (O.injectStyles) injectStyles();
  const reduceMotion = O.reducedMotion != null ? O.reducedMotion
    : (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const COMP = CABINET.components;
  const S = { config: O.config, view: O.view, shell: O.shell, theme: O.theme, layers: O.layers, sel: null };
  const listeners = { select: new Set(), change: new Set() };
  const emit = (k, v) => listeners[k].forEach(cb => { try { cb(v); } catch (e) { console.error(e); } });

  /* ---------------- DOM ---------------- */
  host.classList.add('ggm-cab');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  host.appendChild(canvas);
  const mkWrap = document.createElement('div'); mkWrap.className = 'ggm-cab-mk'; host.appendChild(mkWrap);

  /* ---------------- three setup ---------------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, O.pixelRatioCap));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.09; controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 0.8; controls.maxDistance = 18;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x80877f, 0.9));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.7); d1.position.set(4, 7, 6); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 0.28); d2.position.set(-6, 4, -5); scene.add(d2);

  const pickables = []; const compMeshes = {}; const shellMeshes = []; const equipGlass = []; const faceMats = [];
  const G = {}; // named groups (anchor targets)
  const textures = [];
  function reg(o, cid) { o.userData.cid = cid; pickables.push(o); (compMeshes[cid] = compMeshes[cid] || []).push(o); return o; }
  function M(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .72, metalness: .08 }, o || {})); }
  function box(x0, x1, y0, y1, z0, z1, m) { const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); const b = new THREE.Mesh(g, m); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return b; }
  const edgeMats = []; // theme-aware outline materials (technical-drawing look in dark theme)
  function edges(mesh, color, op) { const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: op == null ? 1 : op }); m.userData.c0 = color; m.userData.o0 = m.opacity; edgeMats.push(m); const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), m); e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); return e; }
  function add(parent, o, cid) { parent.add(o); if (cid) reg(o, cid); return o; }
  const U0 = 0.10, UH = 0.04445; const uy = u => U0 + (u - 1) * UH;
  function grp(name, parent) { const g = new THREE.Group(); g.name = name; (parent || scene).add(g); G[name] = g; return g; }
  function cyl(r, h, color, opt) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, opt && opt.seg || 24), M(color, opt && opt.mat)); }

  const FRAME = 0xC9CCC5, DARK = 0x2B302D, DARK2 = 0x3A403C, RED = FLOW.fire;
  function shell(parent, x0, x1, y0, y1, z0, z1, cid) {
    const m = M(FRAME, { transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
    const b = box(x0, x1, y0, y1, z0, z1, m); b.renderOrder = 5; parent.add(b); reg(b, cid); b.userData.shell = true; shellMeshes.push(b);
    parent.add(edges(b, 0x5d6661, .85)); return b;
  }

  /* ================= ROOM ================= */
  const gRoom = grp('room');
  const floorMat = M(0xCBD1CB, { roughness: .95 }); const groundMat = M(0xB9C0B4, { roughness: 1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 5.6), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(-0.4, 0, 0.85); gRoom.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.6), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.set(-0.4, -0.002, -3.25); gRoom.add(ground);
  let grid = null;
  const wallMat = M(0xB5BAB2, { transparent: true, opacity: .34, depthWrite: false, side: THREE.DoubleSide });
  const wall = box(-4, 3.2, 0, 2.8, -1.95, -1.75, wallMat); gRoom.add(wall); gRoom.add(edges(wall, 0x8a928c, .5));
  const wallL = box(-4, -3.8, 0, 2.8, -1.75, 3.6, wallMat); gRoom.add(wallL); gRoom.add(edges(wallL, 0x8a928c, .35));
  // host's NSHV / Zählerschrank (26) with the GGM outgoing NH00 fuse switch and S1 analyser
  add(gRoom, box(-3.8, -3.55, 0.95, 2.0, -0.65, 0.25, M(0xD5D6CF)), 'nshv');
  add(gRoom, box(-3.551, -3.54, 1.45, 1.58, -0.30, -0.15, M(0x2F4F6F)), 'nshv');           // Janitza S1
  add(gRoom, box(-3.551, -3.535, 1.10, 1.30, -0.55, -0.40, M(0x3A3F3C)), 'nshv');          // NH00 gG 80 A, GGM outgoing
  add(gRoom, box(-1.3, -1.1, 2.05, 2.25, -1.76, -1.72, M(0x2E5B8A)), 'uplink');            // fibre / 5G entry (29)
  add(gRoom, box(0.84, 1.06, 0.0, 0.03, -1.72, -0.95, M(0x8E948F, { transparent: true, opacity: .8 })), 'pipes'); // drip tray
  // professional room details (rev 0.3.1): service-zone marking, LED panels, skirting, scale figure
  { const Y = 0.004, Z0 = 0.02, Z1 = 1.22, X0 = -0.8, X1 = 1.1, st = 0.05;
    const yel = M(0xE0B416, { roughness: .9 }), blk = M(0x1A1D1B, { roughness: .9 });
    for (let x = X0, i = 0; x < X1 - 1e-6; x += 0.1, i++) { gRoom.add(box(x, Math.min(X1, x + 0.1), Y, Y + 0.003, Z1 - st, Z1, i % 2 ? blk : yel)); }
    for (const xe of [X0, X1 - st]) for (let z = Z0, i = 0; z < Z1 - st - 1e-6; z += 0.1, i++) gRoom.add(box(xe, xe + st, Y, Y + 0.003, z, Math.min(Z1 - st, z + 0.1), i % 2 ? blk : yel)); }
  const ledMat = M(0xF4F6F0, { emissive: 0xF4F6F0, emissiveIntensity: 0.35 });
  const ledHousing = M(0x2E3431);
  [[-0.2, -0.35], [1.4, 0.9], [-2.4, 0.9]].forEach(([x, z]) => { gRoom.add(box(x - 0.3, x + 0.3, 2.75, 2.78, z - 0.6, z + 0.6, ledHousing)); gRoom.add(box(x - 0.28, x + 0.28, 2.745, 2.75, z - 0.58, z + 0.58, ledMat)); });
  gRoom.add(box(-3.75, 3.2, 0, 0.08, -1.75, -1.73, M(0x3A403C))); gRoom.add(box(-3.75, -3.73, 0, 0.08, -1.73, 3.6, M(0x3A403C)));
  const gScale = grp('scaleFig', gRoom); gScale.visible = false;
  { const pm = M(0x8E9690, { roughness: .8 }); const legs = box(-2.05, -1.85, 0, 0.86, 1.15, 1.30, pm); const torso = box(-2.12, -1.78, 0.86, 1.48, 1.12, 1.33, pm);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), pm); head.position.set(-1.95, 1.62, 1.22); [legs, torso, head].forEach(o => gScale.add(o));
    const lab = textSprite('1,8 м', '#9AA39C', 0.09); lab.position.set(-1.95, 1.9, 1.22); gScale.add(lab); }

  /* ================= E-CABINET (6) — board (7), EMS (8), UPS (9), PE (30) ================= */
  const gE = grp('ecab');
  shell(gE, -0.8, 0, 0, 2.0, -0.8, 0, 'ecab');
  add(gE, box(-0.8, 0, 0, 0.1, -0.8, 0, M(DARK)), 'ecab');
  add(gE, box(-0.76, -0.04, 1.04, 1.96, -0.79, -0.77, M(0xD8D9D2)), 'board');   // mounting plate
  const comp = (x0, x1, y0, y1, c, cid) => add(gE, box(x0, x1, y0, y1, -0.77, -0.70, M(c)), cid);
  comp(-0.73, -0.58, 1.74, 1.93, 0x3E4441, 'board');                                 // MCCB 80 A + Unterspannungsauslöser
  comp(-0.56, -0.49, 1.80, 1.92, 0x6B4C9A, 'board');                                 // SPD Typ 2
  comp(-0.47, -0.39, 1.80, 1.92, 0x2C4C7A, 'board');                                 // RCM Typ B
  for (let i = 0; i < 8; i++) comp(-0.37 + i * 0.035, -0.345 + i * 0.035, 1.81, 1.91, i < 3 ? 0xD9D2C2 : 0xEDEDE6, 'board'); // groups (first 3 with AFDD)
  comp(-0.72, -0.62, 1.55, 1.68, 0x2F4F6F, 'board');                                 // MID P_node
  comp(-0.60, -0.50, 1.55, 1.68, 0x2F4F6F, 'board');                                 // meter P_cool
  for (let i = 0; i < 6; i++) comp(-0.47 + i * 0.035, -0.445 + i * 0.035, 1.56, 1.66, 0xC9D6E3, 'board'); // UPS-output distribution (PDU A/B, LCP, pump, EMS)
  comp(-0.72, -0.60, 1.33, 1.47, 0x1F7A5A, 'ems');                                   // WAGO CC100
  comp(-0.58, -0.52, 1.33, 1.47, 0x9AA09A, 'ems');                                   // 24 V PSU (UPS-fed)
  for (let i = 0; i < 3; i++) comp(-0.50 + i * 0.03, -0.475 + i * 0.03, 1.34, 1.45, 0xD2B33A, 'ems'); // relays
  comp(-0.38, -0.25, 1.34, 1.44, 0x2B302D, 'ems');                                   // OT switch
  add(gE, box(-0.74, -0.06, 1.12, 1.16, -0.77, -0.73, M(0x8E948F)), 'board');        // terminals
  add(gE, box(-0.62, -0.18, 0.15, 0.537, -0.741, -0.05, M(0x2A2E2C)), 'ups');        // Eaton 93PX 20 kVA RT9U
  add(gE, box(-0.62, -0.18, 0.43, 0.52, -0.05, -0.035, M(0x3E4541)), 'ups');
  add(gE, box(-0.52, -0.28, 0.70, 0.90, -0.70, -0.58, M(0x55605A)), 'ups');          // service bypass
  add(gE, box(-0.74, -0.30, 0.105, 0.125, -0.72, -0.66, M(0xB87333, { metalness: .6, roughness: .35 })), 'pe');

  /* ================= IT RACK (1) ================= */
  const gRack = grp('rack');
  shell(gRack, 0, 0.8, 0, 2.0, -1.2, 0, 'rack');
  add(gRack, box(0, 0.8, 0, 0.1, -1.2, 0, M(DARK)), 'rack');
  [0.159, 0.641].forEach(x => { [-0.04, -1.0].forEach(z => add(gRack, box(x - 0.008, x + 0.008, 0.1, 1.97, z - 0.01, z + 0.01, M(0x7d8580)), 'rack')); });
  [0.05, 0.75].forEach(x => { add(gRack, box(x - 0.028, x + 0.028, 0.14, 1.86, -1.17, -1.11, M(0x1F2321)), 'pdu'); for (let i = 0; i < 12; i++) add(gRack, box(x - 0.012, x + 0.012, 0.2 + i * 0.13, 0.24 + i * 0.13, -1.11, -1.105, M(0x9AA09A)), 'pdu'); });
  const sph = (x, y, z, c, cid) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), M(c, { emissive: c, emissiveIntensity: .25 })); s.position.set(x, y, z); add(gRack, s, cid); };
  [0.45, 1.05, 1.7].forEach(y => sph(0.7, y, -0.03, 0x2F6FB8, 'sensors'));
  [0.6, 1.4].forEach(y => sph(0.7, y, -1.17, 0xC93A2B, 'sensors'));
  add(gRack, box(0.94, 0.96, 0.105, 0.115, -1.15, -0.1, M(0xD9B44A)), 'sensors');   // leak cable under LCP
  const blankMat = M(0x5E6661, { transparent: true });
  const blanks = new THREE.Group(); gRack.add(blanks);
  function purge(g) {
    g.traverse(o => { if (o === g) return; const i = pickables.indexOf(o); if (i >= 0) pickables.splice(i, 1);
      const cid = o.userData && o.userData.cid; if (cid && compMeshes[cid]) compMeshes[cid] = compMeshes[cid].filter(x => x !== o);
      if (o.material) { const j = equipGlass.indexOf(o.material); if (j >= 0) equipGlass.splice(j, 1); const k = faceMats.indexOf(o.material); if (k >= 0) faceMats.splice(k, 1); }
      if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== blankMat) o.material.dispose(); });
    g.clear();
  }
  function setBlanks(ranges) { purge(blanks); ranges.forEach(([a, b]) => { const p = box(0.18, 0.62, uy(a) + 0.001, uy(b + 1) - 0.001, -0.07, -0.06, blankMat); reg(p, 'rack'); blanks.add(p); }); }
  function equip(parent, u, nU, depth, col, cid, front) {
    const y0 = uy(u), y1 = uy(u + nU);
    const mat = M(col, { transparent: true, opacity: 1 }); equipGlass.push(mat);
    const b = box(0.18, 0.62, y0 + 0.002, y1 - 0.002, -0.06 - depth, -0.06, mat); add(parent, b, cid);
    parent.add(edges(b, 0x111111, .6));
    const fm = M(front || DARK2, { transparent: true }); faceMats.push(fm); add(parent, box(0.165, 0.635, y0 + 0.002, y1 - 0.002, -0.06, -0.045, fm), cid);
    return b;
  }
  function gpus(parent, u, n, cid) {
    const yc = (uy(u) + uy(u + 4)) / 2;
    for (let i = 0; i < 8; i++) {
      const x = 0.215 + i * 0.052;
      if (i < n) {
        add(parent, box(x - 0.018, x + 0.018, yc - 0.056, yc + 0.056, -0.92, -0.65, M(0x24453A, { metalness: .3, roughness: .5 })), cid);
        add(parent, box(x - 0.019, x + 0.019, yc + 0.045, yc + 0.058, -0.92, -0.65, M(0xB89B4A, { metalness: .6, roughness: .4 })), cid);
      } else { const c = box(x - 0.018, x + 0.018, yc - 0.056, yc + 0.056, -0.92, -0.65, M(0xffffff)); parent.add(edges(c, 0x8a8f8b, .9)); }
    }
    add(parent, box(0.24, 0.33, uy(u) + 0.01, uy(u) + 0.04, -0.45, -0.35, M(0x8C918D, { metalness: .5 })), cid);
    add(parent, box(0.47, 0.56, uy(u) + 0.01, uy(u) + 0.04, -0.45, -0.35, M(0x8C918D, { metalness: .5 })), cid);
    const fw = M(0x1A1D1B, { transparent: true }); faceMats.push(fw); add(parent, box(0.19, 0.61, uy(u) + 0.01, uy(u + 4) - 0.01, -0.22, -0.17, fw), cid);
  }
  const gB1 = grp('brick1'), gB2 = grp('brick2'), gCPU = grp('cpu'), gLB = grp('loadbank'), gNet = grp('net'), gDet = grp('detac');
  function buildBricks() {
    [gB1, gB2].forEach(g => purge(g));
    const c = S.config;
    const n1 = c === 'P0' ? 4 : 8, n2 = c === 'M' ? 4 : 8;
    equip(gB1, 1, 4, 0.887, 0x4E5651, 'brick1'); gpus(gB1, 1, n1, 'brick1');
    equip(gB2, 5, 4, 0.887, 0x4E5651, 'brick2'); gpus(gB2, 5, n2, 'brick2');
    gB2.visible = c !== 'P0'; gCPU.visible = c !== 'P0'; gLB.visible = c === 'P0';
    setBlanks(c === 'P0' ? [[5, 10], [20, 36]] : [[11, 36]]);
    applyShell();
  }
  equip(gCPU, 9, 2, 0.75, 0x5D6661, 'cpu');
  for (let k = 0; k < 3; k++) equip(gLB, 11 + k * 3, 3, 0.6, 0xC9A227, 'loadbank', 0x8E6F12);
  equip(gNet, 37, 1, 0.45, 0x343A36, 'net'); equip(gNet, 38, 1, 0.45, 0x343A36, 'net', 0x2E5B8A); equip(gNet, 39, 1, 0.40, 0x343A36, 'net', 0x2E7D4F);
  equip(gNet, 40, 1, 0.10, 0x2B302D, 'net', 0x6E7671); equip(gNet, 41, 1, 0.10, 0x2B302D, 'net', 0x4A504C);
  equip(gDet, 42, 1, 0.45, 0xB43A2A, 'fire', 0x8E2A1E);

  /* ================= LCP RACK CW (2) ================= */
  const gL = grp('lcp');
  shell(gL, 0.8, 1.1, 0, 2.0, -1.2, 0, 'lcp');
  add(gL, box(0.8, 1.1, 0, 0.1, -1.2, 0, M(DARK)), 'lcp');
  add(gL, box(0.83, 1.07, 0.15, 1.85, -0.72, -0.64, M(0x6E8FA8, { metalness: .5, roughness: .4 })), 'lcp'); // heat exchanger
  for (let i = 0; i < 3; i++) { // 3 fan modules = N+1
    const f = cyl(0.105, 0.05, 0x23282A, { seg: 28 }); f.rotation.x = Math.PI / 2; f.position.set(0.95, 0.5 + i * 0.5, -0.45); add(gL, f, 'lcp');
    const hub = cyl(0.03, 0.055, 0x9AA09A, { seg: 16 }); hub.rotation.x = Math.PI / 2; hub.position.copy(f.position); gL.add(hub);
  }
  add(gL, box(0.86, 1.04, 1.86, 1.96, -0.25, -0.05, M(0x2B302D)), 'lcp');                // controller
  [0.9, 1.0].forEach((x, i) => { const p = cyl(0.024, 0.14, i ? FLOW.ret : FLOW.supply, { seg: 16 }); p.position.set(x, 0.07, -1.0); add(gL, p, 'pipes'); });

  /* ================= OUTDOOR: chiller (3); indoor option: heat recovery (5) ================= */
  const gOut = grp('outdoor');
  add(gOut, box(-0.05, 1.45, 0, 0.1, -3.35, -2.35, M(0x8E948F)), 'chiller');
  const ch = box(0, 1.4, 0.1, 1.45, -3.3, -2.4, M(0xD6D8D2)); add(gOut, ch, 'chiller'); gOut.add(edges(ch, 0x5d6661, .8));
  add(gOut, box(-0.005, 0.002, 0.25, 1.35, -3.25, -2.45, M(0x5C6560)), 'chiller');      // free-cooling coil
  add(gOut, box(1.398, 1.405, 0.25, 1.35, -3.25, -2.45, M(0x5C6560)), 'chiller');
  [0.37, 1.03].forEach(x => { const f = cyl(0.28, 0.06, 0x23282A, { seg: 32 }); f.position.set(x, 1.48, -2.85); add(gOut, f, 'chiller'); const r = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 8, 32), M(0x9AA09A)); r.rotation.x = Math.PI / 2; r.position.set(x, 1.51, -2.85); gOut.add(r); });
  const hx = box(1.62, 1.86, 0.25, 0.95, -1.68, -1.52, M(0xB0B6B0, { transparent: true, opacity: .55 })); add(gOut, hx, 'hrx'); gOut.add(edges(hx, 0x6b736e, .9));

  /* ================= HYDRAULIC MODULE (32) + ROOM FAN COIL (31) — rev 0.3 ================= */
  const gHyd = grp('hydro');
  add(gHyd, box(1.15, 1.58, 0.0, 0.02, -1.72, -1.28, M(0x8E948F, { transparent: true, opacity: .85 })), 'hyd');          // drip tray
  const tank = cyl(0.21, 0.85, 0xC9CCC5, { seg: 28 }); tank.position.set(1.3, 0.47, -1.5); add(gHyd, tank, 'hyd');          // buffer 100 l
  gHyd.add(edges(tank, 0x6b736e, .5));
  const exv = cyl(0.09, 0.28, 0xC0221A, { seg: 20 }); exv.position.set(1.48, 0.95, -1.62); add(gHyd, exv, 'hyd');           // expansion vessel 12 l
  const pump = cyl(0.07, 0.16, 0x2C4C7A, { seg: 20 }); pump.rotation.z = Math.PI / 2; pump.position.set(1.47, 0.22, -1.38); add(gHyd, pump, 'hyd'); // pump (UPS-fed)
  [[0.9, -1.3], [1.0, -1.3]].forEach(([x, z]) => { add(gHyd, box(x - 0.045, x + 0.045, 0.1, 0.19, z - 0.035, z + 0.035, M(0xE0A21A)), 'hyd'); }); // motorized shut-off valves
  const gFc = grp('fancoil', gRoom);
  const fc = box(-1.45, -0.75, 2.22, 2.5, -1.75, -1.55, M(0xE6E7E1)); add(gFc, fc, 'fancoil'); gFc.add(edges(fc, 0x6b736e, .7));
  add(gFc, box(-1.40, -0.80, 2.24, 2.27, -1.551, -1.545, M(0x5C6560)), 'fancoil');                                         // outlet grille

  /* ================= FIRE SAFETY (17–25) ================= */
  const gFS = grp('firesys'); const gFL = new THREE.Group(); gFS.add(gFL);
  const gEF = grp('ecabFire', gE); const gRF = grp('rackFire', gRack);
  add(gFS, box(-3.8, -3.74, 0, 2.08, 1.36, 1.40, M(0x4A504C)), 'sep'); add(gFS, box(-3.8, -3.74, 0, 2.08, 2.30, 2.34, M(0x4A504C)), 'sep'); add(gFS, box(-3.8, -3.74, 2.04, 2.08, 1.36, 2.34, M(0x4A504C)), 'sep');
  add(gFS, box(-3.79, -3.75, 0.0, 2.04, 1.40, 2.30, M(0x9AA39D, { transparent: true, opacity: .85 })), 'sep');            // door T30-RS
  add(gFS, box(-3.75, -3.72, 0.98, 1.02, 2.18, 2.26, M(0x2B302D)), 'sep');
  add(gFS, box(-3.749, -3.742, 1.42, 1.62, 1.62, 1.84, M(0xF4F4EE)), 'sign'); add(gFS, box(-3.742, -3.738, 1.44, 1.60, 1.64, 1.82, M(0x2E7D4F)), 'sign');
  add(gFS, box(-3.749, -3.742, 1.42, 1.62, 1.88, 2.10, M(0xF2C200)), 'sign'); add(gFS, box(-3.749, -3.742, 1.20, 1.36, 1.70, 2.02, M(0xF4F4EE)), 'sign');
  add(gFS, box(-3.79, -3.74, 2.14, 2.26, 1.50, 2.20, M(0xEDEDE6, { emissive: 0x3a0000, emissiveIntensity: .25 })), 'mcp'); // "Löschanlage ausgelöst"
  const snd = cyl(0.07, 0.06, RED); snd.rotation.z = Math.PI / 2; snd.position.set(-3.74, 2.45, 1.85); add(gFS, snd, 'mcp');
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), M(0xF0A030, { emissive: 0xF0A030, emissiveIntensity: .5 })); lens.position.set(-3.70, 2.45, 1.85); add(gFS, lens, 'mcp');
  add(gFS, box(-3.8, -3.75, 1.08, 1.22, 0.96, 1.10, M(RED)), 'mcp'); add(gFS, box(-3.75, -3.745, 1.11, 1.19, 0.99, 1.07, M(0xF4F4EE)), 'mcp');
  add(gFS, box(-3.8, -3.785, 1.34, 1.52, 0.94, 1.12, M(0xE8C21A)), 'notaus');
  const naB = cyl(0.04, 0.045, RED); naB.rotation.z = Math.PI / 2; naB.position.set(-3.762, 1.43, 1.03); add(gFS, naB, 'notaus');
  add(gFS, box(-3.8, -3.70, 1.22, 1.72, 0.38, 0.80, M(0xD5D6CF)), 'bmz');
  add(gFS, box(-3.70, -3.695, 1.50, 1.66, 0.46, 0.72, M(0x1E2A30, { emissive: 0x0a3040, emissiveIntensity: .4 })), 'bmz'); add(gFS, box(-3.70, -3.695, 1.28, 1.40, 0.46, 0.72, M(RED)), 'bmz');
  [1.12, 1.27].forEach(z => { const c = cyl(0.07, 0.56, 0xC0221A, { seg: 20, mat: { roughness: .4 } }); c.position.set(-3.66, 0.33, z); add(gFS, c, 'ext');
    const h = cyl(0.025, 0.08, 0x2B302D, { seg: 12 }); h.position.set(-3.66, 0.65, z); add(gFS, h, 'ext');
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 12), M(0x1A1D1B)); horn.rotation.x = Math.PI / 2; horn.position.set(-3.6, 0.55, z + 0.04); add(gFS, horn, 'ext'); });
  [[-0.3, -0.45], [0.7, -0.45]].forEach(([x, z]) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.045, 24), M(0xF4F4EE)); d.position.set(x, 2.775, z); add(gFS, d, 'smoke');
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), M(RED, { emissive: RED, emissiveIntensity: .8 })); led.position.set(x + 0.04, 2.75, z + 0.03); gFS.add(led); });
  gFS.add(box(-1.2, 1.6, 2.80, 2.805, -1.75, 0.6, M(0xC9CCC5, { transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide }))); // ceiling hint
  const de = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.04, 20), M(0xF4F4EE)); de.position.set(-0.4, 1.975, -0.4); add(gEF, de, 'smokeE');
  const asp = (pts) => { const cur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0); add(gRF, new THREE.Mesh(new THREE.TubeGeometry(cur, 40, 0.009, 8, false), M(RED)), 'fire'); };
  asp([[0.55, uy(42) + 0.02, -0.5], [0.7, 1.985, -0.5], [0.7, 1.985, -1.12], [0.95, 1.985, -1.12], [0.95, 1.985, -0.2]]); // DET-AC sampling pipe
  [[0.9, 0.33], [1.0, 0.33]].forEach(([x, y]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.016, 10, 24), M(0xB5452A)); r.position.set(x, y, -1.75); add(gFS, r, 'sep'); const r2 = r.clone(); r2.position.z = -1.95; add(gFS, r2, 'sep'); });
  add(gFS, box(1.5, 1.7, 2.18, 2.36, -1.97, -1.73, M(0xB5452A)), 'sep'); add(gFS, box(-1.32, -1.08, 2.03, 2.27, -1.80, -1.70, M(0xB5452A, { transparent: true, opacity: .6 })), 'sep');
  add(gFS, box(-0.9, 1.2, 0.0005, 0.004, -1.3, 0.1, M(0xB8BBB3)), 'sep');                // non-combustible base
  function dashed(group, color, pts, dash, gap) { const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))); const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: dash || .05, gapSize: gap || .03 })); l.computeLineDistances(); group.add(l); return l; }
  const fl = pts => dashed(gFL, RED, pts);
  fl([[-3.70, 1.70, 0.60], [-3.70, 2.76, 0.60], [-0.30, 2.76, -0.45], [0.70, 2.76, -0.45]]);       // BMZ → room detectors
  fl([[-3.70, 1.66, 0.56], [-3.70, 2.40, 0.30], [-0.40, 2.40, -0.40], [-0.40, 1.99, -0.40]]);      // BMZ → E-cab detector
  fl([[-3.70, 1.62, 0.52], [-3.70, 2.42, 0.05], [0.40, 2.42, -0.20], [0.40, uy(42) + 0.03, -0.20]]); // BMZ ↔ DET-AC
  fl([[-3.70, 1.40, 0.66], [-3.70, 2.44, -0.05], [-0.66, 2.44, -0.20], [-0.66, 1.86, -0.69]]);     // BMZ → MCCB undervoltage release
  fl([[-3.77, 1.43, 1.03], [-3.70, 2.46, 0.95], [-0.60, 2.46, -0.30], [-0.60, 1.86, -0.69], [-0.25, 0.52, -0.35]]); // Not-Aus → release + UPS EPO
  fl([[-3.75, 1.15, 1.03], [-3.71, 1.30, 0.75]]);
  fl([[-3.74, 2.40, 1.85], [-3.71, 1.72, 0.75]]);

  /* ================= WATER (4) ================= */
  const gWater = grp('water');
  function tube(pts, r, color, cid, parent) { const cur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.08); const t = new THREE.Mesh(new THREE.TubeGeometry(cur, Math.max(40, pts.length * 24), r, 10, false), M(color, { roughness: .5 })); add(parent, t, cid); t.userData.curve = cur; return t; }
  const supPts = [[0.9, 0.45, -2.4], [0.9, 0.4, -2.2], [0.9, 0.36, -1.95], [0.9, 0.32, -1.75], [0.9, 0.1, -1.62], [0.9, 0.05, -1.4], [0.9, 0.05, -1.12], [0.9, 0.1, -1.0]];
  const retPts = [[1.0, 0.1, -1.0], [1.0, 0.05, -1.12], [1.0, 0.05, -1.4], [1.0, 0.1, -1.62], [1.0, 0.32, -1.75], [1.0, 0.36, -1.95], [1.0, 0.4, -2.2], [1.0, 0.45, -2.4]];
  const tSup = tube(supPts, 0.026, FLOW.supply, 'pipes', gWater), tRet = tube(retPts, 0.026, FLOW.ret, 'pipes', gWater);
  tube([[1.0, 0.06, -1.5], [1.1, 0.06, -1.5], [1.16, 0.3, -1.5]], 0.016, FLOW.ret, 'hyd', gWater);                       // return → buffer
  tube([[1.3, 0.92, -1.5], [1.3, 1.0, -1.5], [1.3, 1.0, -1.66], [0.9, 0.9, -1.66], [0.9, 0.36, -1.66]], 0.014, FLOW.supply, 'hyd', gWater); // buffer → supply
  tube([[0.9, 0.12, -1.68], [-0.2, 0.12, -1.7], [-1.1, 0.12, -1.7], [-1.1, 2.2, -1.68]], 0.011, FLOW.supply, 'fancoil', gWater); // branch → fan coil
  tube([[1.0, 0.14, -1.70], [-0.95, 0.14, -1.72], [-0.95, 2.2, -1.70]], 0.011, FLOW.ret, 'fancoil', gWater);
  dashed(gWater, FLOW.ret, [[1.0, 0.06, -1.45], [1.4, 0.06, -1.6], [1.62, 0.4, -1.6]], .05, .035);                    // heat-recovery option
  const beads = [];
  [[tSup, 0x7FB3F0], [tRet, 0xF6C27D]].forEach(([t, c]) => { for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: c })); b.userData = { curve: t.userData.curve, u: i / 14 }; gWater.add(b); beads.push(b); } });

  /* ================= POWER (27) + TRAY (28) ================= */
  const gTray = grp('tray');
  add(gTray, box(-3.55, 1.2, 2.28, 2.30, -0.78, -0.42, M(0x9AA09A, { metalness: .5, roughness: .5 })), 'tray');
  add(gTray, box(-3.55, 1.2, 2.30, 2.36, -0.605, -0.595, M(0x9AA09A, { metalness: .5 })), 'tray');
  const gPow = grp('power');
  const pw = (pts, r, cid) => tube(pts, r || 0.011, FLOW.power, cid || 'feeder', gPow);
  pw([[-3.55, 1.20, -0.47], [-3.4, 2.27, -0.6], [-2.5, 2.27, -0.62], [-0.6, 2.27, -0.62], [-0.65, 2.1, -0.55], [-0.65, 1.97, -0.5], [-0.66, 1.92, -0.72]], 0.017); // feeder NSHV → MCCB
  pw([[-0.3, 1.97, -0.6], [-0.3, 2.22, -0.56], [0.05, 2.22, -0.56], [0.05, 2.02, -0.8], [0.05, 1.9, -1.14]], 0, 'pdu');          // UPS out → PDU A
  pw([[-0.25, 1.97, -0.62], [-0.25, 2.24, -0.58], [0.75, 2.24, -0.58], [0.75, 2.02, -0.8], [0.75, 1.9, -1.14]], 0, 'pdu');       // UPS out → PDU B
  pw([[-0.2, 1.97, -0.64], [-0.2, 2.26, -0.64], [0.95, 2.26, -0.64], [0.95, 2.0, -0.3], [0.95, 1.96, -0.15]], 0, 'lcp');         // UPS out → LCP
  pw([[-0.15, 1.97, -0.66], [-0.15, 2.27, -0.68], [1.15, 2.27, -0.68], [1.6, 2.27, -1.2], [1.6, 2.25, -1.85], [1.6, 1.9, -2.2], [1.55, 1.1, -2.6], [1.4, 1.0, -2.85]], 0, 'chiller'); // board → chiller
  pw([[-0.12, 1.97, -0.70], [-0.12, 2.28, -0.74], [1.2, 2.28, -0.74], [1.62, 2.1, -1.15], [1.62, 0.32, -1.18], [1.55, 0.24, -1.33]], 0.009, 'hyd');      // UPS out → pump
  pw([[-0.45, 1.05, -0.73], [-0.45, 0.8, -0.6], [-0.45, 0.55, -0.5]], 0.009, 'ups');                                              // board → UPS input
  pw([[-0.3, 0.4, -0.74], [-0.1, 0.5, -0.78], [-0.1, 1.95, -0.75]], 0.009, 'ups');                                               // UPS output → distribution
  pw([[-0.7, 1.97, -0.6], [-0.9, 2.27, -0.62], [-1.1, 2.3, -1.4], [-1.1, 2.36, -1.6]], 0.008, 'fancoil');                         // board → fan coil

  /* ================= SIGNALS (data/control) ================= */
  const gSig = grp('signal');
  const sig = pts => dashed(gSig, FLOW.data, pts, .06, .035);
  sig([[-3.54, 1.5, -0.22], [-3.4, 2.34, -0.5], [-0.65, 2.34, -0.5], [-0.65, 2.0, -0.5], [-0.66, 1.42, -0.68]]);   // S1 → EMS
  sig([[-0.55, 1.42, -0.68], [-0.4, 2.0, -0.45], [-0.4, 2.34, -0.47], [0.4, 2.34, -0.47], [0.4, 2.0, -0.3], [0.4, uy(39) + 0.02, -0.04]]); // EMS → OOB
  sig([[-0.5, 1.40, -0.68], [-0.35, 2.0, -0.47], [-0.35, 2.35, -0.48], [0.97, 2.35, -0.48], [0.97, 1.96, -0.18]]); // EMS ↔ LCP
  sig([[-0.45, 1.40, -0.68], [-0.3, 2.35, -0.5], [1.18, 2.35, -0.5], [1.7, 2.35, -1.2], [1.7, 2.3, -1.85], [1.7, 1.6, -2.3], [1.4, 1.2, -2.9]]); // EMS ↔ chiller
  sig([[-0.6, 1.35, -0.69], [-0.5, 0.9, -0.6], [-0.42, 0.52, -0.3]]);                                               // EMS ↔ UPS
  sig([[-1.2, 2.15, -1.72], [-1.0, 2.34, -0.6], [0.3, 2.34, -0.6], [0.3, 2.0, -0.35], [0.3, uy(37) + 0.02, -0.04]]); // uplink → firewall
  sig([[0.4, uy(42) + 0.02, -0.3], [0.45, 2.0, -0.3], [0.45, 2.33, -0.44], [-0.45, 2.33, -0.44], [-0.45, 2.0, -0.5], [-0.58, 1.44, -0.69]]); // DET-AC → EMS
  sig([[-0.4, 1.38, -0.69], [-0.2, 2.33, -0.7], [1.25, 2.33, -0.8], [1.4, 1.2, -1.3], [0.95, 0.2, -1.3]]);           // EMS → valves / leak
  sig([[-0.62, 1.36, -0.69], [-0.85, 2.33, -0.7], [-1.0, 2.36, -1.55]]);                                            // EMS → fan coil

  /* ================= AIR (closed loop) ================= */
  const gAir = grp('air');
  const NP = 900; const airGeo = new THREE.BufferGeometry(); const pos = new Float32Array(NP * 3), col = new Float32Array(NP * 3);
  airGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); airGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  gAir.add(new THREE.Points(airGeo, new THREE.PointsMaterial({ size: 0.042, vertexColors: true, transparent: true, opacity: .9, depthWrite: false })));
  const P = []; const cCold = new THREE.Color(FLOW.cold), cHot = new THREE.Color(FLOW.hot), tmpC = new THREE.Color();
  function zonesY() { const c = S.config; if (c === 'P0') return [[uy(1), uy(5)], [uy(11), uy(20)], [uy(37), uy(43)]]; return [[uy(1), uy(9)], [uy(9), uy(11)], [uy(37), uy(43)]]; }
  function respawn(p) { const z = zonesY(); const tot = z.reduce((a, b) => a + (b[1] - b[0]), 0); let r = Math.random() * tot; let y = z[0][0]; for (const [a, b] of z) { if (r < b - a) { y = a + r; break; } r -= b - a; } p.y = y + 0.005; p.x = 0.2 + Math.random() * 0.4; p.yl = 0.2 + Math.random() * 1.65; }
  for (let i = 0; i < NP; i++) { const p = { t: Math.random(), v: 0.06 + Math.random() * 0.05 }; respawn(p); P.push(p); }
  const SEG = [0.16, 0.40, 0.12, 0.06, 0.20, 0.06]; const SEGC = []; { let a = 0; SEG.forEach(s => { a += s; SEGC.push(a); }); }
  function airPos(p, out) {
    let t = p.t, i = 0; while (i < SEG.length - 1 && t > SEGC[i]) i++; const t0 = i ? SEGC[i - 1] : 0; const k = (t - t0) / SEG[i]; let x, y, z, h; const yl = p.yl;
    switch (i) {
      case 0: x = 0.78 + (p.x - 0.78) * k; y = yl + (p.y - yl) * k; z = -0.025; h = 0; break;   // front plenum
      case 1: x = p.x; y = p.y; z = -0.03 - 1.12 * k; h = k; break;                           // through servers
      case 2: x = p.x + (0.86 - p.x) * k; y = p.y; z = -1.16; h = 1; break;                    // rear plenum
      case 3: x = 0.86 + 0.09 * k; y = p.y + (yl - p.y) * k; z = -1.16 + 0.12 * k; h = 1; break; // into LCP
      case 4: x = 0.95; y = yl; z = -1.04 + 0.9 * k; h = k < 0.45 ? 1 : Math.max(0, 1 - (k - 0.45) / 0.12); break; // coil
      default: x = 0.95 - 0.17 * k; y = yl; z = -0.14 + 0.115 * k; h = 0;                      // back to front
    }
    out[0] = x; out[1] = y; out[2] = z; return h;
  }
  const o3 = [0, 0, 0];
  function stepAir(dt) { for (let i = 0; i < NP; i++) { const p = P[i]; p.t += dt * p.v; if (p.t >= 1) { p.t -= 1; respawn(p); } const h = airPos(p, o3); pos[i * 3] = o3[0]; pos[i * 3 + 1] = o3[1]; pos[i * 3 + 2] = o3[2]; tmpC.copy(cCold).lerp(cHot, h); col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b; } airGeo.attributes.position.needsUpdate = true; airGeo.attributes.color.needsUpdate = true; }
  stepAir(0);

  /* ================= DIMENSIONS & LABELS ================= */
  const gDim = grp('dims'); const gStatic = grp('static');
  function textSprite(txt, color, size) { const c = document.createElement('canvas'); const ctx = c.getContext('2d'); const fs = 56; const font = `500 ${fs}px ${O.font}`; ctx.font = font; const w = Math.ceil(ctx.measureText(txt).width) + 20; c.width = w; c.height = Math.ceil(fs * 1.35); ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(txt, 10, c.height / 2); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; textures.push(t); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(size * c.width / c.height, size, 1); s.renderOrder = 999; return s; }
  function dimLine(a, b, label, color, off) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); gDim.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color }))); const s = textSprite(label, color, 0.11); s.position.set((a[0] + b[0]) / 2 + (off ? off[0] : 0), (a[1] + b[1]) / 2 + (off ? off[1] : 0), (a[2] + b[2]) / 2 + (off ? off[2] : 0)); gDim.add(s); }
  function clearGroup(g) { g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); g.clear(); }
  function buildDims() {
    clearGroup(gDim); clearGroup(gStatic);
    const pal = PALETTES[S.theme] || PALETTES.light; const ink = pal.ink, mut = pal.muted;
    dimLine([-0.8, 0.01, 0.4], [1.1, 0.01, 0.4], '1 900 мм', ink, [0, 0.08, 0]);
    dimLine([-0.8, 0.01, 0.25], [0, 0.01, 0.25], '800', mut, [0, 0.06, 0]);
    dimLine([0, 0.01, 0.25], [0.8, 0.01, 0.25], '800', mut, [0, 0.06, 0]);
    dimLine([0.8, 0.01, 0.25], [1.1, 0.01, 0.25], '300', mut, [0, 0.06, 0]);
    dimLine([-0.95, 0, 0.02], [-0.95, 2.0, 0.02], '2 000 мм', ink, [-0.25, 0, 0]);
    dimLine([1.3, 0.01, 0], [1.3, 0.01, -1.2], '1 200 мм', ink, [0.32, 0.05, 0]);
    dashed(gDim, mut, [[-0.8, 0.006, 0], [-0.8, 0.006, 1.2], [1.1, 0.006, 1.2], [1.1, 0.006, 0]], .06, .04);
    const zl = textSprite('зона обслуживания ≥ 1 200 мм', mut, 0.1); zl.position.set(0.15, 0.05, 0.85); gDim.add(zl);
    [['стена здания', [-1.9, 2.62, -1.85]], ['снаружи', [0.7, 0.15, -3.75]], ['помещение', [-2.0, 0.15, 1.6]]].forEach(([t, p]) => { const s = textSprite(t, mut, 0.09); s.position.set(...p); gStatic.add(s); });
  }

  /* ================= THEME ================= */
  function applyTheme() {
    const pal = PALETTES[S.theme] || PALETTES.light;
    scene.background = new THREE.Color(pal.scene); floorMat.color.set(pal.floor); groundMat.color.set(pal.ground); wallMat.color.set(pal.wall);
    if (grid) { gRoom.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    grid = new THREE.GridHelper(7, 14, pal.grid, pal.grid); grid.position.set(-0.4, 0.002, 0.85); grid.scale.z = 5.6 / 7; gRoom.add(grid);
    const dark = S.theme === 'dark'; edgeMats.forEach(m => { m.color.set(dark ? 0xAEB8B0 : m.userData.c0); m.opacity = dark ? Math.max(0.28, m.userData.o0 * 0.55) : m.userData.o0; });
    ledMat.emissiveIntensity = dark ? 0.9 : 0.35;
    buildDims(); invalidate();
  }

  /* ================= MARKERS ================= */
  const resolveY = v => { if (typeof v === 'number') return v; let m = /^U(\d+)-(\d+)$/.exec(v); if (m) return (uy(+m[1]) + uy(+m[2])) / 2; m = /^U(\d+)\+$/.exec(v); if (m) return uy(+m[1]) + 0.02; return 0; };
  const ANCH = {};
  COMP.forEach(c => { const a = c.anchor; if (!a || !G[a.group]) { console.warn('[ggm-cabinet] no anchor group for', c.id); return; } ANCH[c.id] = [G[a.group], a.pos[0], resolveY(a.pos[1]), a.pos[2]]; });
  const MK = {};
  COMP.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ggm-mk'; b.textContent = c.n; b.title = c.name; b.setAttribute('aria-label', c.n + '. ' + c.name); b.addEventListener('click', e => { e.stopPropagation(); select(c.id, { fly: true }); }); mkWrap.appendChild(b); MK[c.id] = b; });
  const vtmp = new THREE.Vector3();
  function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  const occRay = new THREE.Raycaster(); const wpos = new THREE.Vector3();
  function occluded(a) { wpos.set(a[1], a[2], a[3]); a[0].localToWorld(wpos); const dir = wpos.clone().sub(camera.position); const d = dir.length(); occRay.set(camera.position, dir.normalize()); occRay.far = d - 0.06;
    const hs = occRay.intersectObjects(pickables, false); for (const h of hs) { if (h.object.userData.shell) continue; if (!visibleChain(h.object)) continue; if (h.object.material && h.object.material.opacity < 0.6) continue; return true; } return false; }
  function updateMarkers() {
    const w = host.clientWidth, h = host.clientHeight;
    COMP.forEach(c => { const a = ANCH[c.id]; const b = MK[c.id]; if (!b) return; if (!a || !O.markers || !S.layers.numbers || !visibleChain(a[0])) { b.hidden = true; return; }
      vtmp.set(a[1], a[2], a[3]); a[0].localToWorld(vtmp); vtmp.project(camera);
      if (vtmp.z > 1 || vtmp.x < -1.05 || vtmp.x > 1.05 || vtmp.y < -1.05 || vtmp.y > 1.05) { b.hidden = true; return; }
      b.hidden = false; b.style.opacity = occluded(a) ? '0.32' : '1'; b.style.transform = `translate(${(vtmp.x * .5 + .5) * w}px,${(-vtmp.y * .5 + .5) * h}px)`;
      b.classList.toggle('sel', S.sel === c.id); });
  }

  /* ================= MODES ================= */
  const shellOpacity = () => S.shell === 'solid' ? 1 : .12;
  function applyShell() {
    shellMeshes.forEach(m => { m.visible = S.shell !== 'hidden'; m.material.opacity = shellOpacity(); m.material.depthWrite = S.shell === 'solid'; m.material.transparent = S.shell !== 'solid'; });
    equipGlass.forEach(m => { m.transparent = true; m.opacity = S.shell === 'solid' ? 1 : 0.5; m.depthWrite = S.shell === 'solid'; });
    faceMats.forEach(m => { m.opacity = S.shell === 'solid' ? 1 : 0.38; m.depthWrite = S.shell === 'solid'; });
    blankMat.opacity = S.shell === 'solid' ? 1 : (S.shell === 'glass' ? 0.5 : 0.18); blankMat.depthWrite = S.shell === 'solid';
    if (S.sel) setHL(S.sel, true); invalidate();
  }
  const EXP = [[gE, [-0.75, 0, 0]], [gL, [0.75, 0, 0]], [gB1, [0, 0, 1.15]], [gB2, [0, 0, 0.9]], [gCPU, [0, 0, 0.65]], [gLB, [0, 0, 0.75]], [gNet, [0, 0, 0.45]], [gDet, [0, 0, 0.45]]];
  let expK = 0;
  function applyLayers() {
    const L = S.layers, conn = expK < 0.02;
    gWater.visible = L.water && conn; gPow.visible = L.power && conn; gSig.visible = L.signals && conn; gTray.visible = L.power || L.signals;
    gDim.visible = L.dims; gAir.visible = L.air && conn; gScale.visible = !!L.scale;
    gFS.visible = L.fire; gEF.visible = L.fire; gRF.visible = L.fire; gFL.visible = L.fire && conn;
    invalidate();
  }
  function setHL(id, on) {
    (compMeshes[id] || []).forEach(m => { if (!m.material || !m.material.emissive) return;
      if (m.userData.shell) { m.material.opacity = on ? 0.22 : shellOpacity(); m.material.emissive.setHex(on ? 0xC2461C : 0); m.material.emissiveIntensity = on ? .35 : 0; return; }
      if (m.userData.e0 === undefined) { m.userData.e0 = m.material.emissive.getHex(); m.userData.ei = m.material.emissiveIntensity; }
      if (on) { m.material.emissive.setHex(0xC2461C); m.material.emissiveIntensity = .55; } else { m.material.emissive.setHex(m.userData.e0); m.material.emissiveIntensity = m.userData.ei; } });
  }

  /* ================= CAMERA ================= */
  let fly = null;
  function flyTo(p, t, inst) {
    const P1 = p.isVector3 ? p.clone() : new THREE.Vector3(...p), T1 = t.isVector3 ? t.clone() : new THREE.Vector3(...t);
    if (inst || reduceMotion) { camera.position.copy(P1); controls.target.copy(T1); controls.update(); fly = null; invalidate(); return; }
    fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: P1, t1: T1, k: 0 }; invalidate();
  }
  function viewPose(v) { const [p, t] = poseFor(v, camera.aspect); return [new THREE.Vector3(...p), new THREE.Vector3(...t)]; }

  /* ================= PICKING ================= */
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let down = null;
  const onDown = e => { down = [e.clientX, e.clientY]; };
  const onUp = e => { if (!down) return; const dx = e.clientX - down[0], dy = e.clientY - down[1]; down = null; if (dx * dx + dy * dy > 25) return;
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false).filter(h => visibleChain(h.object) && h.object.userData.cid);
    let h = hits.find(x => !x.object.userData.shell) || hits[0]; if (S.shell === 'solid') h = hits[0];
    select(h ? h.object.userData.cid : null, { fly: false }); };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp);

  /* ================= LOOP (renders only while visible; idle frames are skipped) ================= */
  let dirty = true, raf = 0, visible = true, disposed = false, paused = false;
  function invalidate() { dirty = true; }
  controls.addEventListener('change', invalidate);
  const clock = new THREE.Clock();
  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || paused) return;
    if (fly) { fly.k = Math.min(1, fly.k + dt * 1.8); const e = fly.k < .5 ? 2 * fly.k * fly.k : 1 - Math.pow(-2 * fly.k + 2, 2) / 2; camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) fly = null; dirty = true; }
    const tgt = S.layers.explode ? 1 : 0;
    if (expK !== tgt) { expK += (tgt - expK) * Math.min(1, reduceMotion ? 1 : dt * 5); if (Math.abs(tgt - expK) < 0.001) expK = tgt; EXP.forEach(([g, v]) => g.position.set(v[0] * expK, v[1] * expK, v[2] * expK)); applyLayers(); }
    const animating = (gAir.visible || gWater.visible) && !reduceMotion;
    if (gAir.visible && !reduceMotion) stepAir(dt);
    if (gWater.visible && !reduceMotion) beads.forEach(b => { b.userData.u = (b.userData.u + dt * 0.09) % 1; b.position.copy(b.userData.curve.getPointAt(b.userData.u)); });
    const moved = controls.update();
    if (dirty || moved || animating) { renderer.render(scene, camera); updateMarkers(); dirty = false; }
  }
  let io = null;
  if (typeof IntersectionObserver !== 'undefined') { io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting) && document.visibilityState !== 'hidden'; if (visible) invalidate(); }); io.observe(host); }
  const onVis = () => { visible = document.visibilityState !== 'hidden'; if (visible) invalidate(); };
  document.addEventListener('visibilitychange', onVis);
  function resize() { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate(); }
  let ro = null; if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(host); }

  /* ================= API ================= */
  function ariaLabel() { canvas.setAttribute('aria-label', `3D-модель шкафа GGM-Node, конфигурация ${S.config}, вид ${S.view}`); }
  function changed() { ariaLabel(); emit('change', getState()); }
  function getState() { return { config: S.config, view: S.view, shell: S.shell, theme: S.theme, layers: Object.assign({}, S.layers), selected: S.sel }; }
  function setConfig(c) { if (!CONFIGS.includes(c)) throw new Error('config ' + c); S.config = c; buildBricks(); P.forEach(respawn); if (S.sel && ANCH[S.sel] && !visibleChain(ANCH[S.sel][0])) select(null); invalidate(); changed(); }
  function setView(v, inst) { if (!VIEWS[v]) throw new Error('view ' + v); S.view = v; const [p, t] = viewPose(v); flyTo(p, t, inst); changed(); }
  function setShell(s) { if (!SHELLS.includes(s)) throw new Error('shell ' + s); S.shell = s; applyShell(); changed(); }
  function setLayer(k, on) { if (!LAYERS.includes(k)) throw new Error('layer ' + k); S.layers[k] = !!on; if (k === 'explode' && reduceMotion) { expK = on ? 1 : 0; EXP.forEach(([g, v]) => g.position.set(v[0] * expK, v[1] * expK, v[2] * expK)); } applyLayers(); changed(); }
  function setTheme(t) { S.theme = PALETTES[t] ? t : 'light'; applyTheme(); changed(); }
  function select(id, opt) {
    if (id && !compMeshes[id] && !ANCH[id]) id = null;
    if (S.sel) setHL(S.sel, false); S.sel = id; if (id) setHL(id, true);
    if (id && opt && opt.fly) { const a = ANCH[id]; if (a) { const t = new THREE.Vector3(a[1], a[2], a[3]); a[0].localToWorld(t); const dir = camera.position.clone().sub(controls.target).normalize(); const far = ['chiller', 'nshv', 'tray', 'uplink', 'feeder', 'pipes', 'hrx', 'sep', 'smoke', 'fancoil', 'hyd'].includes(id); flyTo(t.clone().add(dir.multiplyScalar(far ? 3.2 : 2.0)), t); } }
    invalidate(); emit('select', id); changed();
  }
  function screenshot(type) { renderer.render(scene, camera); return canvas.toDataURL(type || 'image/png'); }
  function dispose() {
    if (disposed) return; disposed = true; cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp); document.removeEventListener('visibilitychange', onVis);
    if (io) io.disconnect(); if (ro) ro.disconnect(); controls.dispose();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
    textures.forEach(t => t.dispose()); renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss();
    canvas.remove(); mkWrap.remove(); host.classList.remove('ggm-cab'); listeners.select.clear(); listeners.change.clear();
  }

  /* ================= INIT ================= */
  buildBricks(); applyLayers(); resize(); applyTheme();
  { const [p, t] = viewPose(S.view); flyTo(p, t, true); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!disposed) buildDims(); });
  ariaLabel(); raf = requestAnimationFrame(frame);

  return {
    setConfig, setView, setShell, setLayer, setTheme, select, resize, dispose, screenshot, getState,
    /** pause/resume rendering (used when the cabinet is hidden behind another scene) */
    setPaused(p) { paused = !!p; if (!paused) invalidate(); },
    onSelect(cb) { listeners.select.add(cb); return () => listeners.select.delete(cb); },
    onChange(cb) { listeners.change.add(cb); return () => listeners.change.delete(cb); },
    data: CABINET,
  };
}

export default mountCabinet;
