// Types for energyModel.js (site scene 1.0). Added on the website side — the package ships no .d.ts for this file.
export type Season = 'summer' | 'equinox' | 'winter';

export declare const SEASONS: Record<
  Season,
  {
    label: string;
    rise: number;
    set: number;
    kPeak: number;
    sunMaxEl: number;
    pue: { day: number; night: number };
  }
>;
