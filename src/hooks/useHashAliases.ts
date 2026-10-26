import { useEffect } from 'react';
import { LEGACY_HASH } from '../lib/nav.ts';

/** Maps legacy anchors (#cabinet …) to the new sections on load and on hashchange, then scrolls. */
export function useHashAliases() {
  useEffect(() => {
    const go = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      const target = LEGACY_HASH[h];
      if (!target) return;
      const url = new URL(window.location.href);
      url.hash = target;
      window.history.replaceState(window.history.state, '', url);
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView());
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, []);
}
