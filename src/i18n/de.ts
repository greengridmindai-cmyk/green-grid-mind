/** German master dictionary. `en.ts` and `ru.ts` must satisfy `Dict` (compile error on missing keys). */
export const de = {
  meta: {
    title: '{GGMname} — {GPU}-Knoten für Höfe mit Photovoltaik',
    description:
      '{GGMname} installiert {GPU}-Rechenknoten in bestehenden Hofgebäuden mit {PV} in Bayern und Baden-Württemberg. Der Knoten folgt dem Solarüberschuss und bringt dem Hof eine feste Vergütung.',
    ogLocale: 'de_DE',
  },
  a11y: {
    skip: 'Zum Inhalt',
    langGroup: 'Sprache',
    langAnnounce: 'Sprache: Deutsch',
  },
};

export type Dict = typeof de;
