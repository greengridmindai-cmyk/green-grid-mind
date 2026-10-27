// Loads every translation source (Node ≥ 22.18 strips TypeScript types natively).
export async function loadSources() {
  const { de } = await import('../src/i18n/de.ts');
  const { en } = await import('../src/i18n/en.ts');
  const { ru } = await import('../src/i18n/ru.ts');
  const sets = [
    { name: 'dict', de, en, ru },
  ];
  try {
    const l = await import('../src/i18n/legal.ts');
    sets.push({ name: 'legal', de: l.legalDe, en: l.legalEn, ru: l.legalRu });
  } catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
  }
  const { TERMS, SAME_IN_ALL_LANGS } = await import('../src/i18n/terms.ts');
  return { sets, TERMS, SAME_IN_ALL_LANGS };
}

/** Flattens an object/array tree into [path, string] pairs. */
export function flatten(obj, prefix = '') {
  const out = [];
  if (typeof obj === 'string') return [[prefix, obj]];
  if (Array.isArray(obj))
    obj.forEach((v, i) => out.push(...flatten(v, prefix ? `${prefix}.${i}` : String(i))));
  else if (obj && typeof obj === 'object')
    for (const [k, v] of Object.entries(obj)) out.push(...flatten(v, prefix ? `${prefix}.${k}` : k));
  return out;
}
