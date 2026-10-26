import { mountPage } from './mountPage.tsx';
import { NotFound } from './components/NotFound.tsx';
import type { PageMeta } from './i18n/index.ts';

const meta: PageMeta = {
  title: (t) => `${t.notFound.title} — {GGMname}`,
  description: (t) => t.notFound.body,
};

mountPage(<NotFound />, meta);
