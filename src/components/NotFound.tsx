import { useI18n } from '../i18n/index.ts';
import { pageHref } from '../lib/nav.ts';
import { Header } from './Header.tsx';
import { Footer } from './Footer.tsx';
import { ButtonLink } from './ui/Button.tsx';

export function NotFound() {
  const { t, lang } = useI18n();
  return (
    <>
      <Header onHome={false} />
      <main id="main" className="legal wrap">
        <p className="t-label muted">{'404'}</p>
        <h1 className="t-h2">{t.notFound.title}</h1>
        <p className="t-lede">{t.notFound.body}</p>
        <ButtonLink href={pageHref('home', lang)}>{t.notFound.back}</ButtonLink>
      </main>
      <Footer onHome={false} />
    </>
  );
}
