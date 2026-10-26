import { CONTACT_EMAIL } from '../../config.ts';
import { useT } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';
import { ContactForm } from '../ContactForm.tsx';

export function Kontakt({ index }: { index: number }) {
  const t = useT();
  return (
    <section id="kontakt" className="sec bg-night-2" aria-labelledby="kontakt-title">
      <div className="wrap">
        <SectionHead index={index} label={t.nav.kontakt} />
        <div className="grid12 kontakt-grid">
          <div className="kontakt-intro" data-reveal>
            <h2 id="kontakt-title" className="t-h2">
              {t.kontakt.title}
            </h2>
            <p className="t-lede">{t.kontakt.lede}</p>
            <p className="kontakt-mail">
              <span className="t-label muted">{t.kontakt.email}</span>
              <a className="link mono-link" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
          <div className="kontakt-form" data-reveal>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
