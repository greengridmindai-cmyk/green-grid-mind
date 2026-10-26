import { LANGUAGES, type Lang } from '../config.ts';
import { useI18n } from '../i18n/index.ts';
import { Segmented } from './ui/Segmented.tsx';

/** Names of the languages, always in their own language. */
const OWN_NAME: Record<Lang, string> = { de: 'Deutsch', en: 'English', ru: 'Русский' };

export function LanguageSwitch({ size = 'md', className = '' }: { size?: 'md' | 'lg'; className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <Segmented<Lang>
      label={t.a11y.langGroup}
      value={lang}
      onChange={setLang}
      size={size}
      className={`lang-switch ${className}`}
      options={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase(), lang: l, ariaLabel: OWN_NAME[l] }))}
    />
  );
}
