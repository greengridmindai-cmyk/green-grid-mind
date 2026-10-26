import { useRef, useState } from 'react';
import { R, plain, useI18n } from '../i18n/index.ts';
import { SECTION_IDS, anchorHref, pageHref } from '../lib/nav.ts';
import { useScrolled } from '../hooks/useScrolled.ts';
import { useActiveSection } from '../hooks/useActiveSection.ts';
import { Logo } from './Logo.tsx';
import { LanguageSwitch } from './LanguageSwitch.tsx';
import { ButtonLink } from './ui/Button.tsx';
import { MobileMenu } from './MobileMenu.tsx';

export function Header({ onHome = true }: { onHome?: boolean }) {
  const { t, lang } = useI18n();
  const scrolled = useScrolled(24);
  const active = useActiveSection(onHome ? SECTION_IDS : []);
  const [open, setOpen] = useState(false);
  const burger = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  return (
    <>
      <header ref={headerRef} className={`site-header ${scrolled || open ? 'is-solid' : ''}`}>
        <div className="wrap header-row">
          <a
            href={onHome ? '#top' : pageHref('home', lang)}
            className="brand"
            aria-label={plain(t.a11y.home, lang)}
          >
            <Logo />
          </a>
          <nav aria-label={t.a11y.mainNav} className="header-nav">
            <ul>
              {SECTION_IDS.map((id) => (
                <li key={id}>
                  <a
                    href={anchorHref(id, lang, onHome)}
                    className="t-label nav-link"
                    aria-current={active === id ? 'true' : undefined}
                  >
                    <R s={t.nav[id]} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            <LanguageSwitch />
            <ButtonLink href={anchorHref('standort-check', lang, onHome)} size="sm" className="header-cta">
              {t.nav.cta}
            </ButtonLink>
            <button
              ref={burger}
              type="button"
              className="burger"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.a11y.menuClose : t.a11y.menuOpen}
              onClick={() => setOpen((o) => !o)}
            >
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} burger={burger} header={headerRef} onHome={onHome} />
    </>
  );
}
