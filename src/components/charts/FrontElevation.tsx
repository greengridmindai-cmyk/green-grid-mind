import { memo } from 'react';
import type { ConfigKey } from '../../data/node.ts';
import { ROW } from '../../data/node.ts';

/**
 * Front elevation of the GGM-Node row — port of the legacy "рисунок ряда спереди" drawing
 * (1 unit = 1 mm, y downwards from the top of the 2 000 mm row) as a line drawing.
 * `drawing`: ink strokes, dimension lines and section names. `hero`: hairlines only, no labels.
 */
interface Props {
  config: ConfigKey;
  variant?: 'drawing' | 'hero';
  /** dimension and section labels (already localized and formatted) */
  labels?: {
    total: string;
    ecab: string;
    rack: string;
    lcp: string;
    s800: string;
    s300: string;
    height: string;
  };
  className?: string;
  title?: string;
}

const H = ROW.height;
const Y = (mm: number) => H - mm;
/** rack unit → mm from the floor (legacy: U0 = 100 mm plinth, 1U = 44.45 mm) */
const uy = (u: number) => 100 + (u - 1) * 44.45;

function Unit({ u, n, cls }: { u: number; n: number; cls: string }) {
  return <rect className={cls} x={960} y={Y(uy(u + n)) + 3} width={480} height={n * 44.45 - 6} />;
}

function Brick({ u, gpus }: { u: number; gpus: number }) {
  const top = Y(uy(u + 4));
  return (
    <g>
      <Unit u={u} n={4} cls="fe-unit" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          className={i < gpus ? 'fe-gpu' : 'fe-gpu-empty'}
          x={1020 + i * 50}
          y={top + 28}
          width={30}
          height={4 * 44.45 - 56}
        />
      ))}
    </g>
  );
}

function FrontElevationImpl({ config, variant = 'drawing', labels, className = '', title }: Props) {
  const hero = variant === 'hero';
  const gpus1 = config === 'P0' ? 4 : 8;
  const gpus2 = config === 'M' ? 4 : 8;
  const [ecab, rack, lcp] = ROW.sections;
  const x1 = ecab.w;
  const x2 = ecab.w + rack.w;
  const x3 = x2 + lcp.w;
  const vb = hero ? `-20 -20 ${x3 + 40} ${H + 40}` : `-260 -40 ${x3 + 300} ${H + 360}`;
  return (
    <svg
      viewBox={vb}
      className={`fe ${hero ? 'fe-hero' : 'fe-drawing'} ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* bodies + plinths */}
      {[
        [0, x1],
        [x1, x2],
        [x2, x3],
      ].map(([a = 0, b = 0]) => (
        <g key={a}>
          <rect className="fe-body" x={a + 4} y={0} width={b - a - 8} height={H} />
          <line className="fe-thin" x1={a + 4} x2={b - 4} y1={Y(100)} y2={Y(100)} />
        </g>
      ))}
      {/* energy cabinet: door, vents, display, Not-Aus, handle */}
      <rect className="fe-thin" x={30} y={36} width={740} height={1846} />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <line className="fe-thin" x1={150} x2={650} y1={96 + i * 22} y2={96 + i * 22} />
          <line className="fe-thin" x1={150} x2={650} y1={1644 + i * 22} y2={1644 + i * 22} />
        </g>
      ))}
      <rect className="fe-thin" x={520} y={330} width={180} height={96} />
      <rect className="fe-line" x={592} y={500} width={110} height={110} />
      <circle className="fe-line" cx={647} cy={555} r={36} />
      <line className="fe-line" x1={70} x2={70} y1={860} y2={1100} />
      {/* IT rack: door, interior */}
      <rect className="fe-thin" x={830} y={36} width={740} height={1846} />
      <rect className="fe-thin" x={950} y={Y(1975)} width={500} height={1975 - 95} />
      <Brick u={1} gpus={gpus1} />
      {config !== 'P0' ? <Brick u={5} gpus={gpus2} /> : null}
      {config !== 'P0' ? <Unit u={9} n={2} cls="fe-unit" /> : null}
      {config === 'P0' ? [11, 14, 17].map((u) => <Unit key={u} u={u} n={3} cls="fe-unit fe-load" />) : null}
      {Array.from({ length: 26 }, (_, i) => i + 11)
        .filter((u) => config !== 'P0' || u > 19)
        .map((u) => (
          <Unit key={u} u={u} n={1} cls="fe-blank" />
        ))}
      {config === 'P0' ? [5, 6, 7, 8, 9, 10].map((u) => <Unit key={u} u={u} n={1} cls="fe-blank" />) : null}
      {[37, 38, 39].map((u) => (
        <Unit key={u} u={u} n={1} cls="fe-unit" />
      ))}
      <Unit u={40} n={2} cls="fe-unit" />
      <Unit u={42} n={1} cls="fe-unit fe-fire" />
      <line className="fe-line" x1={1537} x2={1537} y1={860} y2={1100} />
      {/* LCP: fans behind the perforated door */}
      <rect className="fe-thin" x={1626} y={36} width={248} height={1846} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle className="fe-line" cx={1750} cy={Y(380 + i * 400)} r={104} />
          <circle className="fe-thin" cx={1750} cy={Y(380 + i * 400)} r={30} />
        </g>
      ))}
      {!hero && labels ? (
        <g className="fe-dims">
          <path
            d={`M0 ${H + 110}H${x3}M0 ${H + 80}V${H + 140}M${x1} ${H + 80}V${H + 140}M${x2} ${H + 80}V${H + 140}M${x3} ${H + 80}V${H + 140}`}
          />
          <path d={`M0 ${H + 230}H${x3}M0 ${H + 200}V${H + 260}M${x3} ${H + 200}V${H + 260}`} />
          <path d={`M-90 0V${H}M-120 0H-60M-120 ${H}H-60`} />
          <text x={x1 / 2} y={H + 90} textAnchor="middle">
            {labels.s800}
          </text>
          <text x={(x1 + x2) / 2} y={H + 90} textAnchor="middle">
            {labels.s800}
          </text>
          <text x={(x2 + x3) / 2} y={H + 90} textAnchor="middle">
            {labels.s300}
          </text>
          <text x={x3 / 2} y={H + 210} textAnchor="middle" className="fe-strong">
            {labels.total}
          </text>
          <text
            x={-110}
            y={H / 2}
            textAnchor="middle"
            transform={`rotate(-90 -110 ${H / 2})`}
            className="fe-strong"
          >
            {labels.height}
          </text>
          <text x={x1 / 2} y={H + 320} textAnchor="middle" className="fe-name">
            {labels.ecab}
          </text>
          <text x={(x1 + x2) / 2} y={H + 320} textAnchor="middle" className="fe-name">
            {labels.rack}
          </text>
          <text x={(x2 + x3) / 2} y={H + 320} textAnchor="middle" className="fe-name">
            {labels.lcp}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export const FrontElevation = memo(FrontElevationImpl);
