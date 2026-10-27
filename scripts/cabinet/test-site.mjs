// Unit checks for energyModel.js + consistency of siteData.js. Run: node scripts/cabinet/test-site.mjs (exit 1 on failure).
import { simulateDay, balance, pvPower, SEASONS } from '../../src/components/node3d/energyModel.js';
import { SITE } from '../../src/components/node3d/siteData.js';
import { CABINET } from '../../src/components/node3d/cabinetData.js';

const fail = []; const ok = (c, m) => { if (!c) fail.push(m); };
const TAGS = ['ПОДТВ', 'ОЦ', 'МОД', 'ДОП', 'НОРМ', 'ОТКР', 'ЦЕЛЬ'];
for (const s of SITE.sites) {
  ok(s.buildings.filter(b => b.node).length === 1, `${s.id}: exactly one building with node:true`);
  ok(s.extras.some(e => e.type === 'trafo') && s.extras.some(e => e.type === 'gridline'), `${s.id}: trafo and gridline required`);
  ok(SITE.node[s.recommend], `${s.id}: recommend must be M or L`);
  for (const m of JSON.stringify(s).matchAll(/\[([А-ЯЁ]{2,5})(?=[\]\s,—])/g)) ok(TAGS.includes(m[1]), `${s.id}: unknown tag ${m[1]}`);
  for (const cfg of ['M', 'L']) for (const season of Object.keys(SEASONS)) {
    const node = { itKW: SITE.node[cfg].itKW, baseShare: SITE.node.baseShare }; const d = simulateDay(s, node, season);
    const worst = Math.max(...d.steps.map(x => Math.abs(balance(x))));
    ok(worst < 1e-6, `${s.id} ${cfg} ${season}: energy balance residual ${worst}`);
    ok(d.steps.every(x => x.nodeIT <= node.itKW + 1e-9 && x.nodeIT >= node.itKW * node.baseShare - 1e-9), `${s.id} ${cfg} ${season}: node IT outside [base, max]`);
    ok(d.steps.every(x => x.soc == null || (x.soc >= 0.099 && x.soc <= 1.0001)), `${s.id} ${cfg} ${season}: battery SoC out of range`);
    ok(d.totals.pvShareNode >= 0 && d.totals.pvShareNode <= 1, `${s.id}: PV share out of range`);
  }
}
ok(pvPower(100, 3, 'summer') === 0 && pvPower(100, 13, 'summer') > 0, 'pvPower night/day');
// node reserve figures must match the cabinet data (single source)
const res = cfg => +((CABINET.configs[cfg].rows.find(r => r[0] === 'Резерв ввода') || [, ''])[1].match(/\d+/) || [0])[0];
ok(res('M') === SITE.node.M.reserveKW && res('L') === SITE.node.L.reserveKW, `reserve mismatch siteData vs cabinetData: ${res('M')}/${res('L')}`);
console.log(fail.length ? 'FAIL\n' + fail.join('\n') : `OK — ${SITE.sites.length} sites × 2 configs × 3 seasons`);
process.exit(fail.length ? 1 : 0);
