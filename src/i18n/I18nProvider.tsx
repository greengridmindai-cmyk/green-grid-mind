import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGUAGES, type Lang } from '../config.ts';
import { I18nContext, type I18nValue } from './context.ts';
import { de, type Dict } from './de.ts';
import { en } from './en.ts';
import { ru } from './ru.ts';
import { plain } from './rich.tsx';

const DICTS: Record<Lang, Dict> = { de, en, ru };
const KEY = 'ggm-lang';

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGUAGES as readonly string[]).includes(v);
}

/** Language chosen by the inline <head> bootstrap (?lang= → localStorage → de). */
export function initialLang(): Lang {
  const l = document.documentElement.lang;
  return isLang(l) ? l : 'de';
}

function setMeta(selector: string, value: string) {
  document.querySelector(selector)?.setAttribute('content', value);
}

export interface PageMeta {
  title: (t: Dict) => string;
  description: (t: Dict) => string;
}

export function I18nProvider({ children, meta }: { children: ReactNode; meta?: PageMeta }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [announce, setAnnounce] = useState('');
  const t = DICTS[lang];

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage unavailable */
    }
    const url = new URL(window.location.href);
    if (l === 'de') url.searchParams.delete('lang');
    else url.searchParams.set('lang', l);
    window.history.replaceState(window.history.state, '', url);
    setAnnounce(DICTS[l].a11y.langAnnounce);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    const title = plain(meta ? meta.title(t) : t.meta.title, lang);
    const desc = plain(meta ? meta.description(t) : t.meta.description, lang);
    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:description"]', desc);
    setMeta('meta[property="og:locale"]', t.meta.ogLocale);
  }, [lang, t, meta]);

  const value = useMemo<I18nValue>(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return (
    <I18nContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" role="status">
        {announce}
      </div>
    </I18nContext.Provider>
  );
}
