/** Dimension lines (layer "Maße") and static room labels. Texts come localized from the React viewer. */
import * as THREE from 'three';
export function buildDims(k) {
  const { grp } = k;
  const gDim = grp('dims');
  const gStatic = grp('static');

  function textSprite(txt, color, size) { const c = document.createElement('canvas'); const ctx = c.getContext('2d'); const fs = 56; const font = `500 ${fs}px "JetBrains Mono", Menlo, monospace`; ctx.font = font; const w = Math.ceil(ctx.measureText(txt).width) + 20; c.width = w; c.height = Math.ceil(fs * 1.35); ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(txt, 10, c.height / 2); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(size * c.width / c.height, size, 1); s.renderOrder = 999; return s; }
  function dimLine(a, b, label, color, off) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); gDim.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color }))); const s = textSprite(label, color, 0.11); s.position.set((a[0] + b[0]) / 2 + (off ? off[0] : 0), (a[1] + b[1]) / 2 + (off ? off[1] : 0), (a[2] + b[2]) / 2 + (off ? off[2] : 0)); gDim.add(s); }
  function staticLabel(txt, p, color, size) { const s = textSprite(txt, color, size || 0.1); s.position.set(...p); gDim.add(s); return s; }

  /** (re)build all text sprites — `L` = localized labels, `ink`/`mut` = theme colours */
  function rebuild(L, ink, mut) {
    gDim.clear(); gStatic.clear();
    dimLine([-0.8, 0.01, 0.4], [1.1, 0.01, 0.4], L.total, ink, [0, 0.08, 0]);
    dimLine([-0.8, 0.01, 0.25], [0, 0.01, 0.25], L.s800, mut, [0, 0.06, 0]);
    dimLine([0, 0.01, 0.25], [0.8, 0.01, 0.25], L.s800, mut, [0, 0.06, 0]);
    dimLine([0.8, 0.01, 0.25], [1.1, 0.01, 0.25], L.s300, mut, [0, 0.06, 0]);
    dimLine([-0.95, 0, 0.02], [-0.95, 2.0, 0.02], L.height, ink, [-0.25, 0, 0]);
    dimLine([1.3, 0.01, 0], [1.3, 0.01, -1.2], L.depth, ink, [0.32, 0.05, 0]);
    const fr = new THREE.BufferGeometry().setFromPoints([[-0.8, 0.006, 0], [-0.8, 0.006, 1.2], [1.1, 0.006, 1.2], [1.1, 0.006, 0]].map(p => new THREE.Vector3(...p)));
    const l = new THREE.Line(fr, new THREE.LineDashedMaterial({ color: mut, dashSize: .06, gapSize: .04 })); l.computeLineDistances(); gDim.add(l);
    staticLabel(L.service, [0.15, 0.05, 0.85], mut, 0.1);
    const sw = (t, p) => { const s = textSprite(t, mut, 0.09); s.position.set(...p); gStatic.add(s); };
    sw(L.wall, [-1.9, 2.62, -1.85]); sw(L.outside, [0.7, 0.15, -3.75]); sw(L.room, [-2.0, 0.15, 1.6]);
  }
  return { gDim, gStatic, rebuild };
}
