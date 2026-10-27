// Types for cabinetScene.js (GGM-Node cabinet, three@0.128.0). Keep in sync with the JS file.
import type { CabinetData } from './cabinetData';

export type CabinetConfig = 'M' | 'L' | 'P0';
export type CabinetView = 'iso' | 'front' | 'rear' | 'top' | 'rack' | 'system' | 'hydro' | 'fire';
export type CabinetShell = 'glass' | 'solid' | 'hidden';
export type CabinetLayer = 'explode' | 'air' | 'water' | 'power' | 'signals' | 'fire' | 'numbers' | 'dims' | 'scale';
export type CabinetTheme = 'light' | 'dark';

export interface CabinetState {
  config: CabinetConfig;
  view: CabinetView;
  shell: CabinetShell;
  theme: CabinetTheme;
  layers: Record<CabinetLayer, boolean>;
  /** component id from cabinetData.components, or null */
  selected: string | null;
}

export interface CabinetOptions {
  config?: CabinetConfig;            // default 'L'
  view?: CabinetView;                // default 'iso'
  shell?: CabinetShell;              // default 'glass'
  theme?: CabinetTheme;              // default 'light'
  layers?: Partial<Record<CabinetLayer, boolean>>;
  /** render numbered HTML markers over the canvas (default true) */
  markers?: boolean;
  /** inject the small marker stylesheet once per document (default true) */
  injectStyles?: boolean;
  /** CSS font stack for dimension labels drawn into the canvas */
  font?: string;
  pixelRatioCap?: number;            // default 2
  /** override prefers-reduced-motion detection */
  reducedMotion?: boolean;
}

export interface CabinetHandle {
  setConfig(c: CabinetConfig): void;
  /** instant = jump without camera animation */
  setView(v: CabinetView, instant?: boolean): void;
  setShell(s: CabinetShell): void;
  setLayer(layer: CabinetLayer, on: boolean): void;
  setTheme(t: CabinetTheme): void;
  /** highlight a component; fly = move the camera to it */
  select(id: string | null, opts?: { fly?: boolean }): void;
  onSelect(cb: (id: string | null) => void): () => void;
  onChange(cb: (state: CabinetState) => void): () => void;
  getState(): CabinetState;
  resize(): void;
  /** PNG/JPEG data URL of the current frame */
  screenshot(type?: string): string;
  dispose(): void;
  /** pause/resume rendering while hidden behind another scene */
  setPaused(paused: boolean): void;
  readonly data: CabinetData;
}

export declare const VIEWS: Record<CabinetView, [[number, number, number], [number, number, number]]>;
export declare const LAYERS: CabinetLayer[];
export declare const CONFIGS: CabinetConfig[];
export declare const SHELLS: CabinetShell[];
export declare const PALETTES: Record<CabinetTheme, Record<string, string>>;
export declare const FLOW: Record<'cold' | 'hot' | 'supply' | 'ret' | 'power' | 'data' | 'fire', number>;
/** Camera pose [position, target] of a view for an aspect ratio. */
export declare function poseFor(view: CabinetView, aspect: number): [[number, number, number], [number, number, number]];
export declare function mountCabinet(host: HTMLElement, options?: CabinetOptions): CabinetHandle;
export default mountCabinet;
