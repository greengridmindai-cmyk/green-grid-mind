import type { CompId } from '../../../data/cabinet/components.ts';

export type GroupName =
  | 'room' | 'ecab' | 'rack' | 'brick1' | 'brick2' | 'cpu' | 'loadbank' | 'net' | 'fire'
  | 'lcp' | 'outdoor' | 'tray' | 'water' | 'power' | 'signal' | 'air' | 'dims' | 'static';
type V3 = [number, number, number];

export const U0: number;
export const UH: number;
export const GROUPS: GroupName[];
export const COLORS: { FRAME: number; DARK: number; DARK2: number; HL: number };
/** marker position per component: [group, x, y, z] */
export const ANCHORS: Record<CompId, [GroupName, number, number, number]>;
export const FLY_FAR: CompId[];
export const VIEWS: Record<'iso' | 'front' | 'rear' | 'top' | 'rack' | 'system', [V3, V3]>;
export const EXPLODE: Partial<Record<GroupName, V3>>;
