// Shared UI helpers for the demo pages (cabinet viewer and site viewer). Not part of the 3D modules.
export const $ = s => document.querySelector(s);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const TCLS = { 'ПОДТВ': 'ok', 'ОЦ': 'est', 'МОД': 'est', 'ОТКР': 'open', 'ДОП': 'asm', 'НОРМ': 'norm', 'ЦЕЛЬ': 'spec' };
const TAG_RE = /\[(ПОДТВ|ОЦ|МОД|ОТКР|ДОП|НОРМ|ЦЕЛЬ)(?:,?\s*([^\]]*))?\]/g;
/** Escape text and render status tags like [ОЦ] or [ОЦ — note] as labels. */
export const fmt = t => esc(t).replace(TAG_RE, (m, k, n) => `<span class="tag t-${TCLS[k]}">${k}</span>` + (n ? ` <span class="tnote">${n.replace(/^—\s*/, '')}</span>` : ''));
export const tag = k => `<span class="tag t-${TCLS[k]}">${k}</span>`;
export const num = (x, d = 1) => (Math.abs(x) < 10 && d ? x.toFixed(d) : Math.round(x).toString()).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Card of one cabinet component (number, group, name, function, spec rows, links). */
export function componentCard(c, closeId) {
  return `<div class="card"><button class="back" ${closeId ? `id="${closeId}"` : ''}>закрыть</button><div class="grp">${esc(c.g)}</div><h2><span class="num">${c.n}</span>${esc(c.name)}</h2><p>${fmt(c.f)}</p>
  <table class="kv"><tbody>${c.s.map(r => `<tr><td>${esc(r[0])}</td><td>${fmt(r[1])}</td></tr>`).join('')}</tbody></table>
  <h3>Связи</h3><ul>${c.l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}
