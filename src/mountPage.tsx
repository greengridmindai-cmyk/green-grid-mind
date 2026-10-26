import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import { I18nProvider, type PageMeta } from './i18n/index.ts';

export function mountPage(node: ReactNode, meta?: PageMeta) {
  const root = document.getElementById('root');
  if (!root) return;
  createRoot(root).render(
    <StrictMode>
      <I18nProvider meta={meta}>{node}</I18nProvider>
    </StrictMode>,
  );
}
