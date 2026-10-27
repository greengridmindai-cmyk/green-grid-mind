import { useEffect, useRef, type ReactNode } from 'react';
import { CONFIGS, type ConfigKey, type TagKey } from '../../data/node.ts';
import { R, useI18n } from '../../i18n/index.ts';
import { Tag } from '../ui/Tag.tsx';
import { CABINET } from './i18n/localize.ts';
import { ModTag, ModText } from './ModText.tsx';
import { useNode, type DetailId } from './NodeContext.tsx';

const TAGS: TagKey[] = ['ok', 'est', 'model', 'asm', 'norm', 'spec', 'open'];
const ROW_CFG: Record<ConfigKey, number> = { M: 2, L: 3, P0: 4 };

/** Reference tables below the 3D stage — every row comes from cabinetData.js (localized). */
export function Node3dDetails({ config }: { config: ConfigKey }) {
  const { t } = useI18n();
  const m = t.modell;
  const { detail } = useNode();
  const refs = useRef<Partial<Record<DetailId, HTMLDetailsElement | null>>>({});
  const C = CABINET;

  useEffect(() => {
    if (!detail) return;
    const el = refs.current[detail.id];
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ block: 'start' });
  }, [detail]);

  const group = (id: DetailId, body: ReactNode) => (
    <details
      key={id}
      id={id === 'open' ? 'offene-punkte' : `modell-${id}`}
      className="n3d-details"
      ref={(el) => {
        refs.current[id] = el;
      }}
    >
      <summary className="t-label">
        <span>
          <R s={m.details[id]} />
        </span>
      </summary>
      <div className="n3d-details-body">{body}</div>
    </details>
  );
  const table = (head: ReactNode[], rows: ReactNode[][], cls = '') => (
    <div className="scroll-x">
      <table className={`ref-table ${cls}`}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="n3d-details-wrap">
      {group(
        'components',
        table(
          [m.compHead.comp, m.compHead.fn, m.compHead.status],
          C.components.map((c) => [
            <span key="n">
              <span className="mono">{c.n}</span>
              {' · '}
              {c.name}
            </span>,
            <span key="f" className="muted">
              <ModText s={c.fs} />
            </span>,
            <ModTag key="s" code={c.st} />,
          ]),
        ),
      )}
      {group(
        'principle',
        <>
          <div className="n3d-principle">
            {C.text.principles.map(([title, body]) => (
              <div key={title}>
                <h4 className="t-h3">{title}</h4>
                <p className="t-body muted">
                  <ModText s={body} />
                </p>
              </div>
            ))}
          </div>
          <h4 className="t-label muted">{m.roomTitle}</h4>
          <ul className="ref-list">
            {C.text.room.map((r) => (
              <li key={r}>
                <ModText s={r} />
              </li>
            ))}
          </ul>
        </>,
      )}
      {group(
        'rack',
        <div className="scroll-x">
          <table className="ref-table tnum">
            <thead>
              <tr>
                <th scope="col">{m.rackHead.u}</th>
                <th scope="col">{m.rackHead.block}</th>
                {CONFIGS.map((k) => (
                  <th key={k} scope="col" className={k === config ? 'is-active' : ''}>
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {C.rackLayout.map((row) => (
                <tr key={row[0]}>
                  <td className="mono">{row[0]}</td>
                  <td>{row[1]}</td>
                  {CONFIGS.map((k) => (
                    <td key={k} className={`mono ${k === config ? 'is-active' : ''}`}>
                      {row[ROW_CFG[k]]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )}
      {group(
        'configs',
        <div className="scroll-x">
          <table className="ref-table tnum">
            <thead>
              <tr>
                <th scope="col" />
                {CONFIGS.map((k) => (
                  <th key={k} scope="col" className={k === config ? 'is-active' : ''}>
                    {C.configs[k].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {C.configs.M.rows.map(([label], i) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {CONFIGS.map((k) => {
                    const row = C.configs[k].rows[i];
                    return (
                      <td key={k} className={k === config ? 'is-active' : ''}>
                        {row && row[0] !== label ? <span className="muted">{`${row[0]}: `}</span> : null}
                        <ModText s={row?.[1] ?? '—'} />
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <th scope="row">{m.configNote}</th>
                {CONFIGS.map((k) => (
                  <td key={k} className={k === config ? 'is-active' : ''}>
                    <ModText s={C.configs[k].note} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>,
      )}
      {group(
        'conn',
        table(
          [m.connHead.type, m.connHead.path, m.connHead.medium, m.connHead.param, m.connHead.status],
          C.connections.map(([type, path, medium, param, st]) => [
            type,
            path,
            <ModText key="m" s={medium} />,
            <ModText key="p" s={param} />,
            <ModTag key="s" code={st} />,
          ]),
        ),
      )}
      {group(
        'fire',
        <>
          <h4 className="t-label muted">{m.fireLayers}</h4>
          <div className="n3d-principle">
            {C.text.fireLayers.map(([title, body]) => (
              <div key={title}>
                <h5 className="t-h3">{title}</h5>
                <p className="t-small muted">
                  <ModText s={body} />
                </p>
              </div>
            ))}
          </div>
          <h4 className="t-label muted">{m.fireMatrix}</h4>
          {table(
            [m.fireHead, ...C.fireMatrix.cols],
            C.fireMatrix.rows.map((r) => r.map((c, i) => <ModText key={i} s={c} />)),
          )}
        </>,
      )}
      {group(
        'open',
        table(
          [m.openHead.q, m.openHead.why, m.openHead.who],
          C.openItems.map(([q, why, who]) => [
            <span key="q">
              <Tag k="open" /> <ModText s={q} />
            </span>,
            <ModText key="w" s={why} />,
            who,
          ]),
        ),
      )}
      {group(
        'review',
        table(
          [m.reviewHead.sev, m.reviewHead.what, m.reviewHead.found, m.reviewHead.fixed],
          C.review.map((r) => r.map((c, i) => <ModText key={i} s={c} />)),
        ),
      )}
      {group(
        'legend',
        <>
          <dl className="tag-legend">
            {TAGS.map((k) => (
              <div key={k}>
                <dt>
                  <Tag k={k} />
                </dt>
                <dd className="muted">{t.tagHelp[k]}</dd>
              </div>
            ))}
          </dl>
          <p className="t-small muted">{t.footnote}</p>
          <p className="t-small muted">
            {C.text.stamp.map(([k, v]) => `${k} ${v}`).join(' · ')}
            {' · '}
            {C.revision.basis}
          </p>
          <h4 className="t-label muted">{m.sources}</h4>
          <ul className="ref-list sources">
            {C.text.sources.map(([label, url]) => (
              <li key={url}>
                <a className="link" href={url} target="_blank" rel="noopener noreferrer">
                  <span>{label}</span> <span className="sr-only">{t.a11y.newTab}</span>
                  <span aria-hidden="true">{'↗'}</span>
                </a>
              </li>
            ))}
          </ul>
        </>,
      )}
    </div>
  );
}
