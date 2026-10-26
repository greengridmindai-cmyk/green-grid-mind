import { useMemo } from 'react';
import { DAY, farm, flex, pv } from '../../data/dayCurve.ts';
import { R, useI18n } from '../../i18n/index.ts';
import { fmtNum } from '../../i18n/format.ts';

const W = 800;
const H = 340;
const PAD = { l: 16, r: 16, t: 24, b: 40 };
const iw = W - PAD.l - PAD.r;
const ih = H - PAD.t - PAD.b;
const X = (h: number) => PAD.l + (h / 24) * iw;
const Yv = (v: number) => PAD.t + ih - (v / 1.08) * ih;
const HOURS = Array.from({ length: 97 }, (_, i) => i / 4);

const line = (f: (h: number) => number) =>
  HOURS.map((h, i) => `${i ? 'L' : 'M'}${X(h).toFixed(1)},${Yv(f(h)).toFixed(1)}`).join('');

/** Schematic 24 h curve (§5.2 B): PV, farm load, node base band and flexible band under the surplus. */
export function DayCurve() {
  const { t, lang } = useI18n();
  const d = t.prinzip.day;
  const paths = useMemo(() => {
    const flexTop = HOURS.map(
      (h, i) => `${i ? 'L' : 'M'}${X(h).toFixed(1)},${Yv(farm(h) + flex(h)).toFixed(1)}`,
    ).join('');
    const farmBack = [...HOURS]
      .reverse()
      .map((h) => `L${X(h).toFixed(1)},${Yv(farm(h)).toFixed(1)}`)
      .join('');
    return { pv: line(pv), farm: line(farm), flex: `${flexTop}${farmBack}Z` };
  }, []);
  const pct = (v: number) => fmtNum(Math.round(v * 100), lang);
  return (
    <figure className="chart daycurve" data-reveal>
      <figcaption className="chart-head">
        <span className="t-h3">{d.title}</span>
        <span className="t-label muted">{d.meta}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" aria-hidden="true">
        {[0, 6, 12, 18, 24].map((h) => (
          <g key={h}>
            <line className="grid" x1={X(h)} x2={X(h)} y1={PAD.t} y2={PAD.t + ih} />
            <text
              className="tick"
              x={X(h)}
              y={H - 14}
              textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}
            >
              {`${String(h).padStart(2, '0')}:00`}
            </text>
          </g>
        ))}
        <line className="axis" x1={PAD.l} x2={PAD.l + iw} y1={PAD.t + ih} y2={PAD.t + ih} />
        <rect
          className="dc-base"
          x={X(0)}
          y={Yv(DAY.nodeBase)}
          width={iw}
          height={Yv(0) - Yv(DAY.nodeBase)}
        />
        <path className="dc-flex" d={paths.flex} />
        <path className="dc-farm" d={paths.farm} />
        <path className="dc-pv" d={paths.pv} />
      </svg>
      <ul className="chart-legend t-small">
        <li>
          <i className="lg-pv" aria-hidden="true" />
          <span>
            <R s={d.legend.pv} />
          </span>
        </li>
        <li>
          <i className="lg-farm" aria-hidden="true" />
          {d.legend.farm}
        </li>
        <li>
          <i className="lg-base" aria-hidden="true" />
          {d.legend.base}
        </li>
        <li>
          <i className="lg-flex" aria-hidden="true" />
          {d.legend.flex}
        </li>
      </ul>
      <p className="t-small muted chart-caption">
        <span className="axis-title">{d.axis}</span>
        {' · '}
        {d.caption}
      </p>
      <table className="sr-only">
        <caption>{t.a11y.chartTable}</caption>
        <thead>
          <tr>
            <th scope="col">{d.cols.hour}</th>
            <th scope="col">
              <R s={d.cols.pv} />
            </th>
            <th scope="col">{d.cols.farm}</th>
            <th scope="col">{d.cols.base}</th>
            <th scope="col">{d.cols.flex}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 13 }, (_, i) => i * 2).map((h) => (
            <tr key={h}>
              <th scope="row">{`${String(h).padStart(2, '0')}:00`}</th>
              <td>{pct(pv(h))}</td>
              <td>{pct(farm(h))}</td>
              <td>{pct(DAY.nodeBase)}</td>
              <td>{pct(flex(h))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
