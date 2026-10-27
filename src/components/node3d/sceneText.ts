/**
 * Translates the few strings that siteScene.js / cabinetScene.js write themselves (flow labels, the
 * "Здание · " marker prefix, dimension sprites, canvas aria-labels) without touching the engines:
 *  - HTML overlays inside the stage host are rewritten by a MutationObserver;
 *  - canvas sprite texts are mapped in CanvasRenderingContext2D.fillText/measureText while a scene is mounted.
 * Exact-match / prefix replacement only, driven by `scene` in i18n/de.ts / en.ts. Russian needs nothing.
 */
type Map = Record<string, string>;

let canvasMap: Map | null = null;
let canvasUsers = 0;
let restore: (() => void) | null = null;

function patchCanvas(): void {
  const proto = CanvasRenderingContext2D.prototype;
  const fill = proto.fillText;
  const measure = proto.measureText;
  const tr = (s: string) => (canvasMap && typeof s === 'string' ? (canvasMap[s] ?? s) : s);
  proto.fillText = function (
    this: CanvasRenderingContext2D,
    text: string,
    ...rest: [number, number, number?]
  ) {
    return fill.call(this, tr(text), ...rest);
  };
  proto.measureText = function (this: CanvasRenderingContext2D, text: string) {
    return measure.call(this, tr(text));
  };
  restore = () => {
    proto.fillText = fill;
    proto.measureText = measure;
  };
}

export interface SceneTextOptions {
  /** Russian literal → translation */
  map: Map;
  /** decimal mark of the target language (flow labels are formatted with a comma by the engine) */
  decimal: ',' | '.';
  /** rewrites the canvas aria-labels written by the engines; return null to keep the original */
  aria: (raw: string) => string | null;
}

export function installSceneText(host: HTMLElement, o: SceneTextOptions | null): () => void {
  if (!o) return () => {};
  canvasMap = o.map;
  if (canvasUsers++ === 0) patchCanvas();

  const keys = Object.keys(o.map)
    .filter((k) => /[А-Яа-яЁё]/.test(k))
    .sort((a, b) => b.length - a.length);
  const text = (s: string): string => {
    let out = s;
    for (const k of keys) if (out.includes(k)) out = out.split(k).join(o.map[k] ?? k);
    if (o.decimal === '.') out = out.replace(/(\d),(\d) kW\b/g, '$1.$2 kW');
    return out;
  };
  const fixNode = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const v = n.nodeValue ?? '';
      const t = text(v);
      if (t !== v) n.nodeValue = t;
      return;
    }
    if (!(n instanceof Element)) return;
    for (const attr of ['aria-label', 'title']) {
      const v = n.getAttribute(attr);
      if (v == null) continue;
      const t = (n instanceof HTMLCanvasElement && attr === 'aria-label' ? o.aria(v) : null) ?? text(v);
      if (t !== v) n.setAttribute(attr, t);
    }
    n.childNodes.forEach(fixNode);
  };
  fixNode(host);
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList') r.addedNodes.forEach(fixNode);
      else if (r.target) fixNode(r.target.nodeType === Node.TEXT_NODE ? r.target : (r.target as Element));
    }
  });
  mo.observe(host, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title'],
  });

  return () => {
    mo.disconnect();
    if (--canvasUsers === 0) {
      restore?.();
      restore = null;
      canvasMap = null;
    }
  };
}
