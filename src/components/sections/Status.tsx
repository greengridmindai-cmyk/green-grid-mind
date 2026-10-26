import { STATUS_STEPS } from '../../data/status.ts';
import { localeOf } from '../../i18n/format.ts';
import { fmtDate } from '../../i18n/format.ts';
import { R, useI18n } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';
import { ButtonLink } from '../ui/Button.tsx';
import { useQVars } from '../ui/QV.tsx';
import { useCabinet } from '../cabinet/CabinetContext.tsx';

export function Status({ index }: { index: number }) {
  const { t, lang } = useI18n();
  const vars = useQVars();
  const { openDetail } = useCabinet();
  const s = t.status;
  const date = (d: { iso: string; precision: 'day' | 'month' }) =>
    d.precision === 'day'
      ? fmtDate(d.iso, lang)
      : new Intl.DateTimeFormat(localeOf(lang), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
          new Date(d.iso),
        );
  return (
    <section id="status" className="sec bg-night" aria-labelledby="status-title">
      <div className="wrap">
        <SectionHead index={index} label={t.nav.status} />
        <h2 id="status-title" className="t-h2 status-h2" data-reveal>
          {s.title}
        </h2>
        <div className="grid12 status-grid">
          <ol className="timeline" data-reveal>
            {STATUS_STEPS.map((st) => (
              <li key={st.id} className={`tl-${st.state}`}>
                <span className="tl-node" aria-hidden="true" />
                <span className="sr-only">{`${s.legend[st.state]}: `}</span>
                <span className="tl-text">
                  <R s={s.steps[st.id as keyof typeof s.steps]} v={vars(st.q)} />
                  {st.date ? <span className="tl-date tnum">{` (${date(st.date)})`}</span> : null}
                </span>
              </li>
            ))}
          </ol>
          <aside className="status-aside" data-reveal>
            <ul className="tl-legend t-small muted" aria-hidden="true">
              {(['done', 'progress', 'planned'] as const).map((k) => (
                <li key={k} className={`tl-${k}`}>
                  <span className="tl-node" />
                  {s.legend[k]}
                </li>
              ))}
            </ul>
            <p className="t-lede">{s.aside}</p>
            <ButtonLink href="#offene-punkte" variant="ghost" onClick={() => openDetail('open')}>
              {s.openLink}
            </ButtonLink>
          </aside>
        </div>
      </div>
    </section>
  );
}
