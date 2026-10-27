// GGM site energy model — pure functions, no three.js. Status of all results: [МОД] (schematic, clear day).
// Priority cascade (website brief §5.2): PV → 1 farm → 2 battery (host rules) → 3 GGM node, flexible part → 4 grid export.
// The node runs a base share of its IT load 24/7 from any source; the flexible share follows the PV surplus.

export const SEASONS = {
  summer:  { label: 'лето',          rise: 5, set: 21, kPeak: 0.72, sunMaxEl: 64, pue: { day: 1.45, night: 1.30 } },
  equinox: { label: 'весна / осень', rise: 7, set: 19, kPeak: 0.60, sunMaxEl: 41, pue: { day: 1.25, night: 1.20 } },
  winter:  { label: 'зима',          rise: 8, set: 16, kPeak: 0.30, sunMaxEl: 18, pue: { day: 1.14, night: 1.14 } },
};

const gauss = (h, mu, s) => Math.exp(-0.5 * ((h - mu) / s) ** 2);

/** PV power in kW at hour h (0–24). */
export function pvPower(kWp, h, season) {
  const S = SEASONS[season];
  if (h <= S.rise || h >= S.set) return 0;
  return kWp * S.kPeak * Math.pow(Math.sin(Math.PI * (h - S.rise) / (S.set - S.rise)), 1.3);
}

/** Load shape (mean over 24 h = 1). */
function shapeRaw(profile, h, season) {
  if (profile === 'commercial') {
    const day = h >= 7 && h < 18 ? 1.45 : 0.6;
    return day + (season === 'summer' && h >= 10 && h < 17 ? 0.2 : 0);
  }
  // dairy: base + milking peaks ≈ 6:00 and 17:30 + daytime ventilation in summer
  return 0.75 + 0.9 * gauss(h, 6, 1) + 0.9 * gauss(h, 17.5, 1) + (season === 'summer' && h >= 10 && h < 19 ? 0.25 : 0);
}
const norm = {};
function shapeMean(profile, season) {
  const k = profile + season; if (norm[k]) return norm[k];
  let s = 0; for (let i = 0; i < 96; i++) s += shapeRaw(profile, i / 4 + 0.125, season); return (norm[k] = s / 96);
}
/** Farm (host) load in kW. */
export function farmLoad(annualMWh, profile, h, season) {
  return annualMWh * 1000 / 8760 * shapeRaw(profile, h, season) / shapeMean(profile, season);
}

export function pue(season, h) {
  const S = SEASONS[season]; return h >= 10 && h < 19 ? S.pue.day : S.pue.night;
}

/**
 * Simulate one day in 15-min steps. site: {pvKWp, bess:{kWh,kW}|null, farm:{annualMWh, profile}};
 * node: {itKW, baseShare}. Returns {steps:[snapshot], totals}.
 */
export function simulateDay(site, node, season, dtH = 0.25) {
  const steps = []; const bess = site.bess && site.bess.kWh > 0 ? site.bess : null;
  let soc = bess ? 0.3 * bess.kWh : 0; const socMin = bess ? 0.1 * bess.kWh : 0;
  const T = { pv: 0, farm: 0, node: 0, nodeFromPV: 0, gridImport: 0, gridExport: 0 };
  for (let i = 0; i <= 24 / dtH; i++) {
    const h = i * dtH;
    const pv = pvPower(site.pvKWp, h, season);
    const farm = farmLoad(site.farm.annualMWh, site.farm.profile, h, season);
    const u = pue(season, h);
    let surplus = pv - farm;                                   // 1 farm
    let bessCharge = 0, bessDischarge = 0;
    if (bess) {                                                // 2 battery, host rules
      if (surplus > 0) { bessCharge = Math.min(surplus, bess.kW, (bess.kWh - soc) / dtH); surplus -= bessCharge; }
      else { bessDischarge = Math.min(-surplus, bess.kW, Math.max(0, (soc - socMin) / dtH)); surplus += bessDischarge; }
    }
    const itBase = node.itKW * node.baseShare;                 // 3 node: base 24/7 + flexible on surplus
    const itFlex = Math.min(node.itKW - itBase, Math.max(0, surplus - itBase * u) / u);
    const nodeIT = itBase + Math.max(0, itFlex);
    const nodeP = nodeIT * u;
    const net = farm + bessCharge + nodeP - pv - bessDischarge; // >0 import, <0 export (4)
    const pvAfterFarmBess = Math.max(0, pv - farm - bessCharge);
    const nodeFromPV = Math.min(nodeP, pvAfterFarmBess);
    const s = { h, pv, farm, bessCharge, bessDischarge, soc: bess ? soc / bess.kWh : null, node: nodeP, nodeIT, pue: u,
      heat: nodeIT * 1.027, gridImport: Math.max(0, net), gridExport: Math.max(0, -net), nodeFromPV };
    steps.push(s);
    if (i < 24 / dtH) {
      soc += (bessCharge - bessDischarge) * dtH;
      for (const k of ['pv', 'farm', 'node', 'nodeFromPV', 'gridImport', 'gridExport']) T[k] += s[k] * dtH;
    }
  }
  T.pvShareNode = T.node > 0 ? T.nodeFromPV / T.node : 0;
  return { steps, totals: T };
}

/** Linear interpolation of a simulated day at hour h. */
export function at(day, h) {
  const n = day.steps.length - 1, x = Math.max(0, Math.min(24, h)) / 24 * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
  const a = day.steps[i], b = day.steps[i + 1], o = {};
  for (const k in a) o[k] = typeof a[k] === 'number' ? a[k] + (b[k] - a[k]) * f : a[k];
  return o;
}

/** Energy balance residual (kW) — must be ~0 for every step. */
export function balance(s) { return s.pv + s.gridImport + s.bessDischarge - (s.farm + s.bessCharge + s.node + s.gridExport); }
