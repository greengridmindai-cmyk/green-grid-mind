import { mountPage } from './mountPage.tsx';
import { LegalPage, LEGAL } from './components/LegalPage.tsx';
import type { PageMeta } from './i18n/index.ts';
import type { Lang } from './config.ts';

const lang = (): Lang => (document.documentElement.lang as Lang) || 'de';
const meta: PageMeta = {
  title: () => `${LEGAL[lang()].datenschutz.title} — {GGMname}`,
  description: () => LEGAL[lang()].datenschutz.description,
};

mountPage(<LegalPage page="datenschutz" />, meta);
