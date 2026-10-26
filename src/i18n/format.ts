import type { Lang } from '../config.ts';

/** Narrow no-break space (U+202F): between number and unit, and as thousands separator. */
export const NNBSP = ' ';

const LOCALE: Record<Lang, string> = { de: 'de-DE', en: 'en-GB', ru: 'ru-RU' };

export type Unit =
  | 'kW'
  | 'kVA'
  | 'kWp'
  | 'W'
  | 'V'
  | 'A'
  | 'mm'
  | 'm'
  | 'mm²'
  | 'm³/h'
  | 'l/min'
  | 'kg/m²'
  | 'kg'
  | '°C'
  | 'K'
  | 'U'
  | '%'
  | 's'
  | 'min'
  | 'GB'
  | 'TB'
  | 'GPU·h'
  | 'mA';

/** A language-independent quantity. Formatting (decimal comma/point, spaces) happens per locale. */
export type Q =
  | { k: 'n'; v: number; unit?: Unit; approx?: boolean; cmp?: '≥' | '≤' | '<' | '>'; d?: number }
  | { k: 'r'; a: number; b: number; unit?: Unit; approx?: boolean; d?: number }
  | { k: 'p'; a: number; b: number; unit?: Unit; approx?: boolean; d?: number }
  | { k: 'x'; vals: number[]; unit?: Unit; d?: number };

export const n = (
  v: number,
  unit?: Unit,
  o: { approx?: boolean; cmp?: '≥' | '≤' | '<' | '>'; d?: number } = {},
): Q => ({
  k: 'n',
  v,
  ...(unit ? { unit } : {}),
  ...o,
});
export const r = (a: number, b: number, unit?: Unit, o: { approx?: boolean; d?: number } = {}): Q => ({
  k: 'r',
  a,
  b,
  ...(unit ? { unit } : {}),
  ...o,
});
export const pair = (a: number, b: number, unit?: Unit, o: { approx?: boolean; d?: number } = {}): Q => ({
  k: 'p',
  a,
  b,
  ...(unit ? { unit } : {}),
  ...o,
});
export const dims = (vals: number[], unit?: Unit, d?: number): Q => ({
  k: 'x',
  vals,
  ...(unit ? { unit } : {}),
  ...(d !== undefined ? { d } : {}),
});

const cache = new Map<string, Intl.NumberFormat>();
function nf(lang: Lang, d: number): Intl.NumberFormat {
  const key = `${lang}:${d}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE[lang], {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
      useGrouping: true,
    });
    cache.set(key, f);
  }
  return f;
}

function decimals(v: number): number {
  const s = String(v);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

/** Format a plain number: SI thin-space grouping (≥ 4 digits) in every locale, locale decimal mark. */
export function fmtNum(v: number, lang: Lang, d = decimals(v)): string {
  const parts = nf(lang, d).formatToParts(v);
  const intDigits = Math.trunc(Math.abs(v)).toString().length;
  return parts
    .map((p) => {
      if (p.type === 'group') return intDigits >= 4 ? NNBSP : '';
      if (p.type === 'minusSign') return '−';
      return p.value;
    })
    .join('');
}

const withUnit = (s: string, unit?: Unit) =>
  unit ? (unit === '%' ? `${s}${NNBSP}%` : `${s}${NNBSP}${unit}`) : s;

export function fmtQ(q: Q, lang: Lang): string {
  switch (q.k) {
    case 'n': {
      const pre = q.approx ? `≈${NNBSP}` : q.cmp ? `${q.cmp}${NNBSP}` : '';
      return pre + withUnit(fmtNum(q.v, lang, q.d), q.unit);
    }
    case 'r': {
      const pre = q.approx ? `≈${NNBSP}` : '';
      return pre + withUnit(`${fmtNum(q.a, lang, q.d)}–${fmtNum(q.b, lang, q.d)}`, q.unit);
    }
    case 'p': {
      const pre = q.approx ? `≈${NNBSP}` : '';
      return pre + withUnit(`${fmtNum(q.a, lang, q.d)} / ${fmtNum(q.b, lang, q.d)}`, q.unit);
    }
    case 'x':
      return withUnit(q.vals.map((v) => fmtNum(v, lang, q.d)).join(' × '), q.unit);
  }
}

export function fmtDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1)));
}

export const localeOf = (lang: Lang) => LOCALE[lang];
