import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

export function Modell({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="modell" className="sec bg-night" aria-labelledby="modell-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.modell} />} />
        <h2 id="modell-title" className="t-h2" data-reveal>
          <R s={t.modell.title} />
        </h2>
      </div>
    </section>
  );
}
