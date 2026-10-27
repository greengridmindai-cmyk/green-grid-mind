import type { Lang } from '../config.ts';

/**
 * Terms that are never translated (§7.4). Translation strings reference them as `{KEY}`;
 * `scripts/check-i18n.mjs` fails if a term text appears as plain text in a translation string.
 * `src` is the language of the original term (for the `lang` attribute).
 * USV/UPS/ИБП is the only localised abbreviation (national standard abbreviation).
 */
export interface TermDef {
  text: string | Record<Lang, string>;
  src: 'de' | 'en';
}

export const TERMS = {
  /* abbreviations / tech */
  EMS: { text: 'EMS', src: 'en' },
  GPU: { text: 'GPU', src: 'en' },
  CPU: { text: 'CPU', src: 'en' },
  IT: { text: 'IT', src: 'en' },
  PV: { text: 'PV', src: 'de' },
  kWp: { text: 'kWp', src: 'de' },
  USV: { text: { de: 'USV', en: 'UPS', ru: 'ИБП' }, src: 'de' },
  LCP: { text: 'LCP', src: 'en' },
  PDU: { text: 'PDU', src: 'en' },
  BMC: { text: 'BMC', src: 'en' },
  OOB: { text: 'OOB', src: 'en' },
  ToR: { text: 'ToR', src: 'en' },
  MID: { text: 'MID', src: 'de' },
  RCD: { text: 'RCD', src: 'en' },
  RCM: { text: 'RCM', src: 'en' },
  SPD: { text: 'SPD', src: 'en' },
  VLAN: { text: 'VLAN', src: 'en' },
  OT: { text: 'OT', src: 'en' },
  SNMPv3: { text: 'SNMPv3', src: 'en' },
  SNMP: { text: 'SNMP', src: 'en' },
  ModbusTCP: { text: 'Modbus TCP', src: 'en' },
  Modbus: { text: 'Modbus', src: 'en' },
  MQTT: { text: 'MQTT', src: 'en' },
  Redfish: { text: 'Redfish', src: 'en' },
  WireGuard: { text: 'WireGuard', src: 'en' },
  TLS: { text: 'TLS', src: 'en' },
  NVMe: { text: 'NVMe', src: 'en' },
  DDR5: { text: 'DDR5', src: 'en' },
  HDD: { text: 'HDD', src: 'en' },
  GbE: { text: 'GbE', src: 'en' },
  U42: { text: '42U', src: 'en' },
  inch19: { text: '19"', src: 'en' },
  C13C19: { text: 'C19 / C13', src: 'en' },
  C19C20: { text: 'C19/C20', src: 'en' },
  CEE: { text: 'CEE', src: 'en' },
  RS485: { text: 'RS-485', src: 'en' },
  NYYJ: { text: 'NYY-J', src: 'de' },
  VRLA: { text: 'VRLA', src: 'en' },
  ECO: { text: 'ECO', src: 'en' },
  DGX: { text: 'DGX A100', src: 'en' },
  NvidiaSmi: { text: 'nvidia-smi', src: 'en' },
  RTXPRO: { text: 'RTX PRO 6000 BSE', src: 'en' },
  RTXPROlong: { text: 'RTX PRO 6000 Blackwell Server Edition', src: 'en' },
  R290: { text: 'R290', src: 'en' },
  R32: { text: 'R32', src: 'en' },
  DN: { text: 'DN', src: 'de' },
  P_IT: { text: 'P_IT', src: 'en' },
  P_node: { text: 'P_node', src: 'en' },
  P_cool: { text: 'P_cool', src: 'en' },
  L_W: { text: 'L_W', src: 'en' },
  PVGIS: { text: 'PVGIS', src: 'en' },
  IP: { text: 'IP', src: 'en' },
  KMU: { text: 'KMU', src: 'de' },
  Pb: { text: 'Pb', src: 'en' },
  Cu: { text: 'Cu', src: 'en' },
  TN_C: { text: 'TN-C', src: 'de' },
  PEN: { text: 'PEN', src: 'de' },
  PE: { text: 'PE', src: 'de' },

  /* German regulatory / grid terms */
  Hausanschluss: { text: 'Hausanschluss', src: 'de' },
  NSHV: { text: 'NSHV', src: 'de' },
  Zaehlerschrank: { text: 'Zählerschrank', src: 'de' },
  NAP: { text: 'NAP', src: 'de' },
  MSB: { text: 'MSB', src: 'de' },
  Installateur: { text: 'eingetragener Installateur', src: 'de' },
  NH00: { text: 'NH00', src: 'de' },
  NH: { text: 'NH', src: 'de' },
  gG: { text: 'gG', src: 'de' },
  Lasttrenner: { text: 'NH00-Lasttrennschalter', src: 'de' },
  TALaerm: { text: 'TA Lärm', src: 'de' },
  VDE: { text: 'VDE', src: 'de' },
  VDE0100: { text: 'DIN VDE 0100-410/-540', src: 'de' },
  DINEN378: { text: 'DIN EN 378', src: 'de' },
  IEC61439: { text: 'IEC 61439', src: 'en' },
  MLAR: { text: 'MLAR', src: 'de' },
  EnWG14a: { text: '§14a EnWG', src: 'de' },
  NotAus: { text: 'Not-Aus', src: 'de' },
  Steuerbox: { text: 'Steuerbox §14a', src: 'de' },
  Typ2: { text: 'Typ 2', src: 'de' },
  Typ12: { text: 'Typ 1+2', src: 'de' },
  TypB: { text: 'Typ B', src: 'de' },

  /* products and names */
  GGMname: { text: 'Green Grid Mind', src: 'en' },
  GGM: { text: 'GGM', src: 'en' },
  GGMNode: { text: 'GGM-Node', src: 'en' },
  NodeM: { text: 'Node M', src: 'en' },
  NodeL: { text: 'Node L', src: 'en' },
  P0: { text: 'P0', src: 'en' },
  Rittal: { text: 'Rittal', src: 'de' },
  RittalVX: { text: 'Rittal VX IT', src: 'de' },
  RittalLCP: { text: 'Rittal 3311.260', src: 'de' },
  RittalDET: { text: 'Rittal DET-AC', src: 'de' },
  Eaton: { text: 'Eaton 93PX 20 kVA RT9U', src: 'en' },
  WAGO: { text: 'WAGO CC100', src: 'de' },
  Janitza: { text: 'Janitza UMG 96-PA', src: 'de' },
  Dell: { text: 'Dell XE7745', src: 'en' },
  HPE: { text: 'HPE DL380a Gen12', src: 'en' },
  NVIDIA: { text: 'NVIDIA', src: 'en' },
  Vertiv: { text: 'Vertiv/Knürr', src: 'en' },
  Stulz: { text: 'Stulz', src: 'de' },
  SchaeferIT: { text: 'Schäfer IT', src: 'de' },
} satisfies Record<string, TermDef>;

export type TermKey = keyof typeof TERMS;

export function termText(key: TermKey, lang: Lang): string {
  const t: TermDef = TERMS[key];
  return typeof t.text === 'string' ? t.text : t.text[lang];
}

export function isTermKey(k: string): k is TermKey {
  return Object.prototype.hasOwnProperty.call(TERMS, k);
}

/**
 * Translation keys (dot paths, `*` matches one segment) whose EN/RU value may equal the German one,
 * e.g. product names or codes that are identical in every language.
 */
export const SAME_IN_ALL_LANGS: string[] = [
  // main dictionary: page name, codes and cognates
  'nav.impressum',
  'nav.status',
  'revMeta',
  'footer.rev',
  'prinzip.decisions.heat.label',
  'knoten.configs.param',
  'modell.views.rack',
  'modell.views.system',
  'modell.connHead.status',
  'modell.compHead.status',
  'hoefe.steps.4',
  'check.optional',
  'check.states.bw',
  'form.roles.investor',
  'form.name',
  'form.org',
  // legal pages: page name
  'impressum.title',
  'datenschutz.sections.1.h',
];
