/**
 * Seasonality of the solar batch layer (§14.3, tag `est`).
 * Model: 100 kWp PV, 30 % farm priority, PVGIS; target 2 044 GPU·h per month.
 */
export const SEASON_MODEL = { kwp: 100, farmPriority: 30, target: 2044 } as const;

export const SEASON: { month: number; gpuh: number; pct: number }[] = [
  { month: 1, gpuh: 945, pct: 46 },
  { month: 2, gpuh: 1060, pct: 52 },
  { month: 3, gpuh: 1648, pct: 81 },
  { month: 4, gpuh: 2238, pct: 109 },
  { month: 5, gpuh: 1913, pct: 94 },
  { month: 6, gpuh: 1678, pct: 82 },
  { month: 7, gpuh: 2156, pct: 105 },
  { month: 8, gpuh: 1805, pct: 88 },
  { month: 9, gpuh: 1636, pct: 80 },
  { month: 10, gpuh: 941, pct: 46 },
  { month: 11, gpuh: 714, pct: 35 },
  { month: 12, gpuh: 487, pct: 24 },
];
