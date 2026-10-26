import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

export function Knoten({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="knoten" className="sec bg-night" aria-labelledby="knoten-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.knoten} />} />
        <h2 id="knoten-title" className="t-h2" data-reveal>
          <R s={t.knoten.title} />
        </h2>
      </div>
    </section>
  );
}
