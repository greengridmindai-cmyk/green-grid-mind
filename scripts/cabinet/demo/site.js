// Demo page for the site scene (levels 1–4). Everything shown comes from siteData.js, cabinetData.js and the scene state.
import { mountSite } from '../../../src/components/node3d/siteScene.js';
import { SITE } from '../../../src/components/node3d/siteData.js';
import { CABINET } from '../../../src/components/node3d/cabinetData.js';
import { $, esc, fmt, tag, num, componentCard } from './ui-common.js';

const LV = ['site', 'building', 'room', 'cabinet'];
const LV_NAME = { site: 'Объект', building: 'Здание', room: 'Помещение узла', cabinet: 'Шкаф' };
const CBY = Object.fromEntries(CABINET.components.map(c => [c.id, c]));

/* ---------- static ---------- */
$('#stamp').innerHTML = `Сцена <b>${SITE.revision.rev}</b> · ${esc(SITE.revision.date)}<br>Шкаф <b>ред. ${esc(CABINET.revision.rev)}</b><br>Энергия: <b>схема, ясный день</b> ${tag('МОД')}`;
const LEGC = { pv: '--sun', farm: '--farm', grid: '--grid', bess: '--bess', node: '--node', heat: '--heat' };
$('#legend').innerHTML = [['pv', 'солнечная энергия'], ['farm', 'хозяйство'], ...SITE.legend.filter(l => l[0] !== 'pv')].map(([k, t]) => `<span><i style="background:var(${LEGC[k]})"></i>${esc(t)}</span>`).join('');
$('#segSite').innerHTML = SITE.sites.map(s => `<button data-v="${s.id}">${esc(s.short)}</button>`).join('');
$('#hostTitle').textContent = SITE.hostCard.title;
$('#hostGets').innerHTML = SITE.hostCard.gets.map(x => `<li>${fmt(x)}</li>`).join('');
$('#hostNeeds').innerHTML = SITE.hostCard.needs.map(x => `<li>${fmt(x)}</li>`).join('');
$('#foot').innerHTML = `Статусы: ${tag('ПОДТВ')} паспорт или опубликованные данные · ${tag('ОЦ')} оценка · ${tag('МОД')} модель · ${tag('ДОП')} допущение · ${tag('ЦЕЛЬ')} требование, ещё не испытано · ${tag('ОТКР')} не определено. `
  + 'Энергопотоки — схема ясного дня по модели проекта, не измерения; за год доля солнечной энергии у узла заметно ниже. Объекты анонимизированы. Сумм выплат и цен на сайте нет.';

/* ---------- mount ---------- */
const site = mountSite($('#viewer'), { site: SITE.sites[0].id, config: 'L', hour: 13, season: 'summer' });
window.GGMSITE = site;

/* ---------- controls ---------- */
const press = (sel, v) => document.querySelectorAll(sel + ' button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
$('#segSite').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { site.tour('stop'); site.setSite(b.dataset.v); } });
$('#segCfg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) site.setConfig(b.dataset.v); });
$('#segSeason').addEventListener('click', e => { const b = e.target.closest('button'); if (b) site.setTime(site.getState().hour, b.dataset.v); });
$('#hour').addEventListener('input', e => { site.play(false); site.setTime(+e.target.value); });
$('#btnPlay').addEventListener('click', () => site.play(!site.getState().playing));
$('#btnTour').addEventListener('click', () => site.tour(site.getState().touring ? 'stop' : 'start'));
$('#tPrev').addEventListener('click', () => site.tour('prev')); $('#tNext').addEventListener('click', () => site.tour('next')); $('#tStop').addEventListener('click', () => site.tour('stop'));
$('#btnHost').addEventListener('click', () => $('#hostDlg').showModal());
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || $('#hostDlg').open) return; const s = site.getState();
  if (s.touring) { site.tour('stop'); return; }
  const i = LV.indexOf(s.level); if (i > 0 && !s.busy) site.setLevel(LV[i - 1]);
});
$('#crumbs').addEventListener('click', e => { const b = e.target.closest('button[data-l]'); if (b && !site.getState().busy) { site.tour('stop'); site.setLevel(b.dataset.l); } });

/* ---------- render ---------- */
let last = {};
const hhmm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
function energyBar(s) {
  const f = s.flows; const bess = f.bessCharge > 0.05 ? `+${num(f.bessCharge)} kW` : f.bessDischarge > 0.05 ? `−${num(f.bessDischarge)} kW` : '0 kW';
  const grid = f.gridExport > 0.05 ? `→ ${num(f.gridExport)} kW` : `← ${num(f.gridImport)} kW`;
  const cells = [
    ['pv', 'PV', `${num(f.pv)} kW`, `${s.siteData.pvKWp} kWp`],
    ['farm', s.siteData.consumer || 'Хозяйство', `${num(f.farm)} kW`, 'приоритет 1'],
    ['bess', 'Накопитель', s.siteData.bess ? bess : '—', s.siteData.bess ? `заряд ${Math.round((f.soc || 0) * 100)} %` : 'нет'],
    ['node', 'Узел GGM', `${num(f.node)} kW`, `IT ${num(f.nodeIT)} kW · ${s.config}`],
    ['grid', 'Сеть', grid, f.gridExport > 0.05 ? 'отдача' : 'потребление']];
  $('#energy').innerHTML = cells.map(([k, n, v, sub]) => `<div><div class="k"><i style="background:var(${LEGC[k]})"></i>${n}</div><div class="v">${v}</div><div class="s">${esc(sub)}</div></div>`).join('');
}
function crumbs(s) {
  const i = LV.indexOf(s.level); const nb = s.siteData.buildings.find(b => b.node);
  const names = [s.siteData.short, nb.label, 'Помещение', 'Шкаф'];
  $('#crumbs').innerHTML = LV.map((l, k) => `${k ? '<i>›</i>' : ''}<button data-l="${l}" class="${k < i ? 'done' : ''}" ${k === i ? 'aria-current="step"' : ''}>${esc(names[k])}</button>`).join('');
}
function gauge(s) {
  const need = s.flows.reserveNeed, avail = s.flows.reserveAvail, max = Math.max(need, avail || 0) * 1.25; const ok = avail == null || need <= avail;
  return `<div class="gauge"><div class="bar"><div class="fill ${ok ? '' : 'bad'}" style="width:${need / max * 100}%"></div>${avail != null ? `<div class="avail" style="left:${avail / max * 100}%"></div>` : ''}</div>
    <div class="cap"><span>нужно ≥ ${need} kW (${s.config})</span><span>есть ${avail != null ? avail + ' kW' : '?'} ${tag('ДОП')}</span></div></div>
    <p class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✓ резерва ввода достаточно' : '✕ резерва не хватает — нужен M, ограничение мощности или усиление ввода'}</p>`;
}
function infoBox(s) {
  const id = s.selected; if (!id || !SITE.markers[id]) return '';
  const m = SITE.markers[id]; return `<div class="info"><b>${id} · ${esc(m.label)}</b><p>${fmt(m.text)}</p></div>`;
}
function panel(s) {
  const d = s.siteData, lv = SITE.levels[s.level]; let h = infoBox(s);
  h += `<div class="grp">${esc(LV_NAME[s.level])}</div>`;
  if (s.level === 'site') {
    h += `<h2>${esc(d.name)}</h2><p>${fmt(lv.lead)}</p><table class="kv"><tbody>${d.facts.map(r => `<tr><td>${esc(r[0])}</td><td>${fmt(r[1])}</td></tr>`).join('')}</tbody></table>
      <h3>Дальше</h3><p>Нажмите <b>1</b> — здание и выбор класса узла, или <b>2</b> — сразу в шкаф.</p>`;
  } else if (s.level === 'building') {
    const nb = d.buildings.find(b => b.node);
    h += `<h2>${esc(nb.label)} с узлом GGM</h2><p>${fmt(lv.lead)}</p>
      <div class="seg big" id="pCfg"><button data-v="M" aria-pressed="${s.config === 'M'}">M · 10 kW IT</button><button data-v="L" aria-pressed="${s.config === 'L'}">L · 15 kW IT</button></div>
      <h3>Резерв ввода</h3>${gauge(s)}
      <h3>M и L</h3><table class="cmp"><thead><tr><th></th><th>M</th><th>L</th></tr></thead><tbody>${cmpRows(s.config)}</tbody></table>
      <h3>Сегодня, ${esc(seasonName(s.season))}, ясный день ${tag('МОД')}</h3>
      <table class="kv"><tbody><tr><td>Энергия узла за сутки</td><td>${num(s.flows.nodeDayKWh, 0)} kWh</td></tr><tr><td>Из них солнечной энергии хозяйства</td><td>${Math.round(s.flows.pvShareNodeDay * 100)} %</td></tr>
      <tr><td>Рекомендовано для объекта</td><td>${d.recommend}</td></tr></tbody></table>`;
  } else if (s.level === 'room') {
    h += `<h2>Помещение узла</h2><p>${fmt(lv.lead)}</p><table class="kv"><tbody>${SITE.roomFacts.map(r => `<tr><td>${esc(r[0])}</td><td>${fmt(r[1])}</td></tr>`).join('')}</tbody></table>
      <h3>Дальше</h3><p>Нажмите <b>2</b>, чтобы открыть шкаф.</p>`;
  } else {
    const cs = s.cabinet || {}; const sel = cs.selected && CBY[cs.selected];
    h += `<h2>Шкаф GGM-Node · ${s.config}</h2><p>${fmt(lv.lead)}</p>
      <h3>Вид</h3><div class="seg small" id="cView">${[['iso', 'изометрия'], ['front', 'спереди'], ['rack', 'шкаф'], ['hydro', 'гидромодуль'], ['fire', 'пожарная'], ['system', 'система']].map(([v, n]) => `<button data-v="${v}" aria-pressed="${cs.view === v}">${n}</button>`).join('')}</div>
      <h3>Слои</h3><div class="chips" id="cLay">${[['air', 'воздух'], ['water', 'вода'], ['power', 'силовые'], ['signals', 'сигналы'], ['fire', 'пожарная'], ['explode', 'разнести'], ['scale', 'масштаб']].map(([k, n]) => `<button class="chip" data-l="${k}" aria-pressed="${!!(cs.layers && cs.layers[k])}">${n}</button>`).join('')}</div>
      ${sel ? `<div style="margin-top:16px">${componentCard(sel, 'cClose')}</div>` : ''}
      <h3>Компоненты</h3><ul class="clist" id="cList">${CABINET.components.filter(c => !(c.id === 'loadbank')).map(c => `<li><button data-id="${c.id}" aria-current="${cs.selected === c.id}"><span class="cn">${c.n}</span><span>${esc(c.name)}</span></button></li>`).join('')}</ul>`;
  }
  $('#panel').innerHTML = h;
  const pc = $('#pCfg'); if (pc) pc.addEventListener('click', e => { const b = e.target.closest('button'); if (b) site.setConfig(b.dataset.v); });
  const cab = site.cabinet();
  if (cab && s.level === 'cabinet') {
    $('#cView').addEventListener('click', e => { const b = e.target.closest('button'); if (b) cab.setView(b.dataset.v); });
    $('#cLay').addEventListener('click', e => { const b = e.target.closest('button'); if (b) cab.setLayer(b.dataset.l, !cab.getState().layers[b.dataset.l]); });
    $('#cList').addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (b) cab.select(b.dataset.id, { fly: true }); });
    const cc = $('#cClose'); if (cc) cc.addEventListener('click', () => cab.select(null));
  }
}
const seasonName = k => ({ summer: 'лето', equinox: 'весна/осень', winter: 'зима' }[k]);
function cmpRows(cfg) {
  const M = CABINET.configs.M.rows, Lr = CABINET.configs.L.rows; const pick = (rows, k) => (rows.find(r => r[0] === k) || [, '—'])[1];
  const keys = [['GPU', 'GPU'], ['P_node лето / зима', 'Мощность узла лето / зима'], ['Тепло в контуре', 'Тепло'], ['Резерв ввода', 'Нужный резерв ввода']];
  return keys.map(([k, n]) => `<tr><td>${n}</td><td class="${cfg === 'M' ? 'act' : 'inact'}">${esc(pick(M, k))}</td><td class="${cfg === 'L' ? 'act' : 'inact'}">${esc(pick(Lr, k))}</td></tr>`).join('');
}
function tourBox(s) {
  const tb = $('#tourbox'); if (!s.touring || s.tourStep < 0) { tb.hidden = true; $('#btnTour').textContent = 'Как это работает →'; return; }
  const st = SITE.tour[s.tourStep]; tb.hidden = false; $('#btnTour').textContent = 'Остановить тур';
  $('#tStep').textContent = `ШАГ ${s.tourStep + 1} / ${SITE.tour.length}`; $('#tTitle').textContent = st.title; $('#tText').innerHTML = fmt(st.text);
}
site.onChange(s => {
  if (!s.siteData) return;
  press('#segSite', s.site); press('#segCfg', s.config); press('#segSeason', s.season);
  $('#btnPlay').setAttribute('aria-pressed', String(s.playing)); $('#btnPlay').textContent = s.playing ? '❚❚' : '▶';
  if (document.activeElement !== $('#hour')) $('#hour').value = s.hour; $('#hourOut').textContent = hhmm(s.hour);
  energyBar(s); tourBox(s); $('#btnHost').textContent = s.siteData.consumer === 'Здание' ? 'Что получает владелец здания →' : 'Что получает хозяйство →';
  const key = [s.site, s.level, s.config, s.selected, s.season, s.cabinet && s.cabinet.view, s.cabinet && s.cabinet.selected, s.cabinet && JSON.stringify(s.cabinet.layers)].join('|');
  if (key !== last.key || (s.level === 'building' && Math.round(s.hour) !== last.h)) { crumbs(s); panel(s); last = { key, h: Math.round(s.hour) }; }
});
