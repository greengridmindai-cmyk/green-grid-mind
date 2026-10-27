import { Fragment } from 'react';
import type { TagKey } from '../../data/node.ts';
import { Tag } from '../ui/Tag.tsx';

/** Status tags of the module data → the site's tag keys. */
export const MOD_TAG: Record<string, TagKey> = {
  ПОДТВ: 'ok',
  ОЦ: 'est',
  МОД: 'model',
  ДОП: 'asm',
  НОРМ: 'norm',
  ОТКР: 'open',
  ЦЕЛЬ: 'spec',
};
const TAG_RE = /\[(ПОДТВ|ОЦ|МОД|ДОП|НОРМ|ОТКР|ЦЕЛЬ)(?:\s*—\s*([^\]]*))?\]/g;

/** Text from cabinetData.js / siteData.js: status tags like [ОЦ] or [ОЦ — note] become <Tag/> (+ note). */
export function ModText({ s }: { s: string }) {
  const out = [];
  let last = 0;
  let i = 0;
  for (const m of s.matchAll(TAG_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<Fragment key={i++}>{s.slice(last, idx)}</Fragment>);
    out.push(<Tag key={i++} k={MOD_TAG[m[1] ?? ''] ?? 'asm'} />);
    if (m[2]) out.push(<span key={i++} className="tag-note">{` ${m[2]}`}</span>);
    last = idx + m[0].length;
  }
  if (last < s.length) out.push(<Fragment key={i++}>{s.slice(last)}</Fragment>);
  return <>{out}</>;
}

/** Bare status code (e.g. the status column of the connections table). */
export function ModTag({ code }: { code: string }) {
  return <Tag k={MOD_TAG[code] ?? 'asm'} />;
}
