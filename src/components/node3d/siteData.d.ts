// Types for siteData.js (site scene 1.0). Added on the website side — the package ships no .d.ts for this file.
// Keep in sync with the schema of siteData.js.
export type SiteId = string;

export interface SiteBuilding {
  id: string;
  type: string;
  label: string;
  x: number;
  z: number;
  L?: number;
  W?: number;
  eave?: number;
  ridge?: number;
  h?: number;
  pv?: Record<string, number>;
  node?: boolean;
  color?: string;
}

export interface SiteDef {
  id: SiteId;
  name: string;
  short: string;
  consumer: string;
  pvKWp: number;
  bess: { kWh: number; kW: number } | null;
  farm: { annualMWh: number; profile: string };
  reserveKW: number;
  recommend: 'M' | 'L';
  facts: [string, string][];
  buildings: SiteBuilding[];
  [k: string]: unknown;
}

export type MarkerId = 'A' | 'B' | 'C' | 'D' | 'E';
export type LevelKey = 'site' | 'building' | 'room' | 'cabinet';

export interface SiteData {
  revision: { rev: string; date: string; basis: string };
  node: {
    M: { itKW: number; reserveKW: number; gpu: string; label: string };
    L: { itKW: number; reserveKW: number; gpu: string; label: string };
    baseShare: number;
  };
  sites: SiteDef[];
  levels: Record<LevelKey, { title: string; lead: string }>;
  roomFacts: [string, string][];
  markers: Record<MarkerId, { label: string; text: string }>;
  legend: [string, string][];
  hostCard: { title: string; gets: string[]; needs: string[] };
  tour: { level: LevelKey; hour: number; season: string; title: string; text: string }[];
}

export declare const SITE: SiteData;
export default SITE;
