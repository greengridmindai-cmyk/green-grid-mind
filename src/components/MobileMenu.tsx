import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { R, useI18n } from '../i18n/index.ts';
import { SECTION_IDS, anchorHref, pageHref } from '../lib/nav.ts';
import { useMedia } from '../hooks/useMedia.ts';
import { LanguageSwitch } from './LanguageSwitch.tsx';
import { ButtonLink } from './ui/Button.tsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  burger: RefObject<HTMLButtonElement | null>;
  header: RefObject<HTMLElement | null>;
  onHome: boolean;
}

/** Full-screen menu (<1100 px): circular clip-path reveal from the burger, focus trap, Esc closes. */
export function MobileMenu({ open, onClose, burger, header, onHome }: Props) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const wide = useMedia('(min-width: 1100px)');
  const [origin, setOrigin] = useState({ x: '100%', y: '0px' });

  useLayoutEffect(() => {
    if (!open || !burger.current) return;
    const r = burger.current.getBoundingClientRect();
    setOrigin({ x: `${r.left + r.width / 2}px`, y: `${r.top + r.height / 2}px` });
  }, [open, burger]);

  useEffect(() => {
    if (open && wide) onClose();
  }, [open, wide, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const btn = burger.current;
    const first = ref.current?.querySelector<HTMLElement>('.menu-links a');
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const inHeader = [...(header.current?.querySelectorAll<HTMLElement>('.header-actions ' + FOCUSABLE) ?? [])];
      const inMenu = [...(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
      const all = [...inHeader, ...inMenu].filter((el) => el.offsetParent !== null);
      if (!all.length) return;
      const i = all.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? all.length - 1 : i - 1) : i === all.length - 1 ? 0 : i + 1;
      e.preventDefault();
      all[next]?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      btn?.focus({ preventScroll: true });
    };
  }, [open, onClose, burger, header]);

  const close = () => onClose();

  return (
    <div
      ref={ref}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t.a11y.menu}
      className={`mobile-menu ${open ? 'is-open' : ''}`}
      style={{ '--cx': origin.x, '--cy': origin.y } as CSSProperties}
      inert={!open}
    >
      <div className="wrap mobile-menu-inner">
        <LanguageSwitch size="lg" className="menu-item" />
        <ul className="menu-links">
          {SECTION_IDS.map((id, i) => (
            <li key={id} className="menu-item" style={{ '--mi': i + 1 } as CSSProperties}>
              <a href={anchorHref(id, lang, onHome)} onClick={close}>
                <R s={t.nav[id]} />
              </a>
            </li>
          ))}
        </ul>
        <div className="menu-actions menu-item" style={{ '--mi': SECTION_IDS.length + 1 } as CSSProperties}>
          <ButtonLink href={anchorHref('standort-check', lang, onHome)} onClick={close}>
            {t.nav.cta}
          </ButtonLink>
          <ButtonLink href={anchorHref('kontakt', lang, onHome)} variant="ghost" onClick={close}>
            {t.nav.kontakt}
          </ButtonLink>
        </div>
        <div className="menu-legal menu-item t-small" style={{ '--mi': SECTION_IDS.length + 2 } as CSSProperties}>
          <a href={pageHref('impressum', lang)}>{t.nav.impressum}</a>
          <a href={pageHref('datenschutz', lang)}>{t.nav.datenschutz}</a>
        </div>
      </div>
    </div>
  );
}
