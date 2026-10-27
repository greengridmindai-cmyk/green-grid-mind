// GGM site scene — levels 1–3 (site → building → node room) and pose-matched hand-over to the cabinet module (level 4).
// three@0.128.0. Public API: mountSite(host, options) → SiteHandle (see siteScene.d.ts, GGM_Site_3D_Prompt_v1.0).
// Units: metres, kW. Orientation: +z south, +x east. Data: siteData.js; energy: energyModel.js; cabinet: cabinetScene.js.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SITE } from './siteData.js';
import { simulateDay, at, SEASONS } from './energyModel.js';
import { mountCabinet, poseFor } from './cabinetScene.js';

export const LEVELS = ['site', 'building', 'room', 'cabinet'];
export const SITE_FLOW = { pv: 0xE3A83B, farm: 0xD8CFA8, grid: 0xC9CEC8, bess: 0xB48CE0, node: 0x5BC488, heat: 0xEF6656, cold: 0x5B9BE6 };
const PAL = { bg: 0x070908, ground: 0x0E1310, field: 0x131A14, fieldLine: 0x1E2820, road: 0x22272A, surf: 0x2A322D, surf2: 0x333C36, roof: 0x232B26,
  edge: 0xC9D2CA, room: 0x37423B, tree: 0x18241C, trunk: 0x2A2620, ink: '#ECF0EA', muted: '#9AA39C' };
const ROOM_H = 2.9;
const LABEL_T = { pv: 0.3, farm: 0.62, bessCharge: 0.45, bessDischarge: 0.55, node: 0.5, gridImport: 0.35, gridExport: 0.7, heat: 0.75 }; // label position along each flow path

let cssDone = false;
function injectCss() {
  if (cssDone || typeof document === 'undefined') return; cssDone = true;
  const st = document.createElement('style'); st.setAttribute('data-ggm-site', '');
  st.textContent = `.ggm-site{position:relative;overflow:hidden;background:#070908}.ggm-site>canvas{display:block;width:100%;height:100%;touch-action:none}
.ggm-site-ui{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.ggm-site-cab{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .45s cubic-bezier(.22,1,.36,1)}
.ggm-site-cab.on{opacity:1;pointer-events:auto}
.ggm-site-fade{position:absolute;inset:0;background:#070908;opacity:0;pointer-events:none;transition:opacity .25s}
.ggm-sm{position:absolute;left:0;top:0;pointer-events:auto;transform-origin:0 0;display:flex;align-items:center;gap:6px;padding:0;border:0;background:none;cursor:pointer;font:500 12px/1 "JetBrains Mono","IBM Plex Mono",Menlo,monospace;color:#ECF0EA;white-space:nowrap}
.ggm-sm b{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:1.5px solid #ECF0EA;background:rgba(7,9,8,.82);font-weight:600;font-size:12px;border-radius:2px}
.ggm-sm.num b{background:#ECF0EA;color:#070908}
.ggm-sm.num.node b{background:#5BC488;border-color:#5BC488;animation:ggmPulse 2.2s ease-in-out infinite}
.ggm-sm span{background:rgba(7,9,8,.72);padding:5px 7px;letter-spacing:.04em}
.ggm-sm.letter span{display:none}.ggm-sm.letter:hover span,.ggm-sm.letter:focus-visible span,.ggm-sm.sel span{display:inline}
.ggm-sm.sel b{border-color:#E3A83B;color:#E3A83B}
.ggm-sm:focus-visible{outline:1px solid rgba(236,240,234,.8);outline-offset:3px}
.ggm-sl{position:absolute;left:0;top:0;font:500 11px/1.2 "JetBrains Mono","IBM Plex Mono",Menlo,monospace;color:#ECF0EA;background:rgba(7,9,8,.7);padding:3px 6px;border-left:2px solid currentColor;white-space:nowrap;pointer-events:none;transition:opacity .3s}
.ggm-bl{position:absolute;left:0;top:0;font:400 11px/1 "JetBrains Mono","IBM Plex Mono",Menlo,monospace;color:#9AA39C;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;pointer-events:none}
@keyframes ggmPulse{0%,100%{box-shadow:0 0 0 0 rgba(91,196,136,.55)}50%{box-shadow:0 0 0 8px rgba(91,196,136,0)}}
@media (prefers-reduced-motion:reduce){.ggm-sm.num.node b{animation:none}.ggm-site-cab{transition:none}}`;
  document.head.appendChild(st);
}

export function mountSite(host, options = {}) {
  injectCss();
  const reduce = options.reducedMotion != null ? options.reducedMotion : (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const S = { site: options.site || SITE.sites[0].id, level: 'site', config: options.config || 'L', hour: options.hour ?? 13, season: options.season || 'summer',
    playing: false, touring: false, tourStep: -1, selected: null, busy: false };
  const L = { change: new Set(), select: new Set() };
  const emit = (k, v) => L[k].forEach(cb => { try { cb(v); } catch (e) { console.error(e); } });

  /* ---------- DOM ---------- */
  host.classList.add('ggm-site');
  const canvas = document.createElement('canvas'); canvas.setAttribute('role', 'img'); host.appendChild(canvas);
  const ui = document.createElement('div'); ui.className = 'ggm-site-ui'; host.appendChild(ui);
  const cabHost = document.createElement('div'); cabHost.className = 'ggm-site-cab'; cabHost.style.cssText = 'position:absolute;inset:0'; host.appendChild(cabHost); // inline: the cabinet module adds position:relative
  const fadeEl = document.createElement('div'); fadeEl.className = 'ggm-site-fade'; host.appendChild(fadeEl);

  /* ---------- three ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(); scene.background = new THREE.Color(PAL.bg); scene.fog = new THREE.FogExp2(PAL.bg, 0.0022);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 2500);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.47; controls.autoRotateSpeed = 0.35;
  const hemi = new THREE.HemisphereLight(0xC8D2CC, 0x0A0D0B, 0.6); scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.12); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xFFE2B0, 1.0); scene.add(sun); scene.add(sun.target);
  const sunDisk = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture('#E3A83B'), color: 0xffffff, transparent: true, depthWrite: false, fog: false })); sunDisk.scale.set(22, 22, 1); scene.add(sunDisk);

  function dotTexture(color) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, color); g.addColorStop(0.55, color); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
  const pvTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#1B2A45'; x.fillRect(0, 0, 64, 96); x.strokeStyle = '#2E4470'; x.lineWidth = 1; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * 64 / 6, 0); x.lineTo(i * 64 / 6, 96); x.stroke(); } for (let j = 1; j < 10; j++) { x.beginPath(); x.moveTo(0, j * 9.6); x.lineTo(64, j * 9.6); x.stroke(); } x.strokeStyle = '#8A96A8'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 61, 93); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; })();
  const dotTex = dotTexture('#ffffff');

  /* ---------- world (rebuilt per site) ---------- */
  let W = null; // { root, site, buildings:{}, nodeB, room, P:{}, flows:[], markers:[], labels:[], day, pvMats:[] }
  const track = o => o; // world resources are disposed by traversing the old world root (setSite / dispose)
  const mat = (c, o) => track(new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .92, metalness: .04, transparent: true, opacity: 1 }, o || {})));
  const lineMat = (c, op) => track(new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op }));
  function box(x0, x1, y0, y1, z0, z1, m) { const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); const b = new THREE.Mesh(g, m); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return b; }
  function outline(mesh, m) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), m); e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale); return e; }
  function cyl(r, h, m, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 32), m); }

  // ---- building builders: return {group, shell:[mats], edges:[mats], roofs:[{kind, origin, u, n, along, len, width}], interior:Group}
  function makeShell(b) { return { shellM: mat(b.color === 'hall' ? PAL.surf2 : PAL.surf), roofM: mat(PAL.roof, { side: THREE.DoubleSide }), edgeM: lineMat(PAL.edge, 0.5) }; }
  function addSolid(B, mesh, m, kind) { mesh.material = m; B.group.add(mesh); B.group.add(outline(mesh, B.edgeM)); (kind === 'roof' ? B.roofMeshes : B.wallMeshes).push(mesh); mesh.userData.bid = B.id; return mesh; }

  function gableBuilding(b) {
    const B = { id: b.id, b, group: new THREE.Group(), roofs: [], wallMeshes: [], roofMeshes: [], interior: new THREE.Group(), ...makeShell(b) };
    const { L: Lb, W: Wb, eave, ridge } = b; const ov = 0.6, th = Math.atan((ridge - eave) / (Wb / 2));
    const barn = b.type === 'dairyBarn';
    // long walls (barn: solid plinth + translucent wind netting)
    for (const s of [1, -1]) {
      if (barn) {
        addSolid(B, box(-Lb / 2, Lb / 2, 0, 1.4, s * Wb / 2 - 0.12, s * Wb / 2 + 0.12), B.shellM);
        const net = box(-Lb / 2, Lb / 2, 1.4, eave, s * Wb / 2 - 0.03, s * Wb / 2 + 0.03); addSolid(B, net, B.netM || (B.netM = mat(0x2A332E, { opacity: 0.45 })));
        for (let x = -Lb / 2; x <= Lb / 2 + 0.01; x += 6) addSolid(B, box(x - 0.12, x + 0.12, 0, eave, s * Wb / 2 - 0.15, s * Wb / 2 + 0.15), B.shellM);
      } else addSolid(B, box(-Lb / 2, Lb / 2, 0, eave, s * Wb / 2 - 0.15, s * Wb / 2 + 0.15), B.shellM);
    }
    // gables
    const sh = new THREE.Shape([new THREE.Vector2(-Wb / 2, 0), new THREE.Vector2(Wb / 2, 0), new THREE.Vector2(Wb / 2, eave), new THREE.Vector2(0, ridge), new THREE.Vector2(-Wb / 2, eave)]);
    for (const s of [1, -1]) { const g = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false })); g.rotation.y = Math.PI / 2; g.position.set(s * Lb / 2 - 0.15, 0, 0); addSolid(B, g, B.shellM); }
    // roof slopes
    const sl = (Wb / 2 + ov) / Math.cos(th), Lr = Lb + 2 * ov;
    for (const s of [1, -1]) {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(Lr, sl)); r.rotation.x = s > 0 ? th - Math.PI / 2 : Math.PI / 2 - th;
      r.position.set(0, ridge - (Wb / 2 + ov) * Math.tan(th) / 2, s * (Wb / 2 + ov) / 2); addSolid(B, r, B.roofM, 'roof');
      const n = new THREE.Vector3(0, Math.cos(th), s * Math.sin(th)), down = new THREE.Vector3(0, -Math.sin(th), s * Math.cos(th));
      B.roofs.push({ key: s > 0 ? 'south' : 'north', origin: new THREE.Vector3(0, ridge, 0), u: new THREE.Vector3(1, 0, 0), n, down, len: sl, width: Lr });
    }
    if (barn) { // interior: feed alley, cubicle rows, feed fences
      const fl = mat(0x1E2521), bed = mat(0x2A322D);
      B.interior.add(box(-Lb / 2 + 1, Lb / 2 - 1, 0, 0.05, -2.2, 2.2, fl));
      for (const s of [1, -1]) { B.interior.add(box(-Lb / 2 + 1, Lb / 2 - 9, 0, 0.25, s * 5, s * 10, bed)); const fence = box(-Lb / 2 + 1, Lb / 2 - 9, 0.3, 1.2, s * 2.3 - 0.04, s * 2.3 + 0.04, mat(0x3A443E, { opacity: 0.8 })); B.interior.add(fence); }
      for (let x = -Lb / 2 + 2; x < Lb / 2 - 9; x += 1.25) for (const s of [1, -1]) B.interior.add(box(x - 0.03, x + 0.03, 0.25, 1.1, s * 5, s * 7.4, bed));
    }
    B.group.add(B.interior);
    return B;
  }
  function flatBuilding(b) {
    const B = { id: b.id, b, group: new THREE.Group(), roofs: [], wallMeshes: [], roofMeshes: [], interior: new THREE.Group(), ...makeShell(b) };
    const h = b.eave || b.h, Lb = b.L, Wb = b.W;
    for (const s of [1, -1]) { addSolid(B, box(-Lb / 2, Lb / 2, 0, h, s * Wb / 2 - 0.15, s * Wb / 2 + 0.15), B.shellM); addSolid(B, box(s * Lb / 2 - 0.15, s * Lb / 2 + 0.15, 0, h, -Wb / 2, Wb / 2), B.shellM); }
    addSolid(B, box(-Lb / 2, Lb / 2, h, h + 0.3, -Wb / 2, Wb / 2), B.roofM, 'roof');
    for (const s of [1, -1]) addSolid(B, box(-Lb / 2, Lb / 2, h + 0.3, h + 1.0, s * Wb / 2 - 0.1, s * Wb / 2 + 0.1), B.roofM, 'roof');
    // facade bands
    const band = lineMat(PAL.edge, 0.16);
    for (let y = 2.5; y < h; y += 3) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-Lb / 2, y, Wb / 2 + 0.16), new THREE.Vector3(Lb / 2, y, Wb / 2 + 0.16)]); B.group.add(new THREE.Line(g, band)); }
    B.roofs.push({ key: 'flat', y: h + 0.3, Lb, Wb });
    if (b.type === 'flatHall') { const rk = mat(0x2A322D); for (let x = -Lb / 2 + 6; x < Lb / 2 - 12; x += 8) B.interior.add(box(x, x + 1.2, 0, 5, -Wb / 2 + 4, Wb / 2 - 10, rk)); }
    B.group.add(B.interior);
    return B;
  }

  // ---- PV placement on roofs (InstancedMesh per building, one shared geometry)
  const panelGeo = new THREE.BoxGeometry(1.13, 0.04, 1.72); // shared, disposed in dispose()
  function roofCapacity(B) {
    const caps = [];
    for (const r of B.roofs) {
      const fill = B.b.pv && B.b.pv[r.key] || 0; if (!fill) continue;
      if (r.key === 'flat') { const nx = Math.floor((r.Lb - 4) / 1.8), nz = Math.floor((r.Wb - 4) / 1.25); caps.push({ r, max: Math.floor(nx * nz * fill), nx, nz }); }
      else { const nx = Math.floor((r.width - 1.6) / 1.18), nz = Math.floor((r.len - 0.9) / 1.78); caps.push({ r, max: Math.floor(nx * nz * fill), nx, nz }); }
    }
    return caps;
  }
  function placePV(B, cap, count, pvMat) {
    if (count <= 0) return null;
    const im = new THREE.InstancedMesh(panelGeo, pvMat, count); const m4 = new THREE.Matrix4(); let k = 0; const r = cap.r;
    const center = new THREE.Vector3();
    if (r.key === 'flat') {
      const rows = Math.ceil(count / cap.nx); const tilt = 10 * Math.PI / 180;
      for (let j = 0; j < rows && k < count; j++) for (let i = 0; i < cap.nx && k < count; i++) {
        const x = -r.Lb / 2 + 2 + 0.9 + i * 1.8, z = -r.Wb / 2 + 2 + 0.6 + j * 1.25, s = i % 2 ? 1 : -1;
        const n = new THREE.Vector3(s * Math.sin(tilt), Math.cos(tilt), 0), u = new THREE.Vector3(0, 0, 1), w = new THREE.Vector3().crossVectors(u, n);
        m4.makeBasis(u, n, w).setPosition(x, r.y + 0.35, z); im.setMatrixAt(k++, m4); center.add(new THREE.Vector3(x, r.y + 0.35, z));
      }
    } else {
      const rows = Math.ceil(count / cap.nx);
      for (let j = 0; j < rows && k < count; j++) {
        const inRow = Math.min(cap.nx, count - k), off = (cap.nx - inRow) * 1.18 / 2;
        for (let i = 0; i < inRow; i++) {
          const along = -r.width / 2 + 0.8 + 0.59 + off + i * 1.18, down = 0.6 + 0.89 + j * 1.78;
          const p = r.origin.clone().addScaledVector(r.u, along).addScaledVector(r.down, down).addScaledVector(r.n, 0.14);
          const w = new THREE.Vector3().crossVectors(r.u, r.n); m4.makeBasis(r.u, r.n, w).setPosition(p.x, p.y, p.z); im.setMatrixAt(k++, m4); center.add(p);
        }
      }
    }
    im.instanceMatrix.needsUpdate = true; im.userData.center = center.multiplyScalar(1 / Math.max(1, k)); im.userData.count = k;
    B.group.add(im); return im;
  }

  // ---- node room in cabinet coordinates (same frame as cabinetScene.js)
  function buildRoom(B) {
    const b = B.b, room = new THREE.Group(); room.rotation.y = Math.PI;
    room.position.set(b.L / 2 - 4.1, 0, b.W / 2 - 1.85); B.group.add(room);
    const wallM = mat(PAL.room), eM = lineMat(PAL.edge, 0.55), dark = mat(0x101412), add = (m, mm) => { m.material = mm || m.material; room.add(m); room.add(outline(m, eM)); return m; };
    room.add(box(-3.8, 3.4, 0, 0.03, -1.75, 3.8, mat(0x1C2320)));                                  // floor
    add(box(-3.8, -3.6, 0, ROOM_H, -1.75, 1.4), wallM); add(box(-3.8, -3.6, 0, ROOM_H, 2.3, 3.8), wallM); add(box(-3.8, -3.6, 2.15, ROOM_H, 1.4, 2.3), wallM); // left wall with door
    add(box(-3.79, -3.75, 0, 2.12, 1.42, 2.28), mat(0x5A645E));                                   // door T30-RS
    const CUT = 1.05, cutM = mat(0x4F5852);                                                      // right + front wall: architectural section cut
    add(box(3.2, 3.4, 0, CUT, -1.75, 3.8), wallM); add(box(-3.6, 3.2, 0, CUT, 3.6, 3.8), wallM);
    room.add(box(3.2, 3.4, CUT, CUT + 0.01, -1.75, 3.8, cutM)); room.add(box(-3.6, 3.2, CUT, CUT + 0.01, 3.6, 3.8, cutM));
    // service zone marking
    const yel = mat(0xE0B416); room.add(box(-0.8, 1.1, 0.031, 0.036, 1.17, 1.22, yel)); room.add(box(-0.8, -0.75, 0.031, 0.036, 0, 1.22, yel)); room.add(box(1.05, 1.1, 0.031, 0.036, 0, 1.22, yel));
    // row (simplified, same dimensions as the cabinet model)
    const eCab = add(box(-0.8, 0, 0, 2.0, -0.8, 0), mat(0x2A302C)), rack = add(box(0, 0.8, 0, 2.0, -1.2, 0), mat(0x202622)), lcp = add(box(0.8, 1.1, 0, 2.0, -1.2, 0), mat(0x2C4C6A));
    for (let i = 0; i < 16; i++) room.add(box(0.12, 0.68, 0.12 + i * 0.11, 0.2 + i * 0.11, -0.02, 0.005, mat(i < 4 ? 0x2E6B52 : 0x161A18)));
    const tank = cyl(0.21, 0.85, mat(0xC9CCC5), 24); tank.position.set(1.3, 0.47, -1.5); add(tank);
    add(box(-3.6, -3.45, 0.95, 2.0, -0.65, 0.25), mat(0xBFC3BB));                                 // NSHV
    add(box(-3.45, 1.2, 2.28, 2.32, -0.78, -0.42), mat(0x6B726D));                                // tray
    // chiller outside (cabinet frame z < -1.95)
    const ch = add(box(0, 1.4, 0.1, 1.45, -3.3, -2.4), mat(0x9AA19B)); add(box(-0.05, 1.45, 0, 0.1, -3.35, -2.35), dark);
    for (const x of [0.37, 1.03]) { const f = cyl(0.28, 0.06, mat(0x161A18), 28); f.position.set(x, 1.48, -2.85); room.add(f); }
    for (const [x, c] of [[0.9, SITE_FLOW.cold], [1.0, 0xD4812A]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 10), mat(c)); p.rotation.x = Math.PI / 2; p.position.set(x, 0.35, -2.0); room.add(p); }
    room.userData = { eCab, rack, lcp, ch };
    return room;
  }

  function buildWorld() {
    const site = SITE.sites.find(s => s.id === S.site) || SITE.sites[0]; S.site = site.id;
    const root = new THREE.Group(); scene.add(root);
    const Wd = { root, site, buildings: {}, P: {}, flows: [], markers: [], labels: [], pvMeshes: [], pvMat: mat(0x9AA3B4, { map: pvTex, roughness: .85, metalness: .05, emissive: 0x24406E, emissiveIntensity: 0 }) };
    // ground, fields, roads, grid
    const g = site.ground; const gr = new THREE.Mesh(new THREE.PlaneGeometry(g.w * 2.4, g.d * 2.4), mat(PAL.ground, { transparent: false })); gr.rotation.x = -Math.PI / 2; gr.position.y = -0.02; root.add(gr);
    const grid = new THREE.GridHelper(Math.max(g.w, g.d) * 1.6, Math.round(Math.max(g.w, g.d) * 1.6 / 10), 0x18201B, 0x131915); grid.position.y = -0.01; root.add(grid); track(grid.geometry); track(grid.material);
    for (const [x, z, w, d] of site.fields) { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(PAL.field, { transparent: false })); f.rotation.x = -Math.PI / 2; f.position.set(x + w / 2, 0, z + d / 2); root.add(f);
      const pts = []; for (let xx = x + 3; xx < x + w; xx += 3) pts.push(new THREE.Vector3(xx, 0.02, z), new THREE.Vector3(xx, 0.02, z + d)); root.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(PAL.fieldLine, 1))); }
    // buildings
    for (const b of site.buildings) {
      const B = (b.type === 'flatHall' || b.type === 'box') ? flatBuilding(b) : gableBuilding(b);
      B.group.position.set(b.x, 0, b.z); root.add(B.group); Wd.buildings[b.id] = B;
      if (b.node) { Wd.nodeB = B; B.room = buildRoom(B); }
    }
    // PV allocation: panels = kWp / 0.42 kWp, distributed over roof capacities
    const allCaps = []; Object.values(Wd.buildings).forEach(B => roofCapacity(B).forEach(c => allCaps.push({ B, c })));
    const need = Math.round(site.pvKWp / 0.42), capSum = allCaps.reduce((a, x) => a + x.c.max, 0), k = Math.min(1, need / Math.max(1, capSum));
    Wd.pvRoofs = [];
    for (const { B, c } of allCaps) { const n = Math.round(c.max * k); const im = placePV(B, c, n, Wd.pvMat); if (im) { Wd.pvMeshes.push(im); B.pvMeshes = (B.pvMeshes || []).concat(im); Wd.pvRoofs.push({ B, im, n }); } }
    Wd.pvShown = Wd.pvRoofs.reduce((a, r) => a + r.n, 0);
    // extras
    const ex = mat(PAL.surf2), eM = lineMat(PAL.edge, 0.3), addX = (m, mm) => { m.material = mm || ex; root.add(m); root.add(outline(m, eM)); return m; };
    for (const e of site.extras) {
      if (e.type === 'silo') { const c = cyl(e.r, e.h, ex, 28); c.position.set(e.x, e.h / 2, e.z); addX(c); const d = new THREE.Mesh(new THREE.SphereGeometry(e.r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), ex); d.position.set(e.x, e.h, e.z); root.add(d); }
      else if (e.type === 'tank') { const c = new THREE.Mesh(new THREE.CylinderGeometry(e.r, e.r, e.h, 48, 1, true), mat(PAL.surf2, { side: THREE.DoubleSide })); c.position.set(e.x, e.h / 2, e.z); addX(c, c.material); }
      else if (e.type === 'bunker') { for (const s of [-1, 0, 1]) addX(box(e.x - e.L / 2, e.x + e.L / 2, 0, e.h, e.z + s * e.W / 2 - 0.2, e.z + s * e.W / 2 + 0.2)); }
      else if (e.type === 'bess') { const m = addX(box(e.x - 1.5, e.x + 1.5, 0, 2.5, e.z - 1.2, e.z + 1.2), mat(0x3B2F4A)); addX(box(e.x - 1.52, e.x + 1.52, 2.0, 2.15, e.z - 1.22, e.z + 1.22), mat(SITE_FLOW.bess)); Wd.P.bess = new THREE.Vector3(e.x, 1.6, e.z); }
      else if (e.type === 'trafo') { addX(box(e.x - 1.6, e.x + 1.6, 0, 2.6, e.z - 1.2, e.z + 1.2), mat(0x2C322E)); addX(box(e.x - 1.62, e.x + 1.62, 2.2, 2.35, e.z - 1.22, e.z + 1.22), mat(0xC9CEC8)); Wd.P.trafo = new THREE.Vector3(e.x, 2.0, e.z); }
      else if (e.type === 'road') { const r = new THREE.Mesh(new THREE.PlaneGeometry(e.L, e.W), mat(PAL.road, { transparent: false })); r.rotation.x = -Math.PI / 2; r.position.set(e.x, 0.01, e.z); root.add(r); }
      else if (e.type === 'parking') { const r = new THREE.Mesh(new THREE.PlaneGeometry(e.L, e.W), mat(PAL.road, { transparent: false })); r.rotation.x = -Math.PI / 2; r.position.set(e.x, 0.012, e.z); root.add(r);
        for (let i = 0; i < 12; i++) addX(box(e.x - e.L / 2 + 2 + i * 3.2, e.x - e.L / 2 + 3.9 + i * 3.2, 0, 1.4, e.z - (i % 3 ? 4.5 : 2), e.z - (i % 3 ? 0 : -2.5)), mat(0x2A302C)); }
      else if (e.type === 'gridline') { const [a, b] = [e.from, e.to]; const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24)); const pts = [];
        for (let i = 0; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, z = a[1] + (b[1] - a[1]) * i / n; const p = cyl(0.15, 9, ex, 8); p.position.set(x, 4.5, z); root.add(p); pts.push(new THREE.Vector3(x, 8.6, z)); }
        const wire = new THREE.CatmullRomCurve3(pts); root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wire.getPoints(80)), lineMat(0x8A928C, 0.7)));
        Wd.P.gridEnd = new THREE.Vector3(b[0], 8.6, b[1]); }
    }
    const treeM = mat(PAL.tree), trunkM = mat(PAL.trunk);
    for (const [x, z] of site.trees) { const h = 7 + ((x * 13 + z * 7) % 5 + 5) % 5; const c = new THREE.Mesh(new THREE.ConeGeometry(2.4, h, 10), treeM); c.position.set(x, 1.6 + h / 2, z); root.add(c); const t = cyl(0.25, 1.6, trunkM, 6); t.position.set(x, 0.8, z); root.add(t); }
    root.updateMatrixWorld(true);
    // key points (world)
    const NB = Wd.nodeB, room = NB.room, rw = v => room.localToWorld(new THREE.Vector3(...v));
    Wd.roomMatrix = room.matrixWorld.clone();
    Wd.P.hub = rw([-3.5, 1.5, -0.2]); Wd.P.node = rw([-0.4, 1.0, -0.4]); Wd.P.chiller = rw([0.7, 1.5, -2.85]); Wd.P.sky = Wd.P.chiller.clone().add(new THREE.Vector3(0, 16, 0));
    Wd.P.roomCenter = rw([-0.3, 1.0, 0.9]);
    Wd.P.farm = []; const nb = NB.b; Wd.P.farm.push({ p: new THREE.Vector3(nb.x - nb.L * 0.15, 2.5, nb.z), share: 0.8, name: NB.b.label });
    const other = site.buildings.find(b => !b.node && (b.type === 'house' || b.type === 'box')); if (other) Wd.P.farm.push({ p: new THREE.Vector3(other.x, 3, other.z), share: 0.2, name: other.label }); else Wd.P.farm[0].share = 1;
    // markers (site-level): 1 building, 2 node, A–E info
    const bTop = new THREE.Vector3(nb.x, (nb.ridge || (nb.eave + 1)) + 4, nb.z);
    const pvMain = (Wd.pvRoofs.find(r => r.B === NB) || Wd.pvRoofs[0]);
    Wd.markers = [
      { id: '1', kind: 'num', text: '1', label: 'Здание · ' + nb.label, p: bTop, levels: ['site'] },
      { id: '2', kind: 'num node', text: '2', label: 'Узел GGM', p: Wd.P.roomCenter.clone().add(new THREE.Vector3(0, (nb.eave || 4) + 2.5, 0)), levels: ['site', 'building', 'room'] },
      { id: 'A', kind: 'letter', text: 'A', label: SITE.markers.A.label, p: pvMain ? pvMain.B.group.localToWorld(pvMain.im.userData.center.clone()).add(new THREE.Vector3(0, 1.5, 0)) : bTop, levels: ['site', 'building'] },
      ...(Wd.P.bess ? [{ id: 'B', kind: 'letter', text: 'B', label: SITE.markers.B.label, p: Wd.P.bess.clone().add(new THREE.Vector3(0, 2.2, 0)), levels: ['site', 'building'] }] : []),
      { id: 'C', kind: 'letter', text: 'C', label: SITE.markers.C.label, p: Wd.P.trafo.clone().add(new THREE.Vector3(0, 2.5, 0)), levels: ['site', 'building', 'room'] },
      { id: 'D', kind: 'letter', text: 'D', label: SITE.markers.D.label, p: Wd.P.chiller.clone().add(new THREE.Vector3(0, 1.4, 0)), levels: ['building', 'room'] },
      { id: 'E', kind: 'letter', text: 'E', label: SITE.markers.E.label, p: Wd.P.farm[0].p.clone().add(new THREE.Vector3(0, 3, 0)), levels: ['site', 'building'] },
    ];
    Wd.labels = site.buildings.filter(b => !b.node).map(b => ({ text: b.label, p: new THREE.Vector3(b.x, (b.ridge || b.eave || b.h) + 3, b.z) }));
    buildFlows(Wd);
    return Wd;
  }

  /* ---------- energy flows: particles on arcs ---------- */
  function arc(a, b, lift) {
    const d = a.distanceTo(b), h = lift != null ? lift : Math.min(18, Math.max(2.5, d * 0.22));
    const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y) + h;
    return new THREE.QuadraticBezierCurve3(a.clone(), m, b.clone());
  }
  function chain(points, lift) { // poly-arc through points
    const curves = []; for (let i = 0; i < points.length - 1; i++) curves.push(arc(points[i], points[i + 1], lift));
    const path = new THREE.CurvePath(); curves.forEach(c => path.add(c)); return path;
  }
  const MAXP = 64;
  function addFlow(Wd, key, color, path, share, label) {
    const lut = path.getSpacedPoints(160); const len = path.getLength();
    const geo = new THREE.BufferGeometry(); const pos = new Float32Array(MAXP * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
    const pm = track(new THREE.PointsMaterial({ color, size: 1.1, map: dotTex, transparent: true, depthWrite: false, alphaTest: 0.05, sizeAttenuation: true }));
    const pts = new THREE.Points(geo, pm); pts.frustumCulled = false; Wd.root.add(pts);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(lut), lineMat(color, 0.22)); Wd.root.add(line);
    const phase = Array.from({ length: MAXP }, (_, i) => i / MAXP + Math.random() * 0.4 / MAXP);
    const f = { key, color, lut, len, geo, pos, pm, pts, line, share, label, phase, kw: 0, shown: 0 };
    Wd.flows.push(f); return f;
  }
  function buildFlows(Wd) {
    const P = Wd.P, hub = P.hub;
    const totalPanels = Wd.pvShown || 1;
    for (const r of Wd.pvRoofs) addFlow(Wd, 'pv', SITE_FLOW.pv, chain([r.B.group.localToWorld(r.im.userData.center.clone()).add(new THREE.Vector3(0, 0.6, 0)), hub]), r.n / totalPanels, r === Wd.pvRoofs[0] ? 'PV' : null);
    P.farm.forEach((f, i) => addFlow(Wd, 'farm', SITE_FLOW.farm, chain([hub, f.p]), f.share, i === 0 ? (Wd.site.consumer || 'Хозяйство') : null));
    if (P.bess) { addFlow(Wd, 'bessCharge', SITE_FLOW.bess, chain([hub, P.bess]), 1, 'Накопитель +'); addFlow(Wd, 'bessDischarge', SITE_FLOW.bess, chain([P.bess, hub], 6), 1, 'Накопитель −'); }
    addFlow(Wd, 'node', SITE_FLOW.node, chain([hub, P.node], 1.2), 1, 'Узел GGM');
    addFlow(Wd, 'gridImport', SITE_FLOW.grid, chain([P.gridEnd, P.trafo, hub]), 1, 'Из сети');
    addFlow(Wd, 'gridExport', SITE_FLOW.pv, chain([hub, P.trafo, P.gridEnd], 9), 1, 'В сеть');
    addFlow(Wd, 'heat', SITE_FLOW.heat, new THREE.CatmullRomCurve3([P.chiller.clone(), P.chiller.clone().add(new THREE.Vector3(1.5, 6, 0.5)), P.sky.clone().add(new THREE.Vector3(3, 0, 2))]), 1, 'Тепло');
  }

  /* ---------- energy state ---------- */
  let day = null, snap = null; const disp = {}; // displayed (smoothed) values
  function recompute() {
    const site = W.site; const n = SITE.node[S.config];
    day = simulateDay(site, { itKW: n.itKW, baseShare: SITE.node.baseShare }, S.season);
    snap = at(day, S.hour);
  }
  const FKEYS = ['pv', 'farm', 'bessCharge', 'bessDischarge', 'node', 'gridImport', 'gridExport', 'heat'];
  function flowValue(f) { return (snap ? snap[f.key] : 0) * f.share; }

  /* ---------- sun ---------- */
  function updateSun() {
    const Sx = SEASONS[S.season]; const h = S.hour; const up = h > Sx.rise && h < Sx.set;
    const t = up ? (h - Sx.rise) / (Sx.set - Sx.rise) : 0; const el = up ? Sx.sunMaxEl * Math.sin(Math.PI * t) * Math.PI / 180 : -0.2;
    const az = (90 + 180 * t) * Math.PI / 180;           // east → south → west
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); // +z = south
    sun.position.copy(dir.clone().multiplyScalar(300)); sun.target.position.set(0, 0, 0);
    const k = Math.max(0, Math.sin(el)); sun.intensity = 0.2 + 0.9 * k; hemi.intensity = 0.42 + 0.3 * k; amb.intensity = 0.12 + 0.08 * k;
    sunDisk.position.copy(dir.clone().multiplyScalar(420)); sunDisk.visible = up && el > 0.01; sunDisk.material.opacity = Math.min(1, el * 6);
    if (W) W.pvMat.emissiveIntensity = snap ? 0.55 * snap.pv / (W.site.pvKWp * 0.72) : 0;
  }

  /* ---------- fades ---------- */
  const tweens = [];
  function tween(dur, fn, tag) { // a new tween with the same tag replaces the running one (no fighting animations)
    if (tag) for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].tag === tag) { tweens[i].res(); tweens.splice(i, 1); }
    return new Promise(res => { if (reduce || dur <= 0) { fn(1); res(); return; } tweens.push({ t: 0, dur, fn, res, tag }); }); }
  function setShellOpacity(B, k) {
    [B.shellM, B.roofM, B.netM].forEach(m => { if (!m) return; const base = m === B.netM ? 0.45 : 1; m.opacity = base * k; m.depthWrite = k > 0.97; m.visible = k > 0.01; });
    B.edgeM.opacity = 0.16 + 0.34 * k;
    (B.pvMeshes || []).forEach(im => { im.visible = k > 0.25; });
  }
  let fadeState = {}; // building id → current opacity
  function fadeTargets(level) {
    const out = {}; for (const id in W.buildings) { const isNode = W.buildings[id] === W.nodeB;
      out[id] = level === 'site' ? 1 : isNode ? (level === 'building' ? 1 : 0.06) : (level === 'building' ? 0.35 : 0.12); }
    return out;
  }
  function applyFades(level, dur) {
    const from = Object.assign({}, fadeState), to = fadeTargets(level);
    return tween(dur, k => { for (const id in to) { const v = (from[id] ?? 1) + (to[id] - (from[id] ?? 1)) * k; fadeState[id] = v; setShellOpacity(W.buildings[id], v); } }, 'fade');
  }

  /* ---------- camera ---------- */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let camTok = 0;
  function flyTo(p1, t1, durOverride) {
    const myCam = ++camTok;
    const p0 = camera.position.clone(), t0 = controls.target.clone(); const d = p0.distanceTo(p1) + t0.distanceTo(t1);
    const dur = durOverride ?? Math.min(2.4, Math.max(0.9, 0.9 + 0.35 * Math.log2(Math.max(1, d / 10))));
    const lift = d > 40 ? Math.min(60, d * 0.18) : 0;
    controls.enabled = false;
    return tween(dur * 1000, k => { const e = ease(k); camera.position.lerpVectors(p0, p1, e); camera.position.y += lift * Math.sin(Math.PI * e); controls.target.lerpVectors(t0, t1, e); camera.lookAt(controls.target); }, 'cam')
      .then(() => { if (camTok !== myCam) return; camera.position.copy(p1); controls.target.copy(t1); controls.enabled = true; controls.update(); });
  }
  function aspect() { return Math.max(0.3, (host.clientWidth || 1) / (host.clientHeight || 1)); }
  function narrowK() { const a = aspect(); return a < 1.25 ? Math.min(2.0, Math.pow(1.25 / a, 0.8)) : 1; }
  function poseOf(level) {
    const b = W.nodeB.b, c = new THREE.Vector3(b.x, (b.ridge || b.eave) * 0.4, b.z), k = narrowK();
    if (level === 'site') { const [p, t] = W.site.camera.site; const tv = new THREE.Vector3(...t); return [tv.clone().add(new THREE.Vector3(...p).sub(tv).multiplyScalar(k)), tv]; }
    if (level === 'building') { const s = Math.max(b.L, b.W); const t = c.clone().lerp(W.P.roomCenter, 0.35); return [t.clone().add(new THREE.Vector3(s * 0.62, s * 0.55 + 10, s * 1.0 + 14).multiplyScalar(k)), t]; }
    const room = W.nodeB.room; const rw = v => room.localToWorld(new THREE.Vector3(...v));
    if (level === 'room') { const t = rw([-0.3, 0.7, 0.6]); return [t.clone().add(rw([2.8, 7.6, 7.2]).sub(rw([0, 0, 0])).multiplyScalar(k)), t]; }
    const [p, t] = poseFor('iso', aspect()); return [rw(p), rw(t)];
  }
  function levelLimits(level) {
    const m = { site: [40, 500], building: [15, 220], room: [4, 40], cabinet: [1, 20] }[level]; controls.minDistance = m[0]; controls.maxDistance = m[1];
    controls.autoRotate = level === 'site' && !S.touring && !reduce && !userHold;
  }
  let userHold = false, holdTimer = 0;
  function holdRotation() { userHold = true; controls.autoRotate = false; clearTimeout(holdTimer); holdTimer = setTimeout(() => { userHold = false; levelLimits(S.level); }, 12000); }
  controls.addEventListener('start', holdRotation);

  /* ---------- cabinet (level 4) ---------- */
  let cab = null;
  function ensureCab() {
    if (cab) return cab;
    cab = mountCabinet(cabHost, { theme: 'dark', config: S.config, view: 'iso', layers: { air: true, dims: false } });
    cab.onChange(() => emit('change', getState())); cab.onSelect(id => emit('select', { level: 'cabinet', id }));
    return cab;
  }

  /* ---------- level transitions ---------- */
  let token = 0;
  async function setLevel(level, opts = {}) {
    if (!LEVELS.includes(level)) throw new Error('level ' + level);
    const my = ++token; const from = S.level; S.busy = true; changed();
    if (from === 'cabinet' && level !== 'cabinet') { cabHost.classList.remove('on'); await wait(reduce ? 0 : 450); if (cab) cab.setPaused(true); sitePaused = false; }
    if (my !== token) return;
    if (level === 'cabinet') {
      if (from !== 'room' && from !== 'cabinet') { S.level = 'room'; changed(); applyFades('room', 600); const [p, t] = poseOf('room'); await flyTo(p, t, opts.fast ? 0.9 : undefined); if (my !== token) return; }
      if (from !== 'cabinet') { const [p, t] = poseOf('cabinet'); await flyTo(p, t, 1.1); if (my !== token) return;
        const c = ensureCab(); c.setPaused(false); c.setConfig(S.config); c.setView('iso', true); c.resize(); await wait(30); cabHost.classList.add('on'); await wait(reduce ? 0 : 460); sitePaused = true; }
    } else {
      applyFades(level, 600); const [p, t] = poseOf(level); await flyTo(p, t, opts.instant ? 0 : undefined);
    }
    if (my !== token) return;
    S.level = level; S.busy = false; levelLimits(level); changed();
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- markers & labels (HTML) ---------- */
  let mkEls = [], lbEls = [], flEls = [];
  function buildUi() {
    ui.innerHTML = ''; mkEls = []; lbEls = []; flEls = [];
    for (const m of W.markers) { const b = document.createElement('button'); b.type = 'button'; b.className = 'ggm-sm ' + m.kind; b.innerHTML = `<b>${m.text}</b><span>${m.label}</span>`;
      b.setAttribute('aria-label', m.text + ' · ' + m.label); b.addEventListener('click', e => { e.stopPropagation(); select(m.id); }); b.addEventListener('pointerenter', holdRotation); b.addEventListener('focus', holdRotation); ui.appendChild(b); mkEls.push({ m, el: b }); }
    for (const l of W.labels) { const d = document.createElement('div'); d.className = 'ggm-bl'; d.textContent = l.text; ui.appendChild(d); lbEls.push({ l, el: d }); }
    for (const f of W.flows) if (f.label) { const d = document.createElement('div'); d.className = 'ggm-sl'; d.style.color = '#' + f.color.toString(16).padStart(6, '0'); ui.appendChild(d); flEls.push({ f, el: d }); }
  }
  const v3 = new THREE.Vector3();
  function project(p) { v3.copy(p).project(camera); return { x: (v3.x * .5 + .5) * host.clientWidth, y: (-v3.y * .5 + .5) * host.clientHeight, ok: v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1 }; }
  function updateUi() {
    const lv = S.level, inCab = lv === 'cabinet';
    for (const { m, el } of mkEls) { const q = project(m.p); const show = !inCab && q.ok && m.levels.includes(lv); el.style.display = show ? '' : 'none'; if (show) { el.style.transform = `translate(${Math.round(q.x - 13)}px,${Math.round(q.y - 13)}px)`; el.classList.toggle('sel', S.selected === m.id); } }
    for (const { l, el } of lbEls) { const q = project(l.p); const show = lv === 'site' && q.ok; el.hidden = !show; if (show) el.style.transform = `translate(${Math.round(q.x)}px,${Math.round(q.y)}px) translate(-50%,-50%)`; }
    for (const { f, el } of flEls) {
      const kw = disp[f.key] ?? 0; const show = !inCab && lv !== 'room' && kw > 0.3; el.hidden = !show; if (!show) continue;
      const q = project(f.lut[Math.floor((f.lut.length - 1) * (LABEL_T[f.key] ?? 0.5))]); if (!q.ok) { el.hidden = true; continue; }
      el.textContent = `${f.label} ${kw < 10 ? kw.toFixed(1).replace('.', ',') : Math.round(kw)} kW`; el.style.transform = `translate(${Math.round(q.x + 8)}px,${Math.round(q.y - 10)}px)`;
    }
  }

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let down = null;
  canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => { if (!down || S.busy) return; const dx = e.clientX - down[0], dy = e.clientY - down[1]; down = null; if (dx * dx + dy * dy > 25) return;
    if (S.level !== 'site') return; const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(W.nodeB.wallMeshes.concat(W.nodeB.roofMeshes), false)[0]; if (hit) select('1'); });

  /* ---------- loop ---------- */
  let raf = 0, visible = true, sitePaused = false, disposed = false; const clock = new THREE.Clock();
  function frame() {
    raf = requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), 0.05);
    for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt * 1000; const k = Math.min(1, tw.t / tw.dur); tw.fn(k); if (k >= 1) { tweens.splice(i, 1); tw.res(); } }
    if (S.playing && !S.touring && day) { S.hour = (S.hour + dt * 0.5) % 24; snap = at(day, S.hour); updateSun(); if (Math.floor(S.hour * 4) !== lastQ) { lastQ = Math.floor(S.hour * 4); changed(); } }
    if (!visible || sitePaused || disposed || !W) return;
    // smooth displayed values
    for (const k of FKEYS) { const tgt = snap ? snap[k] || 0 : 0; disp[k] = disp[k] == null ? tgt : disp[k] + (tgt - disp[k]) * Math.min(1, dt * 4); }
    const maxKW = Math.max(30, W.site.pvKWp * 0.72); const sz = { site: 1.6, building: 1.0, room: 0.16, cabinet: 0.16 }[S.level]; const roomOnly = S.level !== 'site' && S.level !== 'building';
    for (const f of W.flows) {
      const kw = (roomOnly && f.key !== 'node' && f.key !== 'heat') ? 0 : (disp[f.key] || 0) * f.share; const n = kw <= 0.05 ? 0 : Math.max(3, Math.round(MAXP * Math.log10(1 + kw) / Math.log10(1 + maxKW)));
      f.geo.setDrawRange(0, n); f.line.material.opacity = n ? 0.26 : 0.04; f.pm.size = sz;
      if (n) { const speed = (reduce ? 0 : 1) * (6 + 4 * Math.log10(1 + kw)) / f.len; const m = f.lut.length - 1;
        for (let i = 0; i < n; i++) { let u = (f.phase[i] + clock.elapsedTime * speed) % 1; const x = u * m, j = Math.floor(x), fr = x - j, a = f.lut[j], b = f.lut[Math.min(m, j + 1)];
          f.pos[i * 3] = a.x + (b.x - a.x) * fr; f.pos[i * 3 + 1] = a.y + (b.y - a.y) * fr; f.pos[i * 3 + 2] = a.z + (b.z - a.z) * fr; }
        f.geo.attributes.position.needsUpdate = true; }
    }
    if (controls.enabled) controls.update();
    renderer.render(scene, camera); updateUi();
  }
  let lastQ = -1;
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting) && document.visibilityState !== 'hidden'; }) : null; if (io) io.observe(host);
  const onVis = () => { visible = document.visibilityState !== 'hidden'; }; document.addEventListener('visibilitychange', onVis);
  function resize() { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (cab) cab.resize(); }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; if (ro) ro.observe(host);

  /* ---------- API ---------- */
  function getState() {
    const n = SITE.node[S.config]; const s = snap || {};
    return { site: S.site, level: S.level, config: S.config, hour: S.hour, season: S.season, playing: S.playing, touring: S.touring, tourStep: S.tourStep, selected: S.selected, busy: S.busy,
      flows: { pv: s.pv || 0, farm: s.farm || 0, bessCharge: s.bessCharge || 0, bessDischarge: s.bessDischarge || 0, node: s.node || 0, nodeIT: s.nodeIT || 0, gridImport: s.gridImport || 0, gridExport: s.gridExport || 0, heat: s.heat || 0, soc: s.soc,
        pvShareNodeDay: day ? day.totals.pvShareNode : 0, nodeDayKWh: day ? day.totals.node : 0, reserveNeed: n.reserveKW, reserveAvail: W ? W.site.reserveKW : null },
      siteData: W ? W.site : null, cabinet: cab && S.level === 'cabinet' ? cab.getState() : null };
  }
  function changed() { canvas.setAttribute('aria-label', `3D-сцена GGM: ${W ? W.site.name : ''}, уровень ${S.level}, узел ${S.config}, ${Math.floor(S.hour)}:00`); emit('change', getState()); }

  async function setSite(id, opts = {}) {
    if (!SITE.sites.some(s => s.id === id)) throw new Error('site ' + id);
    const my = ++token; S.busy = true;
    fadeEl.style.opacity = reduce ? 0 : 1; await wait(reduce ? 0 : 260); if (my !== token && !opts.force) return;
    if (S.level === 'cabinet') { cabHost.classList.remove('on'); if (cab) cab.setPaused(true); sitePaused = false; }
    if (W) { scene.remove(W.root); const gs = new Set(), ms = new Set(); W.root.traverse(o => { if (o.geometry && o.geometry !== panelGeo) gs.add(o.geometry); if (o.material) [].concat(o.material).forEach(m => ms.add(m)); });
      gs.forEach(g => g.dispose()); ms.forEach(m => m.dispose()); }
    S.site = id; W = buildWorld(); fadeState = {}; for (const bid in W.buildings) setShellOpacity(W.buildings[bid], 1);
    recompute(); updateSun(); buildUi(); S.level = 'site'; S.selected = null;
    const [p, t] = poseOf('site'); camera.position.copy(p); controls.target.copy(t); controls.update(); levelLimits('site');
    for (const k of FKEYS) disp[k] = snap[k];
    fadeEl.style.opacity = 0; S.busy = false; changed();
  }
  function setConfig(c) { if (!SITE.node[c]) throw new Error('config ' + c); S.config = c; recompute(); if (cab) cab.setConfig(c); changed(); }
  function setTime(h, season) { if (season && SEASONS[season]) S.season = season; S.hour = Math.max(0, Math.min(23.99, h)); recompute(); updateSun(); changed(); }
  function play(on) { S.playing = !!on; changed(); }
  function select(id) {
    S.selected = id; emit('select', { level: S.level, id }); changed();
    if (id === '1') return setLevel('building');
    if (id === '2') return setLevel('cabinet');
  }
  // tour
  let tourTimer = 0;
  async function runStep(i) {
    clearTimeout(tourTimer); const st = SITE.tour[i]; if (!st) return tour('stop');
    S.tourStep = i; S.playing = false; setTime(st.hour, st.season);
    if (st.level !== S.level) await setLevel(st.level, { fast: true }); else changed();
    if (!S.touring) return; tourTimer = setTimeout(() => { if (S.touring) runStep(i + 1); }, reduce ? 9000 : 7000);
  }
  function tour(action) {
    if (action === 'start') { S.touring = true; controls.autoRotate = false; runStep(0); }
    else if (action === 'next') { if (S.touring) runStep(S.tourStep + 1); }
    else if (action === 'prev') { if (S.touring) runStep(Math.max(0, S.tourStep - 1)); }
    else { S.touring = false; S.tourStep = -1; clearTimeout(tourTimer); levelLimits(S.level); changed(); }
  }
  function dispose() {
    if (disposed) return; disposed = true; cancelAnimationFrame(raf); clearTimeout(tourTimer); if (io) io.disconnect(); if (ro) ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
    controls.dispose(); if (cab) cab.dispose();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); });
    panelGeo.dispose(); pvTex.dispose(); dotTex.dispose(); renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss();
    host.innerHTML = ''; host.classList.remove('ggm-site'); L.change.clear(); L.select.clear();
  }

  /* ---------- init ---------- */
  resize(); setSite(S.site, { force: true }); raf = requestAnimationFrame(frame);

  return {
    setSite, setLevel, setConfig, setTime, play, tour, select, getState, resize, dispose,
    cabinet: () => cab,
    screenshot: () => { if (S.level === 'cabinet' && cab) return cab.screenshot(); renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
    onChange(cb) { L.change.add(cb); return () => L.change.delete(cb); },
    onSelect(cb) { L.select.add(cb); return () => L.select.delete(cb); },
    data: SITE,
  };
}
export default mountSite;
