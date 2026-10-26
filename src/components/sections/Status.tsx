import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';

export function Status({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="status" className="sec bg-night" aria-labelledby="status-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.status} />} />
        <h2 id="status-title" className="t-h2" data-reveal>
          <R s={t.status.title} />
        </h2>
      </div>
    </section>
  );
}
