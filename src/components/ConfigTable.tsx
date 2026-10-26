import { CONFIGS, CONFIG_ROWS, type Cell, type ConfigKey } from '../data/node.ts';
import { R, useT } from '../i18n/index.ts';
import { Tag } from './ui/Tag.tsx';
import { useFmt, useQVars } from './ui/QV.tsx';

/** Configuration comparison table (§5.3, §14.1) — sticky first column, scrolls in its own container. */
export function ConfigTable({ active, id }: { active?: ConfigKey; id?: string }) {
  const t = useT();
  const fmt = useFmt();
  const vars = useQVars();
  const c = t.knoten.configs;
  const cell = (x: Cell) => ('text' in x ? <R s={c.cells[x.text]} v={vars(x.q)} /> : fmt(x.q));
  return (
    <figure className="cfg-table-wrap" id={id}>
      <div className="scroll-x cfg-scroll">
        <table className="cfg-table tnum">
          <thead>
            <tr>
              <th scope="col" className="t-label">
                {c.param}
              </th>
              {CONFIGS.map((k) => (
                <th key={k} scope="col" className={`t-label ${active === k ? 'is-active' : ''}`}>
                  <R s={c.names[k]} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONFIG_ROWS.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <R s={c.rows[row.id]} />
                  {row.tag ? (
                    <>
                      {' '}
                      <Tag k={row.tag} />
                    </>
                  ) : null}
                </th>
                {row.merged ? (
                  <td colSpan={3}>
                    <R s={c.cells[row.merged.text]} v={vars(row.merged.q)} />
                  </td>
                ) : (
                  CONFIGS.map((k) => (
                    <td key={k} className={active === k ? 'is-active' : ''}>
                      {row.cells ? cell(row.cells[k]) : null}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="t-small muted">
        <R s={c.caption} />
      </figcaption>
    </figure>
  );
}
