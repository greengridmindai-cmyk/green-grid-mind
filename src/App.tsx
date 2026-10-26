import { useT } from './i18n/index.ts';
import { useHashAliases } from './hooks/useHashAliases.ts';
import { useReveal } from './hooks/useReveal.ts';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { Hero } from './components/sections/Hero.tsx';
import { Prinzip } from './components/sections/Prinzip.tsx';
import { Knoten } from './components/sections/Knoten.tsx';
import { Modell } from './components/sections/Modell.tsx';
import { Hoefe } from './components/sections/Hoefe.tsx';
import { Unternehmen } from './components/sections/Unternehmen.tsx';
import { Status } from './components/sections/Status.tsx';
import { Kontakt } from './components/sections/Kontakt.tsx';
import { CabinetProvider } from './components/cabinet/CabinetContext.tsx';

/** Main page: section composition only. */
export function App() {
  const t = useT();
  useHashAliases();
  useReveal();
  return (
    <CabinetProvider>
      <a className="skip" href="#main">
        {t.a11y.skip}
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Prinzip index={1} />
        <Knoten index={2} />
        <Modell index={3} />
        <Hoefe index={4} />
        <Unternehmen index={5} />
        <Status index={6} />
        <Kontakt index={7} />
      </main>
      <Footer />
    </CabinetProvider>
  );
}
