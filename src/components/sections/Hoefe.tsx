import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

export function Hoefe({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="hoefe" className="sec bg-night" aria-labelledby="hoefe-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.hoefe} />} />
        <h2 id="hoefe-title" className="t-h2" data-reveal>
          <R s={t.hoefe.title} />
        </h2>
      </div>
    </section>
  );
}
