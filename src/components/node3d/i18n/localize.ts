/**
 * Puts the site language into the module objects (CABINET, SITE, SEASONS) before a scene is mounted.
 * The Russian masters are captured once, untouched; German and English come from de.ts / en.ts.
 * A missing translation falls back to Russian — with a console warning in development; in production
 * `npm run check-i18n` (scripts/cabinet/check-i18n-cabinet.mjs) prevents it.
 */
import type { Lang } from '../../../config.ts';
import { CABINET } from '../cabinetData.js';
import { SITE } from '../siteData.js';
import { SEASONS } from '../energyModel.js';
import { applyText, extractText, overlay, type Node3dText } from './text.ts';
import { applyPolicy, policyMatches } from './policy.ts';
import { de } from './de.ts';
import { en } from './en.ts';

const MASTER: Node3dText = extractText(CABINET, SITE, SEASONS);
const WITHHELD = policyMatches(MASTER).rows;
const TRANSLATIONS: Partial<Record<Lang, Node3dText>> = { de, en };

let current: Lang | null = null;
let active: Node3dText = MASTER;

export function localizeModules(lang: Lang): Node3dText {
  if (current === lang) return active;
  const tr = TRANSLATIONS[lang];
  const text = tr
    ? overlay(MASTER, tr, (path) => {
        if (import.meta.env.DEV)
          console.warn(`[node3d] ${lang}: no translation for ${path.slice(1)} — Russian master shown`);
      })
    : MASTER;
  applyText(CABINET, SITE, SEASONS, MASTER, text);
  applyPolicy(CABINET, SITE, WITHHELD);
  current = lang;
  active = text;
  return text;
}

export { CABINET, SITE, SEASONS };
