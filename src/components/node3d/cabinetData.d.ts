// Types for cabinetData.js. Keep in sync with the schema comment at the top of cabinetData.js.
export type StatusTag = 'ПОДТВ' | 'ОЦ' | 'МОД' | 'ДОП' | 'НОРМ' | 'ОТКР';

export interface CabinetComponent {
  id: string;                 // stable key used by the scene
  n: number;                  // marker number
  group: 'shell' | 'power' | 'it' | 'fire' | 'ext';
  g: string;                  // group display name
  name: string;
  f: string;                  // function, long
  fs: string;                 // function, short
  s: [string, string][];      // spec rows
  ps: string;                 // short spec
  st: StatusTag;
  l: string[];                // links to other components
  anchor: { group: string; pos: [number, number | string, number] };
}

export interface CabinetConfigData { name: string; gpu: string; rows: [string, string][]; note: string }

export interface CabinetData {
  revision: { rev: string; date: string; basis: string };
  groups: { key: string; name: string }[];
  components: CabinetComponent[];
  connections: [string, string, string, string, string][];
  fireMatrix: { cols: string[]; rows: string[][] };
  configs: Record<'M' | 'L' | 'P0', CabinetConfigData>;
  rackLayout: [string, string, string, string, string][];
  openItems: [string, string, string][];
  review: [string, string, string, string][];
  text: {
    title: string; eyebrow: string; lead: string;
    stamp: [string, string][]; legend: [string, string][];
    principles: [string, string][]; room: string[]; fireLayers: [string, string][]; sources: [string, string][];
  };
}

export declare const CABINET: CabinetData;
export default CABINET;
