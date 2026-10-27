// Types for siteScene.js (levels 1–3 + hand-over to the cabinet module). Keep in sync with the JS file.
import type { CabinetHandle, CabinetState } from './cabinetScene';

export type SiteLevel = 'site' | 'building' | 'room' | 'cabinet';
export type NodeConfig = 'M' | 'L';
export type Season = 'summer' | 'equinox' | 'winter';

export interface FlowSnapshot {
  pv: number; farm: number; bessCharge: number; bessDischarge: number; node: number; nodeIT: number;
  gridImport: number; gridExport: number; heat: number; soc: number | null;
  pvShareNodeDay: number; nodeDayKWh: number; reserveNeed: number; reserveAvail: number | null;   // kW, kWh, share 0–1
}
export interface SiteState {
  site: string; level: SiteLevel; config: NodeConfig; hour: number; season: Season;
  playing: boolean; touring: boolean; tourStep: number; selected: string | null; busy: boolean;
  flows: FlowSnapshot; siteData: unknown; cabinet: CabinetState | null;
}
export interface SiteOptions { site?: string; config?: NodeConfig; hour?: number; season?: Season; reducedMotion?: boolean }
export interface SiteHandle {
  setSite(id: string): Promise<void>;
  setLevel(level: SiteLevel, opts?: { fast?: boolean; instant?: boolean }): Promise<void>;
  setConfig(c: NodeConfig): void;
  setTime(hour: number, season?: Season): void;
  play(on: boolean): void;
  tour(action: 'start' | 'stop' | 'next' | 'prev'): void;
  /** '1' building, '2' node (goes to the cabinet), 'A'–'E' info markers, null */
  select(id: string | null): void | Promise<void>;
  onChange(cb: (s: SiteState) => void): () => void;
  onSelect(cb: (e: { level: SiteLevel; id: string | null }) => void): () => void;
  getState(): SiteState;
  cabinet(): CabinetHandle | null;
  resize(): void; screenshot(): string; dispose(): void;
  readonly data: unknown;
}
export declare const LEVELS: SiteLevel[];
export declare const SITE_FLOW: Record<'pv' | 'farm' | 'grid' | 'bess' | 'node' | 'heat' | 'cold', number>;
export declare function mountSite(host: HTMLElement, options?: SiteOptions): SiteHandle;
export default mountSite;
