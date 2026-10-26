import { useT } from '../../i18n/index.ts';

export function Hero() {
  const t = useT();
  return (
    <section id="top" className="hero">
      <div className="wrap hero-content">
        <p className="bracket">{t.hero.label}</p>
        <h1 className="t-display">{t.hero.h1}</h1>
      </div>
    </section>
  );
}
