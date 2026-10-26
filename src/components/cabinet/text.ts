import type { Lang } from '../../config.ts';
import { textDe, type CabinetText } from '../../data/cabinet/text.de.ts';
import { textEn } from '../../data/cabinet/text.en.ts';
import { textRu } from '../../data/cabinet/text.ru.ts';
import { useLang } from '../../i18n/index.ts';

const TEXTS: Record<Lang, CabinetText> = { de: textDe, en: textEn, ru: textRu };

/** Cabinet texts in the current language (bundled with the lazily loaded viewer chunk). */
export function useCabText(): CabinetText {
  return TEXTS[useLang()];
}
