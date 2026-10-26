import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

export function Kontakt({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="kontakt" className="sec bg-night" aria-labelledby="kontakt-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.kontakt} />} />
        <h2 id="kontakt-title" className="t-h2" data-reveal>
          <R s={t.kontakt.title} />
        </h2>
      </div>
    </section>
  );
}
