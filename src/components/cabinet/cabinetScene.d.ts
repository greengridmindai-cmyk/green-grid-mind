import type { CompId } from '../../data/cabinet/components.ts';

export type CabinetConfig = 'M' | 'L' | 'P0';
export type CabinetView = 'iso' | 'front' | 'rear' | 'top' | 'rack' | 'system';
export type CabinetShell = 'glass' | 'solid' | 'hidden';
export type CabinetLayer = 'explode' | 'air' | 'water' | 'power' | 'signals' | 'numbers' | 'dims';

/** Localized text sprites inside the scene. */
export interface CabinetLabels {
  total: string;
  s800: string;
  s300: string;
  height: string;
  depth: string;
  service: string;
  wall: string;
  outside: string;
  room: string;
}

export interface CabinetHandle {
  setConfig(c: CabinetConfig): void;
  /** `instant` skips the fly-to animation (used by tests and reduced motion). */
  setView(v: CabinetView, instant?: boolean): void;
  setShell(s: CabinetShell): void;
  setLayer(l: CabinetLayer, on: boolean): void;
  select(id: string | null): void;
  onSelect(cb: (id: string | null) => void): () => void;
  resize(): void;
  /** remove listeners, cancel RAF, dispose geometries/materials/textures, renderer.forceContextLoss() */
  dispose(): void;
  setNames(names: Partial<Record<CompId, string>>): void;
  setLabels(labels: Partial<CabinetLabels>): void;
  /** false if the component is not installed in the current configuration */
  isAvailable(id: string): boolean;
  readonly state: {
    config: CabinetConfig;
    view: CabinetView;
    shell: CabinetShell;
    sel: string | null;
    layers: Record<string, boolean>;
  };
  readonly canvas: HTMLCanvasElement;
}

export function mountCabinet(
  canvasHost: HTMLElement,
  opts: {
    config: CabinetConfig;
    theme: 'dark';
    names?: Partial<Record<CompId, string>>;
    labels?: Partial<CabinetLabels>;
  },
): CabinetHandle;
