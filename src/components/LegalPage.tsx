import { CONTACT_EMAIL } from '../config.ts';
import { REV } from '../data/node.ts';
import { fmtDate } from '../i18n/format.ts';
import { R, plain, useI18n } from '../i18n/index.ts';
import { legalDe, legalEn, legalRu, type LegalDict } from '../i18n/legal.ts';
import { Header } from './Header.tsx';
import { Footer } from './Footer.tsx';
import type { Lang } from '../config.ts';
import { hasPlaceholder } from '../lib/placeholder.ts';

export const LEGAL: Record<Lang, LegalDict> = { de: legalDe, en: legalEn, ru: legalRu };

/** Impressum / Datenschutz: same header and footer, single 62ch column (§5.10). */
export function LegalPage({ page }: { page: 'impressum' | 'datenschutz' }) {
  const { t, lang } = useI18n();
  const l = LEGAL[lang];
  const doc = l[page];
  // banner stays until every placeholder in the binding German text and the contact address are filled in
  const hasTodo = hasPlaceholder(legalDe[page]) || hasPlaceholder(CONTACT_EMAIL);
  const v = { email: CONTACT_EMAIL, date: fmtDate(REV.date, lang) };
  return (
    <>
      <a className="skip" href="#main">
        {t.a11y.skip}
      </a>
      <Header onHome={false} />
      <main id="main" className="legal wrap">
        {hasTodo ? (
          <p className="legal-banner t-small" role="note">
            {l.banner}
          </p>
        ) : null}
        {l.courtesy ? <p className="legal-courtesy t-small muted">{l.courtesy}</p> : null}
        <h1 className="t-h2">{doc.title}</h1>
        {doc.sections.map((s) => (
          <section key={s.h} className="legal-sec">
            <h2 className="t-h3">{s.h}</h2>
            {s.p.map((p) => (
              <p key={p} className="t-body">
                <R s={p} v={v} />
              </p>
            ))}
          </section>
        ))}
        <p className="t-small dim">{plain(l.updated, lang, v)}</p>
      </main>
      <Footer onHome={false} />
    </>
  );
}
