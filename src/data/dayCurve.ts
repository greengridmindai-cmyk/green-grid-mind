/**
 * Schematic day curve (§5.2 B) — relative shapes, NOT measured data.
 * PV bell 6–20 h with peak at 13 h; farm load with milking peaks around 6 h and 18 h;
 * node = constant base band + flexible band that fills the PV surplus.
 */
export const DAY = {
  sunrise: 6,
  sunset: 20,
  peak: 13,
  pvMax: 1,
  farmBase: 0.16,
  milking: [
    { at: 6, height: 0.2, width: 1.1 },
    { at: 18, height: 0.22, width: 1.2 },
  ],
  farmMidday: 0.06,
  nodeBase: 0.16,
  nodeFlexMax: 0.42,
} as const;

/** PV generation (relative), smooth bell between sunrise and sunset. */
export function pv(h: number): number {
  if (h <= DAY.sunrise || h >= DAY.sunset) return 0;
  const half = h < DAY.peak ? DAY.peak - DAY.sunrise : DAY.sunset - DAY.peak;
  const x = (h - DAY.peak) / half;
  return DAY.pvMax * Math.cos((x * Math.PI) / 2) ** 2;
}

/** Farm load (relative). */
export function farm(h: number): number {
  let v = DAY.farmBase;
  for (const m of DAY.milking) v += m.height * Math.exp(-(((h - m.at) / m.width) ** 2));
  v += DAY.farmMidday * Math.exp(-(((h - 12.5) / 2.5) ** 2));
  return v;
}

/** Flexible node share placed under the PV surplus (after farm demand), capped. */
export function flex(h: number): number {
  const surplus = pv(h) - farm(h);
  return Math.max(0, Math.min(DAY.nodeFlexMax, surplus * 0.85));
}
