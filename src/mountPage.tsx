import { StrictMode, startTransition, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import { I18nProvider, type PageMeta } from './i18n/index.ts';

export function mountPage(node: ReactNode, meta?: PageMeta) {
  const root = document.getElementById('root');
  if (!root) return;
  // a transition lets React yield to the browser while rendering the page (no long main-thread tasks)
  startTransition(() => {
    createRoot(root).render(
      <StrictMode>
        <I18nProvider meta={meta}>{node}</I18nProvider>
      </StrictMode>,
    );
  });
}
