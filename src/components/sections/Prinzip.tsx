import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

export function Prinzip({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="prinzip" className="sec bg-night" aria-labelledby="prinzip-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.prinzip} />} />
        <h2 id="prinzip-title" className="t-h2" data-reveal>
          <R s={t.prinzip.title} />
        </h2>
      </div>
    </section>
  );
}
