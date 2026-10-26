import { TERMS, termText, type TermKey } from './terms.ts';
import { useLang } from './context.ts';

/** Renders a never-translated term, protected from browser auto-translation. */
export function Term({ id }: { id: TermKey }) {
  const lang = useLang();
  return (
    <span translate="no" lang={TERMS[id].src}>
      {termText(id, lang)}
    </span>
  );
}
