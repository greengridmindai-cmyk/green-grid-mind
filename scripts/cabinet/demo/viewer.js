// Demo page for the cabinet module. Everything shown here comes from src/cabinetData.js.
// The website does not need this file; it shows how a host page uses the CabinetHandle API.
import { mountCabinet } from '../../../src/components/node3d/cabinetScene.js';
import { CABINET as D } from '../../../src/components/node3d/cabinetData.js';

import { $, esc, fmt, tag, componentCard } from './ui-common.js';
const BY = Object.fromEntries(D.components.map(c => [c.id, c]));
const T = D.text;

/* ---------- static texts ---------- */
document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T[el.dataset.t]; });
$('#stamp').innerHTML = T.stamp.map(([k, v]) => `${esc(k)} <b>${esc(v)}</b>`).join('<br>');
const LEG = { cold: '--cold', hot: '--hot', supply: '--supply', ret: '--return', power: '--power', data: '--signal', fire: '--fire' };
$('#legend').innerHTML = T.legend.map(([k, t]) => `<span><i style="background:var(${LEG[k]})"></i>${esc(t)}</span>`).join('');
$('#principles').innerHTML = T.principles.map(([h, p]) => `<div class="fact"><b>${esc(h)}</b><p>${fmt(p)}</p></div>`).join('');
$('#fireLayers').innerHTML = T.fireLayers.map(([h, p]) => `<div class="fact"><b>${esc(h)}</b><p>${fmt(p)}</p></div>`).join('');
$('#room').innerHTML = T.room.map(x => `<li>${fmt(x)}</li>`).join('');
$('#tblU').innerHTML = '<thead><tr><th class="n">U</th><th>Блок</th><th>M</th><th>L</th><th>P0</th></tr></thead><tbody>' + D.rackLayout.map(r => `<tr><td class="n">${r[0]}</td><td>${esc(r[1])}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('') + '</tbody>';
{ const keys = ['M', 'L', 'P0']; const labels = [...new Set(keys.flatMap(k => D.configs[k].rows.map(r => r[0])))];
  $('#tblConf').innerHTML = `<thead><tr><th>Параметр</th>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>` + labels.map(l => `<tr><td>${esc(l)}</td>${keys.map(k => { const r = D.configs[k].rows.find(x => x[0] === l); return `<td class="n">${r ? esc(r[1]) : '—'}</td>`; }).join('')}</tr>`).join('') + '</tbody>'; }
$('#tblMx').innerHTML = `<thead><tr><th>Событие</th>${D.fireMatrix.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>` + D.fireMatrix.rows.map(r => `<tr>${r.map((c, i) => `<td class="${i && String(c).startsWith('●') ? 'on' : ''}">${fmt(c)}</td>`).join('')}</tr>`).join('') + '</tbody>';
$('#revTitle').textContent = `Изменения в ред. ${D.revision.rev} по итогам проверки`;
$('#tblRev').innerHTML = '<thead><tr><th>Важность</th><th>Что</th><th>Найдено</th><th>Исправлено</th></tr></thead><tbody>' + D.review.map(r => `<tr>${r.map(x => `<td>${fmt(x)}</td>`).join('')}</tr>`).join('') + '</tbody>';
$('#tblConn').innerHTML = '<thead><tr><th>Тип</th><th>От → к</th><th>Среда / сечение</th><th>Параметр / протокол</th><th>Статус</th></tr></thead><tbody>' + D.connections.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${fmt(r[3])}</td><td>${fmt('[' + r[4] + ']')}</td></tr>`).join('') + '</tbody>';
$('#openList').innerHTML = D.openItems.map(o => `<li>${tag('ОТКР')} <b>${esc(o[0])}.</b> ${fmt(o[1])}. <span class="tnote">${esc(o[2])}</span></li>`).join('');
$('#foot').innerHTML = `Ред. ${esc(D.revision.rev)} · ${esc(D.revision.date)} · ${esc(D.revision.basis)}.<br>Статусы: ${tag('ПОДТВ')} паспорт производителя · ${tag('ОЦ')} инженерная оценка · ${tag('ДОП')} проектное допущение · ${tag('НОРМ')} норма · ${tag('ОТКР')} не определено. Цены и мощности — Richtwerte до получения ≥ 2 КП. Источники: ` + T.sources.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ') + '.';

/* ---------- theme ---------- */
const root = document.documentElement; let themeMode = 'auto';
const mq = matchMedia('(prefers-color-scheme: dark)');
const effTheme = () => themeMode === 'auto' ? (mq.matches ? 'dark' : 'light') : themeMode;

/* ---------- 3D ---------- */
const cab = mountCabinet($('#viewer'), { config: 'L', view: 'iso', theme: effTheme() });
window.GGM = cab; // used by tools/render-views.mjs and for debugging in the console

function applyTheme() { if (themeMode === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', themeMode); cab.setTheme(effTheme()); $('#themeBtn').textContent = 'тема: ' + ({ auto: 'авто', light: 'светлая', dark: 'тёмная' }[themeMode]); }
$('#themeBtn').addEventListener('click', () => { themeMode = { auto: 'light', light: 'dark', dark: 'auto' }[themeMode]; applyTheme(); });
mq.addEventListener('change', () => { if (themeMode === 'auto') applyTheme(); });

/* ---------- component list + card ---------- */
const clist = $('#clist'); let lastG = '';
D.components.forEach(c => { const li = document.createElement('li'); li.dataset.id = c.id;
  li.innerHTML = (c.g !== lastG ? `<div class="grp" style="margin-top:10px">${esc(c.g)}</div>` : '') + `<button data-id="${c.id}"><span class="cn">${c.n}</span><span>${esc(c.name)}</span></button>`; lastG = c.g; clist.appendChild(li); });
clist.addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (b) cab.select(b.dataset.id, { fly: true }); });
const ONLY = { brick2: c => c !== 'P0', cpu: c => c !== 'P0', loadbank: c => c === 'P0' };

function renderConf(cfg) { const c = D.configs[cfg]; $('#confCard').innerHTML = `<div class="card"><div class="grp">Активная конфигурация</div><h2>${esc(c.name)}</h2><table class="kv" style="margin-top:8px"><tbody>${c.rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table><p style="color:var(--muted);font-size:13.5px">${esc(c.note)} ${tag('ОЦ')}</p></div>`; }
function renderSel(id) { const el = $('#selCard'); if (!id) { el.innerHTML = ''; return; }
  el.innerHTML = componentCard(BY[id], 'closeSel').replace('<div class="card">', '<div class="card" style="border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:6px">');
  $('#closeSel').addEventListener('click', () => cab.select(null)); $('#pscroll').scrollTop = 0; }

function press(sel, v) { document.querySelectorAll(sel + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false')); }
let lastCfg = null;
function sync(s) {
  press('#segConf', s.config); press('#segView', s.view); press('#segShell', s.shell);
  document.querySelectorAll('.chipbtn').forEach(b => b.setAttribute('aria-pressed', s.layers[b.dataset.l] ? 'true' : 'false'));
  if (s.config !== lastCfg) { renderConf(s.config); lastCfg = s.config; }
  clist.querySelectorAll('li').forEach(li => { const f = ONLY[li.dataset.id]; li.hidden = !!(f && !f(s.config)); li.querySelector('button').setAttribute('aria-current', s.selected === li.dataset.id ? 'true' : 'false'); });
}
cab.onSelect(renderSel);
cab.onChange(sync);
sync(cab.getState());

$('#segConf').addEventListener('click', e => { const b = e.target.closest('button'); if (b) cab.setConfig(b.dataset.v); });
$('#segView').addEventListener('click', e => { const b = e.target.closest('button'); if (b) cab.setView(b.dataset.v); });
$('#segShell').addEventListener('click', e => { const b = e.target.closest('button'); if (b) cab.setShell(b.dataset.v); });
document.querySelectorAll('.chipbtn').forEach(b => b.addEventListener('click', () => cab.setLayer(b.dataset.l, !cab.getState().layers[b.dataset.l])));
