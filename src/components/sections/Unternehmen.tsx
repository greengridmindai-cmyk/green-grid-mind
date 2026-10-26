import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

export function Unternehmen({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="unternehmen" className="sec bg-night" aria-labelledby="unternehmen-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.unternehmen} />} />
        <h2 id="unternehmen-title" className="t-h2" data-reveal>
          <R s={t.unternehmen.title} />
        </h2>
      </div>
    </section>
  );
}
