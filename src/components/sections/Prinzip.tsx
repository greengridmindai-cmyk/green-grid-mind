import type { CSSProperties } from 'react';
import { DECISIONS } from '../../data/node.ts';
import { R, useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';
import { Tag } from '../ui/Tag.tsx';
import { useFmt } from '../ui/QV.tsx';
import { DayCurve } from '../charts/DayCurve.tsx';
import { SeasonBars } from '../charts/SeasonBars.tsx';

/** Priority cascade: PV → farm → storage → node → grid (§5.2 A). */
function Cascade() {
  const t = useT();
  const c = t.prinzip.cascade;
  return (
    <figure className="cascade" data-reveal>
      <figcaption className="t-label muted cascade-title">{c.title}</figcaption>
      <ol className="cascade-list">
        {c.items.map((item, i) => (
          <li key={i} className={i === 3 ? 'is-node' : ''}>
            <span className="cascade-n tnum" aria-hidden={i === 0}>
              {i === 0 ? '' : String(i)}
            </span>
            <span className="cascade-text">
              <R s={item} />
            </span>
            {i < c.items.length - 1 ? <span className="cascade-arrow" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
      <p className="t-body cascade-caption">{c.caption}</p>
    </figure>
  );
}

/** Five engineering decisions as a hairline rail (§5.2 D). */
function Decisions() {
  const t = useT();
  const fmt = useFmt();
  return (
    <div className="decisions">
      <h3 className="t-label muted decisions-title" data-reveal>
        {t.prinzip.decisions.title}
      </h3>
      <ul className="rail">
        {DECISIONS.map((d, i) => {
          const tx = t.prinzip.decisions[d.id];
          return (
            <li key={d.id} data-reveal style={{ '--i': Math.min(i, 4) } as CSSProperties}>
              <span className="t-label muted">{tx.label}</span>
              <span className="t-value rail-value">
                {fmt(d.value)} <Tag k={d.tag} />
              </span>
              <h4 className="t-h3">
                <R s={tx.title} />
              </h4>
              <p className="muted">
                <R s={tx.body} />
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Prinzip({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="prinzip" className="sec bg-night" aria-labelledby="prinzip-title">
      <div className="wrap">
        <SectionHead index={index} label={t.nav.prinzip} />
        <div className="sec-intro" data-reveal>
          <h2 id="prinzip-title" className="t-h2">
            {t.prinzip.title}
          </h2>
          <p className="t-lede">
            <R s={t.prinzip.lede} />
          </p>
        </div>
        <Cascade />
        <div className="prinzip-charts">
          <DayCurve />
          <SeasonBars />
        </div>
        <p className="t-body prinzip-solar" data-reveal>
          {t.prinzip.solar}
        </p>
        <Decisions />
      </div>
    </section>
  );
}
