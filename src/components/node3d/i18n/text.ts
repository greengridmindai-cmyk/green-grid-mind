/**
 * Translation layer for the node3d modules. cabinetData.js and siteData.js are Russian masters;
 * de.ts / en.ts hold the same texts keyed by component id / site id / building id / marker / tour step /
 * table row. `extractText()` builds that keyed view from the masters (also used by
 * scripts/cabinet/check-i18n-cabinet.mjs), `applyText()` writes a translation back into the module objects.
 */
import type { CabinetData } from '../cabinetData.d.ts';
import type { LevelKey, MarkerId, SiteData } from '../siteData.d.ts';

export type SeasonKey = 'summer' | 'equinox' | 'winter';
export type Seasons = Record<SeasonKey, { label: string }>;

export interface CompText {
  g: string;
  name: string;
  f: string;
  fs: string;
  s: [string, string][];
  ps: string;
  l: string[];
}

export interface SiteText {
  name: string;
  short: string;
  consumer: string;
  facts: [string, string][];
  /** building id → label */
  buildings: Record<string, string>;
}

export interface Node3dText {
  cabinet: {
    basis: string;
    /** group key → name */
    groups: Record<string, string>;
    /** component id → texts */
    components: Record<string, CompText>;
    connections: [string, string, string, string, string][];
    fireMatrix: { cols: string[]; rows: string[][] };
    configs: Record<'M' | 'L' | 'P0', { name: string; gpu: string; rows: [string, string][]; note: string }>;
    rackLayout: [string, string, string, string, string][];
    openItems: [string, string, string][];
    review: [string, string, string, string][];
    text: CabinetData['text'];
  };
  site: {
    basis: string;
    /** site id → texts */
    sites: Record<string, SiteText>;
    levels: Record<LevelKey, { title: string; lead: string }>;
    roomFacts: [string, string][];
    markers: Record<MarkerId, { label: string; text: string }>;
    legend: [string, string][];
    hostCard: { title: string; gets: string[]; needs: string[] };
    tour: { title: string; text: string }[];
  };
  seasons: Record<SeasonKey, string>;
  /** strings written by the engines themselves (HTML overlays, canvas sprites): Russian literal → translation */
  scene: Record<string, string>;
}

/** Literal strings in siteScene.js / cabinetScene.js that reach the screen (not data-driven). */
export const SCENE_STRINGS = [
  'Здание · ',
  'Узел GGM',
  'Накопитель +',
  'Накопитель −',
  'Из сети',
  'В сеть',
  'Тепло',
  '1,8 м',
  '1 900 мм',
  '2 000 мм',
  '1 200 мм',
  'зона обслуживания ≥ 1 200 мм',
  'стена здания',
  'снаружи',
  'помещение',
] as const;

const clone = <T>(x: T): T => structuredClone(x);

/** Keyed view of the Russian masters (same shape as de.ts / en.ts). */
export function extractText(cab: CabinetData, site: SiteData, seasons: Seasons): Node3dText {
  return {
    cabinet: {
      basis: cab.revision.basis,
      groups: Object.fromEntries(cab.groups.map((g) => [g.key, g.name])),
      components: Object.fromEntries(
        cab.components.map((c) => [
          c.id,
          { g: c.g, name: c.name, f: c.f, fs: c.fs, s: clone(c.s), ps: c.ps, l: [...c.l] },
        ]),
      ),
      connections: clone(cab.connections),
      fireMatrix: clone(cab.fireMatrix),
      configs: clone(cab.configs),
      rackLayout: clone(cab.rackLayout),
      openItems: clone(cab.openItems),
      review: clone(cab.review),
      text: clone(cab.text),
    },
    site: {
      basis: site.revision.basis,
      sites: Object.fromEntries(
        site.sites.map((s) => [
          s.id,
          {
            name: s.name,
            short: s.short,
            consumer: s.consumer,
            facts: clone(s.facts),
            buildings: Object.fromEntries(s.buildings.map((b) => [b.id, b.label])),
          },
        ]),
      ),
      levels: clone(site.levels),
      roomFacts: clone(site.roomFacts),
      markers: clone(site.markers),
      legend: clone(site.legend),
      hostCard: clone(site.hostCard),
      tour: site.tour.map((t) => ({ title: t.title, text: t.text })),
    },
    seasons: {
      summer: seasons.summer.label,
      equinox: seasons.equinox.label,
      winter: seasons.winter.label,
    },
    scene: Object.fromEntries(SCENE_STRINGS.map((s) => [s, s])),
  };
}

/** Overlay `tr` on `base` (same shape); strings missing in `tr` keep the base value (reported via `miss`). */
export function overlay<T>(base: T, tr: unknown, miss: (path: string) => void, path = ''): T {
  if (typeof base === 'string') {
    if (typeof tr === 'string') return tr as T;
    miss(path);
    return base;
  }
  if (Array.isArray(base))
    return base.map((v, i) => overlay(v, Array.isArray(tr) ? tr[i] : undefined, miss, `${path}.${i}`)) as T;
  if (base && typeof base === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(base))
      out[k] = overlay(
        v,
        tr && typeof tr === 'object' ? (tr as Record<string, unknown>)[k] : undefined,
        miss,
        `${path}.${k}`,
      );
    return out as T;
  }
  return base;
}

/** Write a (complete or partial) translation into the live module objects. `master` is the pristine Russian view. */
export function applyText(
  cab: CabinetData,
  site: SiteData,
  seasons: Seasons,
  master: Node3dText,
  t: Node3dText,
): void {
  const c = t.cabinet;
  cab.revision.basis = c.basis;
  for (const g of cab.groups) g.name = c.groups[g.key] ?? g.name;
  for (const comp of cab.components)
    Object.assign(comp, clone(c.components[comp.id] ?? master.cabinet.components[comp.id]));
  cab.connections = clone(c.connections);
  cab.fireMatrix = clone(c.fireMatrix);
  cab.configs = clone(c.configs);
  cab.rackLayout = clone(c.rackLayout);
  cab.openItems = clone(c.openItems);
  cab.review = clone(c.review);
  cab.text = clone(c.text);

  const s = t.site;
  site.revision.basis = s.basis;
  for (const def of site.sites) {
    const st = s.sites[def.id] ?? master.site.sites[def.id];
    if (!st) continue;
    def.name = st.name;
    def.short = st.short;
    def.consumer = st.consumer;
    def.facts = clone(st.facts);
    for (const b of def.buildings) b.label = st.buildings[b.id] ?? b.label;
  }
  site.levels = clone(s.levels);
  site.roomFacts = clone(s.roomFacts);
  site.markers = clone(s.markers);
  site.legend = clone(s.legend);
  site.hostCard = clone(s.hostCard);
  site.tour.forEach((step, i) => Object.assign(step, s.tour[i] ?? master.site.tour[i]));
  for (const k of Object.keys(seasons) as SeasonKey[]) seasons[k].label = t.seasons[k];
}
