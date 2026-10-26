import { R, plain, useI18n } from '../i18n/index.ts';
import { SECTION_IDS, anchorHref, pageHref } from '../lib/nav.ts';
import { fmtDate } from '../i18n/format.ts';
import { Logo } from './Logo.tsx';
import { LanguageSwitch } from './LanguageSwitch.tsx';

export function Footer({ onHome = true }: { onHome?: boolean }) {
  const { t, lang } = useI18n();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-row">
          <a href={onHome ? '#top' : pageHref('home', lang)} aria-label={plain(t.a11y.home, lang)}>
            <Logo />
          </a>
          <nav aria-label={t.a11y.footerNav}>
            <ul className="footer-links">
              {SECTION_IDS.map((id) => (
                <li key={id}>
                  <a href={anchorHref(id, lang, onHome)} className="t-label">
                    <R s={t.nav[id]} />
                  </a>
                </li>
              ))}
              <li>
                <a href={anchorHref('kontakt', lang, onHome)} className="t-label">
                  {t.nav.kontakt}
                </a>
              </li>
            </ul>
          </nav>
          <LanguageSwitch />
        </div>
        <div className="footer-meta t-small dim">
          <span>
            <R s={t.footer.copyright} v={{ year: String(new Date(__BUILD_DATE__).getUTCFullYear()) }} />
          </span>
          <a href={pageHref('impressum', lang)} className="link">
            {t.nav.impressum}
          </a>
          <a href={pageHref('datenschutz', lang)} className="link">
            {t.nav.datenschutz}
          </a>
          <span className="footer-note">{t.footnote}</span>
        </div>
        <p className="footer-rev dim">
          <R s={t.footer.rev} v={{ date: fmtDate(__BUILD_DATE__, lang), sha: __GIT_SHA__ }} />
        </p>
      </div>
    </footer>
  );
}
