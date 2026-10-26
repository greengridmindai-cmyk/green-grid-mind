import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { HERO_VIDEO } from '../../config.ts';
import { HERO_FACTS } from '../../data/node.ts';
import { R, useT } from '../../i18n/index.ts';
import { useFmt } from '../ui/QV.tsx';
import { ButtonLink } from '../ui/Button.tsx';
import { FrontElevation } from '../charts/FrontElevation.tsx';
import { useReducedMotion } from '../../hooks/useMedia.ts';

const BASE = import.meta.env.BASE_URL;

/** Hero video: never for reduced motion or Save-Data; paused while off-screen. */
function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [allowed] = useState(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return !c?.saveData;
  });
  useEffect(() => {
    const v = ref.current;
    if (!v || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [reduce, allowed]);
  if (reduce || !allowed) return <img className="hero-media" src={`${BASE}${HERO_VIDEO.poster}`} alt="" />;
  return (
    <video
      ref={ref}
      className="hero-media"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={`${BASE}${HERO_VIDEO.poster}`}
      aria-hidden="true"
    >
      <source src={`${BASE}${HERO_VIDEO.webm}`} type="video/webm" />
      <source src={`${BASE}${HERO_VIDEO.mp4}`} type="video/mp4" />
    </video>
  );
}

/** Fallback without a video file: the row in front elevation, hairlines, one slow solar sweep. */
function HeroDrawing() {
  return (
    <div className="hero-drawing" aria-hidden="true">
      <FrontElevation config="L" variant="hero" />
      <span className="hero-sweep" />
    </div>
  );
}

export function Hero() {
  const t = useT();
  const fmt = useFmt();
  const f = t.hero.facts;
  const facts = [
    { label: <R s={f.it} />, value: fmt(HERO_FACTS.itLoad) },
    {
      label: f.form,
      value: <R s={f.formValue} v={{ sections: fmt(HERO_FACTS.sections), rows: fmt(HERO_FACTS.rows) }} />,
    },
    { label: f.room, value: <R s={f.roomValue} v={{ room: fmt(HERO_FACTS.room) }} /> },
    { label: f.ctrl, value: <R s={f.ctrlValue} /> },
  ];
  return (
    <section id="top" className="hero">
      <div className="hero-bg">{__HAS_HERO_VIDEO__ ? <HeroVideo /> : <HeroDrawing />}</div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="wrap hero-grid">
        <div className="hero-content">
          <p className="bracket hero-anim" style={{ '--d': '0ms' } as CSSProperties}>
            <span aria-hidden="true">{'[ '}</span>
            {t.hero.label}
            <span aria-hidden="true">{' ]'}</span>
          </p>
          <h1 className="t-display hero-anim" style={{ '--d': '60ms' } as CSSProperties}>
            {t.hero.h1}
          </h1>
          <p className="t-lede hero-lede hero-anim" style={{ '--d': '140ms' } as CSSProperties}>
            <R s={t.hero.lede} v={{ itLoad: fmt(HERO_FACTS.itLoad) }} />
          </p>
          <div className="hero-actions hero-anim" style={{ '--d': '220ms' } as CSSProperties}>
            <ButtonLink href="#standort-check">{t.hero.primary}</ButtonLink>
            <ButtonLink href="#prinzip" variant="ghost">
              {t.hero.ghost}
            </ButtonLink>
          </div>
        </div>
        <dl className="hero-facts hero-anim" style={{ '--d': '340ms' } as CSSProperties}>
          {facts.map((x, i) => (
            <div key={i}>
              <dt className="t-label muted">{x.label}</dt>
              <dd>{x.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
