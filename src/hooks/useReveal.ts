import { useEffect } from 'react';

/**
 * Reveal-once for every [data-reveal] element (threshold .15). Only active when motion is allowed:
 * `.js-motion` on <html> enables the hidden start state, so content is never hidden without JS.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      root.classList.remove('js-motion');
      return;
    }
    root.classList.add('js-motion');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
