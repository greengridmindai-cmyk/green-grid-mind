import { R, useT } from '../../i18n/index.ts';
import { requestContact } from '../../lib/contactBus.ts';
import { SectionHead } from '../SectionHead.tsx';
import { ButtonLink } from '../ui/Button.tsx';

export function Unternehmen({ index }: { index: number }) {
  const t = useT();
  const u = t.unternehmen;
  return (
    <section id="unternehmen" className="paper-2 sec" aria-labelledby="unternehmen-title">
      <div className="wrap">
        <SectionHead index={index} label={t.nav.unternehmen} />
        <div className="sec-intro" data-reveal>
          <h2 id="unternehmen-title" className="t-h2">
            {u.title}
          </h2>
          <p className="t-lede">
            <R s={u.lede} />
          </p>
        </div>
        <div className="offers">
          <article className="offer" data-reveal>
            <p className="t-label muted">{u.agents.label}</p>
            <h3 className="t-h3">{u.agents.title}</h3>
            <p className="t-body muted">{u.agents.body}</p>
          </article>
          <article className="offer" data-reveal>
            <p className="t-label muted">{u.batch.label}</p>
            <h3 className="t-h3">{u.batch.title}</h3>
            <p className="t-body muted">{u.batch.body}</p>
            <ul className="offer-list">
              {u.batch.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className="offer-foot" data-reveal>
          <p className="t-small muted">{u.note}</p>
          <ButtonLink
            href="#kontakt"
            onClick={(e) => {
              e.preventDefault();
              requestContact({ role: 'company' });
            }}
          >
            {u.cta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
