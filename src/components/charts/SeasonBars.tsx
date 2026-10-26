import { useState, type CSSProperties } from 'react';
import { SEASON, SEASON_MODEL } from '../../data/seasonality.ts';
import { R, useI18n } from '../../i18n/index.ts';
import { fmtQ, localeOf, n } from '../../i18n/format.ts';
import { Tag } from '../ui/Tag.tsx';

const W = 800;
const H = 320;
const PAD = { l: 8, r: 8, t: 36, b: 36 };
const iw = W - PAD.l - PAD.r;
const ih = H - PAD.t - PAD.b;
const MAX = 120;
const Yp = (p: number) => PAD.t + ih - (p / MAX) * ih;
const step = iw / 12;

/** Monthly share of the flexible-layer target covered by farm PV (§5.2 C, §14.3). */
export function SeasonBars() {
  const { t, lang } = useI18n();
  const s = t.prinzip.season;
  const [hover, setHover] = useState<number | null>(null);
  const monthFmt = new Intl.DateTimeFormat(localeOf(lang), { month: 'short', timeZone: 'UTC' });
  const monthLong = new Intl.DateTimeFormat(localeOf(lang), { month: 'long', timeZone: 'UTC' });
  const month = (m: number, long = false) => (long ? monthLong : monthFmt).format(new Date(Date.UTC(2026, m - 1, 1)));
  const pctQ = (p: number) => fmtQ(n(p, '%'), lang);
  const gpuh = (v: number) => fmtQ(n(v, 'GPU·h'), lang);
  const active = hover !== null ? SEASON[hover] : null;
  return (
    <figure className="chart season" data-reveal>
      <figcaption className="chart-head">
        <span className="t-h3">{s.title}</span>
        <span className="t-label muted">
          {s.meta} <Tag k="est" />
        </span>
      </figcaption>
      <div className="season-plot">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="group" aria-label={s.axis}>
          <line className="ref" x1={PAD.l} x2={W - PAD.r} y1={Yp(100)} y2={Yp(100)} />
          <text className="tick" x={W - PAD.r} y={Yp(100) - 8} textAnchor="end">
            {pctQ(100)}
          </text>
          <line className="axis" x1={PAD.l} x2={W - PAD.r} y1={Yp(0)} y2={Yp(0)} />
          {SEASON.map((m, i) => {
            const x = PAD.l + i * step + step * 0.18;
            const w = step * 0.64;
            const label = `${month(m.month, true)} · ${pctQ(m.pct)} · ${gpuh(m.gpuh)}`;
            return (
              <g
                key={m.month}
                className={`bar ${hover === i ? 'is-hover' : ''}`}
                tabIndex={0}
                role="img"
                aria-label={label}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <rect className="hit" x={PAD.l + i * step} y={PAD.t} width={step} height={ih} />
                <rect className="b" x={x} y={Yp(m.pct)} width={w} height={Yp(0) - Yp(m.pct)} style={{ '--i': i } as CSSProperties} />
                <text className="val" x={x + w / 2} y={Yp(m.pct) - 8} textAnchor="middle">
                  {fmtQ(n(m.pct), lang)}
                </text>
                <text className="tick" x={x + w / 2} y={H - 12} textAnchor="middle">
                  {month(m.month)}
                </text>
              </g>
            );
          })}
        </svg>
        <p className={`season-tip t-label ${active ? 'is-on' : ''}`} aria-hidden="true">
          {active ? `${month(active.month, true)} · ${pctQ(active.pct)} · ${gpuh(active.gpuh)}` : ' '}
        </p>
      </div>
      <p className="t-small muted chart-caption">
        <R
          s={s.caption}
          v={{
            kwp: fmtQ(n(SEASON_MODEL.kwp, 'kWp'), lang),
            prio: pctQ(SEASON_MODEL.farmPriority),
          }}
        />{' '}
        <R s={s.target} v={{ target: gpuh(SEASON_MODEL.target) }} />
      </p>
      <p className="t-body season-after">{s.after}</p>
      <table className="sr-only">
        <caption>{t.a11y.chartTable}</caption>
        <thead>
          <tr>
            <th scope="col">{s.cols.month}</th>
            <th scope="col">{s.cols.pct}</th>
            <th scope="col">
              <R s={s.cols.gpuh} />
            </th>
          </tr>
        </thead>
        <tbody>
          {SEASON.map((m) => (
            <tr key={m.month}>
              <th scope="row">{month(m.month, true)}</th>
              <td>{pctQ(m.pct)}</td>
              <td>{gpuh(m.gpuh)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
