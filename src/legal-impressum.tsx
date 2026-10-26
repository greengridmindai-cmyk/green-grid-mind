import { mountPage } from './mountPage.tsx';
import { LegalPage, LEGAL } from './components/LegalPage.tsx';
import type { PageMeta } from './i18n/index.ts';
import type { Lang } from './config.ts';

const lang = (): Lang => (document.documentElement.lang as Lang) || 'de';
const meta: PageMeta = {
  title: () => `${LEGAL[lang()].impressum.title} — {GGMname}`,
  description: () => LEGAL[lang()].impressum.description,
};

mountPage(<LegalPage page="impressum" />, meta);
