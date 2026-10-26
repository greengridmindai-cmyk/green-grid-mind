import type { CSSProperties } from 'react';
import { SITE_REQS, SITE_VARS } from '../../data/node.ts';
import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';
import { useFmt } from '../ui/QV.tsx';
import { StandortCheck } from '../StandortCheck.tsx';

export function Hoefe({ index }: { index: number }) {
  const t = useT();
  const fmt = useFmt();
  const h = t.hoefe;
  const vars = Object.fromEntries(Object.entries(SITE_VARS).map(([k, q]) => [k, fmt(q)]));
  return (
    <section id="hoefe" className="paper" aria-labelledby="hoefe-title">
      <div className="sec">
        <div className="wrap">
          <SectionHead index={index} label={t.nav.hoefe} />
          <div className="sec-intro" data-reveal>
            <h2 id="hoefe-title" className="t-h2">
              {h.title}
            </h2>
            <p className="t-lede">
              <R s={h.lede} />
            </p>
          </div>
          <div className="grid12 hoefe-cols">
            <div className="hoefe-bring" data-reveal>
              <h3 className="t-label muted">{h.bring}</h3>
              <ul className="req-grid">
                {SITE_REQS.map((r, i) => (
                  <li key={r.id} style={{ '--i': i } as CSSProperties}>
                    <span className="t-value req-value">{r.value ? fmt(r.value) : h.outdoorValue}</span>
                    <span className="muted">
                      <R s={h.reqs[r.id]} v={vars} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hoefe-get" data-reveal>
              <h3 className="t-label muted">{h.get}</h3>
              <ul className="get-list">
                {h.gets.map((g) => (
                  <li key={g}>
                    <span className="get-mark" aria-hidden="true">
                      +
                    </span>
                    <span>
                      <R s={g} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="process" data-reveal>
            <h3 className="t-label muted">{h.process}</h3>
            <ol className="steps">
              {h.steps.map((s, i) => (
                <li key={s}>
                  <span className="step-n tnum">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <R s={s} />
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <div className="paper-2 check-band">
        <div className="wrap">
          <StandortCheck />
        </div>
      </div>
    </section>
  );
}
