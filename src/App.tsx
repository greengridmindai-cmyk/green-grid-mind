import { useT, R } from './i18n/index.ts';

export function App() {
  const t = useT();
  return (
    <main id="main" className="wrap sec">
      <h1 className="t-display">
        <R s={t.meta.title} />
      </h1>
    </main>
  );
}
