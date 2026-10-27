import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { REV } from '../../data/node.ts';
import { fmtDate } from '../../i18n/format.ts';
import { R, plain, useI18n } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

const SiteViewer = lazy(() => import('../node3d/SiteViewer.tsx'));
const POSTER = `${import.meta.env.BASE_URL}media/site-poster.webp`;
const EAGER_HASHES = ['#modell', '#cabinet', '#offene-punkte'];

function Poster() {
  const { t, lang } = useI18n();
  return (
    <div className="wrap-wide">
      <div className="n3d-stage">
        <div className="n3d-poster">
          <img
            src={POSTER}
            alt={plain(t.modell.posterAlt, lang)}
            width={1440}
            height={900}
            decoding="async"
            loading="lazy"
          />
          <p className="t-label n3d-loading">{t.modell.loading}</p>
        </div>
      </div>
    </div>
  );
}

/** 3D scene section (node3d) — the wrapper and the three.js chunk load lazily when the section is within one viewport. */
export function Modell({ index }: { index: number }) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const [load, setLoad] = useState(() => EAGER_HASHES.includes(window.location.hash));

  useEffect(() => {
    if (load) return;
    const onHash = () => EAGER_HASHES.includes(window.location.hash) && setLoad(true);
    window.addEventListener('hashchange', onHash);
    const el = ref.current;
    let io: IntersectionObserver | undefined;
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setLoad(true), {
        rootMargin: '100% 0px',
      });
      io.observe(el);
    } else setLoad(true);
    return () => {
      window.removeEventListener('hashchange', onHash);
      io?.disconnect();
    };
  }, [load]);

  return (
    <section id="modell" ref={ref} className="sec bg-night sec-modell" aria-labelledby="modell-title">
      <div className="wrap">
        <SectionHead
          index={index}
          label={t.nav.modell}
          meta={<R s={t.modell.meta} v={{ rev: REV.rev, date: fmtDate(REV.date, lang) }} />}
        />
        <div className="sec-intro" data-reveal>
          <h2 id="modell-title" className="t-h2">
            {t.modell.title}
          </h2>
          <p className="t-lede">{t.modell.lede}</p>
        </div>
      </div>
      {load ? (
        <Suspense fallback={<Poster />}>
          <SiteViewer poster={POSTER} />
        </Suspense>
      ) : (
        <Poster />
      )}
    </section>
  );
}
