import { Fragment, type ReactNode } from 'react';
import type { Lang } from '../config.ts';
import { isTermKey, termText } from './terms.ts';
import { Term } from './Term.tsx';

export type Vars = Record<string, ReactNode>;
const TOKEN = /\{([A-Za-z0-9_]+)\}/g;

/**
 * Renders a translation string. `{KEY}` resolves first to a variable from `v`,
 * then to a never-translated term (rendered via <Term/>).
 */
export function R({ s, v }: { s: string; v?: Vars }) {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of s.matchAll(TOKEN)) {
    const key = m[1] ?? '';
    const idx = m.index ?? 0;
    if (idx > last) out.push(s.slice(last, idx));
    if (v && key in v) out.push(<Fragment key={i++}>{v[key]}</Fragment>);
    else if (isTermKey(key)) out.push(<Term key={i++} id={key} />);
    else out.push(m[0]);
    last = idx + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return <>{out}</>;
}

/** Plain-text version for attributes, document.title, mailto bodies. */
export function plain(s: string, lang: Lang, v?: Record<string, string>): string {
  return s.replace(TOKEN, (all, key: string) => {
    if (v && key in v) return v[key] ?? '';
    if (isTermKey(key)) return termText(key, lang);
    return all;
  });
}
