import type { CompData } from '../../data/cabinet/components.ts';
import type { CompText } from '../../data/cabinet/text.de.ts';
import { R } from '../../i18n/index.ts';
import { Tag } from '../ui/Tag.tsx';
import { useQVars } from '../ui/QV.tsx';

/** Spec rows of one component: localized label/value templates + data quantities + epistemic tag. */
export function SpecRows({ comp, text }: { comp: CompData; text: CompText }) {
  const vars = useQVars();
  return (
    <dl className="cab-specs">
      {comp.specs.map((s) => {
        const tpl = text.specs[s.id];
        if (!tpl) return null;
        const v = vars(s.q);
        return (
          <div key={s.id} className="spec-row" data-spec={s.id}>
            <dt>{s.lbl ?? <R s={tpl[0]} v={v} />}</dt>
            <dd>
              {tpl[1] ? (
                <span>
                  <R s={tpl[1]} v={v} />
                </span>
              ) : null}
              {s.tag ? <Tag k={s.tag} /> : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
