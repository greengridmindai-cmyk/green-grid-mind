import { createContext, useContext } from 'react';
import type { Lang } from '../config.ts';
import type { Dict } from './de.ts';

export interface I18nValue {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}

export const useT = () => useI18n().t;
export const useLang = () => useI18n().lang;
