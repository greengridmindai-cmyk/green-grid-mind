import { useEffect, useRef, type ReactNode } from 'react';
import { CONNECTIONS } from '../../data/cabinet/connections.ts';
import { RACK_LAYOUT, SOURCES } from '../../data/cabinet/rackLayout.ts';
import { CONFIGS, type ConfigKey, type TagKey } from '../../data/node.ts';
import { R, useI18n } from '../../i18n/index.ts';
import { Tag } from '../ui/Tag.tsx';
import { useQVars } from '../ui/QV.tsx';
import { ConfigTable } from '../ConfigTable.tsx';
import { useCabinet, type DetailId } from './CabinetContext.tsx';
import { useCabText } from './text.ts';

const TAGS: TagKey[] = ['ok', 'est', 'asm', 'spec', 'open'];

/** Collapsible reference groups below the 3D stage (§5.4). */
export function CabinetDetails({ config }: { config: ConfigKey }) {
  const { t } = useI18n();
  const ct = useCabText();
  const vars = useQVars();
  const { detail } = useCabinet();
  const refs = useRef<Partial<Record<DetailId, HTMLDetailsElement | null>>>({});

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
      className="cab-details"
      ref={(el) => {
        refs.current[id] = el;
      }}
    >
      <summary className="t-label">
        <R s={t.modell.details[id]} />
      </summary>
      <div className="cab-details-body">{body}</div>
    </details>
  );

  const mark = (v: 'y' | 'n' | number) =>
    typeof v === 'number' ? (
      <R s={ct.rack.gpu} v={{ q: String(v) }} />
    ) : v === 'y' ? (
      <>
        <span aria-hidden="true">●</span>
        <span className="sr-only">{t.modell.installed}</span>
      </>
    ) : (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t.modell.notInstalled}</span>
      </>
    );

  return (
    <div className="cab-details-wrap">
      {group(
        'principle',
        <div className="cab-principle">
          {ct.principle.map((p) => (
            <div key={p.title}>
              <h4 className="t-h3">{p.title}</h4>
              <p className="t-body muted">
                <R s={p.body} />
              </p>
            </div>
          ))}
        </div>,
      )}
      {group(
        'rack',
        <>
          <p className="t-body muted">{ct.rack.lead}</p>
          <div className="scroll-x">
            <table className="ref-table tnum">
              <thead>
                <tr>
                  <th scope="col">{t.modell.rackHead.u}</th>
                  <th scope="col">{t.modell.rackHead.block}</th>
                  {CONFIGS.map((k) => (
                    <th key={k} scope="col" className={k === config ? 'is-active' : ''}>
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RACK_LAYOUT.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.u ? (row.u[0] === row.u[1] ? row.u[0] : `${row.u[0]}–${row.u[1]}`) : ct.rack.zeroU}</td>
                    <td>
                      <R s={ct.rack.rows[row.id]} />
                    </td>
                    {CONFIGS.map((k) => (
                      <td key={k} className={`mono ${k === config ? 'is-active' : ''}`}>
                        {mark(row.cells[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>,
      )}
      {group('configs', <ConfigTable active={config} />)}
      {group(
        'conn',
        <div className="scroll-x">
          <table className="ref-table">
            <thead>
              <tr>
                <th scope="col">{t.modell.connHead.type}</th>
                <th scope="col">{t.modell.connHead.path}</th>
                <th scope="col">{t.modell.connHead.medium}</th>
                <th scope="col">{t.modell.connHead.param}</th>
                <th scope="col">{t.modell.connHead.status}</th>
              </tr>
            </thead>
            <tbody>
              {CONNECTIONS.map((c) => {
                const row = ct.conn.rows[c.id];
                const v = vars(c.q);
                return (
                  <tr key={c.id}>
                    <td>{ct.conn.types[c.type]}</td>
                    {row?.map((cell, i) => (
                      <td key={i} className={i > 0 ? 'mono-ish' : ''}>
                        <R s={cell} v={v} />
                      </td>
                    ))}
                    <td>
                      <Tag k={c.tag} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>,
      )}
      {group(
        'room',
        <ul className="ref-list">
          {ct.room.map((r) => (
            <li key={r}>
              <R s={r} />
            </li>
          ))}
        </ul>,
      )}
      {group(
        'open',
        <ul className="ref-list">
          {ct.open.map((o) => (
            <li key={o}>
              <Tag k="open" /> <R s={o} />
            </li>
          ))}
        </ul>,
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
          <h4 className="t-label muted">{t.modell.sources}</h4>
          <ul className="ref-list sources">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <a className="link" href={s.url} target="_blank" rel="noopener noreferrer">
                  <span translate="no">{s.label ?? ''}</span>
                  {s.label ? null : <R s={ct.sources.emulator} />} <span className="sr-only">{t.a11y.newTab}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </>,
      )}
    </div>
  );
}
