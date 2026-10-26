import {
  COMPONENTS,
  COMP_BY_ID,
  isAvailable,
  type CompId,
  type GroupKey,
} from '../../data/cabinet/components.ts';
import type { ConfigKey } from '../../data/node.ts';
import { R, plain, useI18n } from '../../i18n/index.ts';
import { useCabText } from './text.ts';
import { SpecRows } from './SpecRows.tsx';

interface Props {
  config: ConfigKey;
  selected: CompId | null;
  onSelect: (id: CompId | null) => void;
}

/** Selected component (aria-live) — rendered beside the stage on desktop, as a bottom sheet on phones. */
export function CompCard({ selected, onSelect }: Omit<Props, 'config'>) {
  const { t } = useI18n();
  const ct = useCabText();
  const comp = selected ? COMP_BY_ID[selected] : null;
  const text = selected ? ct.comp[selected] : null;
  return (
    <div className="cab-card" aria-live="polite">
      {comp && text ? (
        <article className="cab-card-inner" data-comp={comp.id}>
          <div className="cab-card-head">
            <span className="t-label muted">
              <R s={ct.groups[comp.g]} />
            </span>
            <button type="button" className="cab-close t-label" onClick={() => onSelect(null)}>
              {t.modell.panel.close}
            </button>
          </div>
          <h3 className="t-h3 cab-card-title">
            <span className="cab-num tnum">{comp.n}</span>
            <span>
              <R s={text.name} />
            </span>
          </h3>
          <p className="cab-f">
            <R s={text.f} />
          </p>
          <SpecRows comp={comp} text={text} />
          <h4 className="t-label muted cab-links-title">{t.modell.panel.links}</h4>
          <ul className="cab-links">
            {text.links.map((l) => (
              <li key={l}>
                <R s={l} />
              </li>
            ))}
          </ul>
        </article>
      ) : (
        <p className="muted t-small cab-empty">{t.modell.panel.empty}</p>
      )}
    </div>
  );
}

/** Keyboard-reachable list of every component (tab order) — calls select(id). */
export function CompList({ config, selected, onSelect }: Props) {
  const { t, lang } = useI18n();
  const ct = useCabText();
  const groups = [...new Set(COMPONENTS.map((c) => c.g))] as GroupKey[];
  return (
    <nav className="cab-list" aria-label={t.modell.panel.components}>
      <h3 className="t-label muted">{t.modell.panel.components}</h3>
      {groups.map((g) => (
        <div key={g} className="cab-group">
          <p className="t-label dim cab-group-title">
            <R s={ct.groups[g]} />
          </p>
          <ul>
            {COMPONENTS.filter((c) => c.g === g && isAvailable(c.id, config)).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  data-id={c.id}
                  aria-current={selected === c.id ? 'true' : undefined}
                  aria-label={`${c.n}. ${plain(ct.comp[c.id].name, lang)}`}
                  onClick={() => onSelect(c.id)}
                >
                  <span className="cab-num-sm tnum">{c.n}</span>
                  <span>
                    <R s={ct.comp[c.id].name} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
