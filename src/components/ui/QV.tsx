import { useCallback } from 'react';
import { fmtQ, type Q } from '../../i18n/format.ts';
import { useLang } from '../../i18n/index.ts';

/** Locale-bound quantity formatter. */
export function useFmt() {
  const lang = useLang();
  return useCallback((q: Q) => fmtQ(q, lang), [lang]);
}

/** Renders a formatted quantity with tabular numerals. */
export function QV({ q }: { q: Q }) {
  const f = useFmt();
  return <span className="tnum whitespace-nowrap">{f(q)}</span>;
}

/** Builds `{q0}`, `{q1}` … variables for <R/> from a list of quantities. */
export function useQVars() {
  const f = useFmt();
  return useCallback(
    (qs: Q[] | undefined): Record<string, string> =>
      Object.fromEntries((qs ?? []).map((q, i) => [`q${i}`, f(q)])),
    [f],
  );
}
