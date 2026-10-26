import type { Lang } from '../config.ts';

export const SECTION_IDS = ['prinzip', 'knoten', 'modell', 'hoefe', 'unternehmen', 'status'] as const;
export type SectionId = (typeof SECTION_IDS)[number] | 'kontakt';

/** Old URLs of the previous site (already shared) → new anchors (§5). */
export const LEGACY_HASH: Record<string, string> = {
  tech: 'prinzip',
  node: 'knoten',
  configs: 'knoten',
  site: 'hoefe',
  cabinet: 'modell',
};

const BASE = import.meta.env.BASE_URL;

/** Adds ?lang= for non-default languages. */
export function withLang(path: string, lang: Lang): string {
  if (lang === 'de') return path;
  const [p, hash] = path.split('#');
  return `${p}${p?.includes('?') ? '&' : '?'}lang=${lang}${hash !== undefined ? `#${hash}` : ''}`;
}

/** Link to an anchor of the main page — same document on the main page, absolute elsewhere. */
export function anchorHref(id: string, lang: Lang, onHome: boolean): string {
  return onHome ? `#${id}` : withLang(`${BASE}#${id}`, lang);
}

export const pageHref = (page: 'impressum' | 'datenschutz' | 'home', lang: Lang) =>
  withLang(page === 'home' ? BASE : `${BASE}${page}/`, lang);
