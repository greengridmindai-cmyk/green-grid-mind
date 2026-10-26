/**
 * Cabinet texts — German master. `text.en.ts` / `text.ru.ts` must satisfy `CabinetText`.
 * `{q0}`, `{q1}` … interpolate quantities from ./components.ts / ./connections.ts;
 * `{KEY}` renders a never-translated term (src/i18n/terms.ts).
 */
import type { CompId, GroupKey } from './components.ts';
import type { ConnType } from './connections.ts';
import type { RackRow } from './rackLayout.ts';

export interface CompText {
  name: string;
  /** function paragraph */
  f: string;
  /** spec id → [label template, value template] */
  specs: Record<string, readonly [string, string]>;
  links: string[];
}

export interface CabinetText {
  groups: Record<GroupKey, string>;
  comp: Record<CompId, CompText>;
  conn: {
    types: Record<ConnType, string>;
    /** row id → [from → to, medium / cross-section, parameter / protocol] */
    rows: Record<string, readonly [string, string, string]>;
  };
  rack: { lead: string; rows: Record<RackRow['id'], string>; gpu: string; zeroU: string };
  principle: { title: string; body: string }[];
  room: string[];
  open: string[];
  sources: { emulator: string };
  /** text sprites inside the 3D scene */
  scene: { wall: string; outside: string; room: string; service: string };
}

export const textDe: CabinetText = {
  groups: {
    shell: 'Hülle und Kühlung',
    power: 'Elektrik, {USV}, {EMS}',
    it: '{IT}-Ausstattung',
    ext: 'Externe Anschlüsse',
  },
  comp: {
    rack: {
      name: '{IT}-Rack {inch19}, geschlossener Kreislauf',
      f: 'Trägt Server und Netzwerk. Die Türen sind geschlossen und abgedichtet, Kabel kommen über Membraneinführungen, alle freien Höheneinheiten sind mit Blenden verschlossen. Die Luft zirkuliert nur zwischen Rack und {LCP}.',
      specs: {
        class: ['Klasse', '{RittalVX} {q0}'],
        height: ['Höhe', '{U42}, {inch19} ({q0})'],
        depth: ['Tiefe {q0}', 'Server {q1} + Kabel'],
        ip: ['Schutzart des geschlossenen Systems', ''],
      },
      links: ['{LCP} (2) — Luft', '{PDU} A/B ← {USV}', 'Kabeltrasse oben'],
    },
    lcp: {
      name: '{LCP} Rack CW — Luft/Wasser-Wärmetauscher',
      f: 'Saugt die warme Luft aus dem hinteren Bereich des Racks an, kühlt sie am Wasserregister und führt sie vorne wieder zu. Regelt Lüfter und Wasserdurchfluss nach der Zulufttemperatur der Server.',
      specs: {
        ref: ['Referenz', '{RittalLCP}, {q0}'],
        power: ['Leistung', '{q0} ({q2} Lüfter), bis {q1}'],
        water: ['Wasser Vorlauf', '{q0}, {DN} {q1}'],
        air: ['Luft', '{q0}, Masse {q1}'],
        size: ['Baugröße für {q0}', 'kleiner / Alternativen'],
      },
      links: [
        'Vorlauf/Rücklauf ← Chiller (3)',
        'Versorgung 400 V ← Verteiler (7)',
        '{SNMP}/{Modbus} → {EMS} (8)',
      ],
    },
    chiller: {
      name: 'Außen-Chiller mit Freikühlung',
      f: 'Kühlt das Glykolgemisch auf 15 °C. Bei kalter Witterung arbeitet nur der eingebaute Trockenkühler, der Verdichter steht. Das Kältemittel befindet sich nur in diesem Gerät.',
      specs: {
        refrigerant: ['Kältemittel', '{R290} oder {R32}'],
        capacity: ['Kälteleistung', '{q0} bei {q1}'],
        freecool: ['Freikühlung', 'T_außen < {q0}, {q1} der Stunden'],
        hydro: ['Hydraulikmodul', 'Pumpe, Ausdehnungsgefäß, Filter'],
        glycol: ['Glykol', '{q0}, bis {q1}…{q2}'],
        noise: ['Schallleistung {L_W} für {TALaerm}', ''],
      },
      links: ['Leitungen → {LCP} (2)', 'Versorgung 400 V ← Verteiler (7)', '{Modbus} → {EMS} (8)'],
    },
    pipes: {
      name: 'Vorlauf- und Rücklaufleitung',
      f: 'Glykol mit 15 °C fließt zum {LCP}, mit ca. 21 °C zurück zum Chiller. Die Leitungen liegen am Boden unterhalb der {IT} in einer Wanne mit Leckagesensor. Über der Technik verläuft kein Wasser.',
      specs: {
        size: ['Nennweite', '{DN} {q0}'],
        flow: ['Durchfluss', '{q0} bei ΔT {q1} und {q2}'],
        insulation: ['Dämmung', 'diffusionsdicht (Taupunkt)'],
        wall: ['Wanddurchführung', 'Hülse + Brandschutzabschottung ({MLAR})'],
        fittings: ['Armaturen', 'Absperrhähne, Filter, Entlüfter, flexible Anschlüsse zum {LCP}'],
      },
      links: ['Chiller (3) ↔ {LCP} (2)', 'Option: Wärmetauscher für Abwärme (5)'],
    },
    hrx: {
      name: 'Option: Abwärmenutzung',
      f: 'Ein Plattenwärmetauscher im Rücklauf gibt Wärme mit 20–25 °C an einen Kreis des Hofes ab. Diese Temperatur eignet sich nur als Quelle für eine Wärmepumpe. Die Kühlung der {IT} hat Vorrang: Die Wärmeauskopplung wird zuerst abgeschaltet.',
      specs: {
        heat: ['Wärme', '{q0} kontinuierlich'],
        status: ['Status', 'Option, nicht im Basisumfang'],
      },
      links: ['Rücklauf (4)', 'Wärmepumpe / Pufferspeicher des Hofes'],
    },
    ecab: {
      name: 'Energieschrank E/{USV}',
      f: 'Separater, belüfteter Schrank außerhalb des geschlossenen Kreislaufs. Oben Verteiler {GGM} und {EMS}, unten die {USV}. Bleibatterien geben Wasserstoff ab und gehören deshalb nicht in das dichte {IT}-Rack.',
      specs: {
        size: ['Abmessungen', '{q0}'],
        vent: ['Belüftung', 'Gitter unten und oben'],
        losses: ['Verluste in den Raum', '{q0}'],
      },
      links: ['Zuleitung ← {NSHV} (19)', '→ {PDU}, {LCP}, Chiller'],
    },
    board: {
      name: 'Verteiler {GGM} ({IEC61439})',
      f: 'Einspeisung, Schutz und Verteilung des Knotens. Misst die gesamte Knotenleistung {P_node} und getrennt die Kälteleistung {P_cool}: Das {EMS} begrenzt {P_node}.',
      specs: {
        input: ['Einspeisung', '{Lasttrenner}, {gG} {q0} (M) / {q1} (L)'],
        spd: ['Überspannung', '{SPD} {Typ2} ({Typ12} bei Blitzschutz)'],
        leak: ['Fehlerstrom', '{RCD} {TypB} / {RCM} {q0} (Brandschutz)'],
        groups: ['Abgänge', '{USV} · {LCP} · Chiller · {EMS} · Service · Reserve {q0}'],
        metering: ['Messung', '{MID}-Unterzähler {P_node} + Unterzähler {P_cool}'],
        details: ['Details', 'einpoliges Schema — Schritt 2'],
      },
      links: ['← Zuleitung 5 × 25 mm²', '→ {USV}, {LCP}, Chiller, {EMS}'],
    },
    ems: {
      name: '{EMS}-Controller und {OT}-Knoten',
      f: 'Setzt {EMS} Rev 2.0 um: Begrenzung von {P_node}, Nachführung am {PV}-Überschuss, Abschaltung auf null auf Abruf, Leistungsreduktion bei Übertemperatur. Ein Hardware-Watchdog öffnet das Freigaberelais der {IT}, wenn der Controller hängt.',
      specs: {
        ctrl: ['Controller', '{WAGO} (laut Planung)'],
        parts: ['Bestandteile', '{OT}-Switch, {q0}-Netzteil, Freigaberelais {IT} (Öffner)'],
        proto: ['Protokolle', '{ModbusTCP} · {SNMPv3} · {Redfish} · potenzialfreie Kontakte'],
        shed: ['Abschaltung auf null', '{q0}'],
      },
      links: ['S1 am {NAP} (19)', '{PDU}, {USV}, Server, {LCP}, Chiller', 'Cloud über Firewall'],
    },
    ups: {
      name: 'Online-{USV} 20 kVA',
      f: 'Die {USV} überbrückt Spannungseinbrüche im ländlichen Netz und gibt den Servern Zeit für einen Checkpoint und ein geordnetes Herunterfahren. Für Inselbetrieb ist sie nicht ausgelegt. Eine Baugröße für M und L.',
      specs: {
        class: ['Klasse', '{Eaton}'],
        size: ['Abmessungen / Masse', '{q0}, {q1}'],
        autonomy: ['Überbrückungszeit', '{q0} bei {q1}, {q2} bei {q3}'],
        scheme: ['Schaltung', 'Doppelwandler, {ECO} aus, Service-Bypass'],
        batteries: ['Batterien', '{Pb} ({VRLA}) — Projektentscheidung für die Piloten'],
      },
      links: ['← Verteiler (7)', '→ {PDU} A und B (11)', '{SNMP} → {EMS}'],
    },
    notaus: {
      name: '{NotAus}',
      f: 'Fest verdrahteter Kreis, unabhängig vom {EMS} und von Software. Schaltet {IT}-Abgänge und Kühlung ab, Rücksetzen nur von Hand. Der Taster sitzt am Eingang des Raums.',
      specs: { test: ['Prüfung', 'Test T9 bei der Abnahme'] },
      links: ['→ Einspeiseschalter / Auslöser des Verteilers (7)'],
    },
    pdu: {
      name: '{PDU} A und {PDU} B',
      f: 'Verteilen die Leistung der {USV} auf die Server. Jeder Server hängt an beiden {PDU}, der Ausfall einer {PDU} stoppt den Knoten nicht. Messen den Strom je Phase und Steckplatz und schalten Steckplätze aus der Ferne.',
      specs: {
        type: ['Typ', 'dreiphasig {q0}, 3 × {q1} ({q2})'],
        sockets: ['Steckplätze', '{C13C19}'],
        mgmt: ['Steuerung', '{SNMPv3}, Messung + Schaltung'],
      },
      links: ['← {USV} (9)', '→ Server-Netzteile'],
    },
    brick1: {
      name: '{GPU}-Brick #1 (4U)',
      f: 'Haupt-Recheneinheit. Die Leistung liegt etwa bei einem {DGX} (6,5 kW), daher gilt die Logik von {EMS} Rev 2.0 für jedes Brick; die Kalibrierung muss am realen Server wiederholt werden.',
      specs: {
        gpu: ['{GPU}', '{q0} × {RTXPRO}, {q1}, bis {q2}'],
        platform: ['Plattform', 'Klasse {Dell} / {HPE}'],
        cpuram: ['{CPU} / RAM', '{q0} {CPU}, {q1} {DDR5}'],
        power: ['Leistung', '{q0}'],
        depth: ['Tiefe', '{q0}'],
        cap: ['Leistungsbegrenzung', '{Redfish}/{BMC} + {NvidiaSmi}'],
      },
      links: ['← {PDU} A und B', '→ {ToR} 25/100 {GbE}', '→ {OOB} ({BMC})'],
    },
    brick2: {
      name: '{GPU}-Brick #2 (4U)',
      f: 'Bestimmt die Klasse des Knotens. In M halb bestückt, in L voll, im Prototyp {P0} nicht eingebaut. Umstieg M → L: vier {GPU} nachrüsten, Rack und Kabel bleiben.',
      specs: {
        m: ['', '{q0} {GPU}, Begrenzung {q1}/{GPU}'],
        l: ['', '{q0} {GPU}, {q1}/{GPU}'],
        p0: ['', 'nicht eingebaut'],
      },
      links: ['wie Brick #1'],
    },
    cpu: {
      name: '{CPU}/Storage-Knoten (2U)',
      f: 'Steuerknoten des Clusters, Speicher für Modelle und Checkpoints, {CPU}-Aufgaben (Monte-Carlo). Das {HDD}-Regal mit 216 TB aus der früheren Konfiguration entfällt.',
      specs: {
        comp: ['Ausstattung', '{q0} Sockel, {q1}, {q2} {NVMe}'],
        power: ['Leistung', '{q0}'],
      },
      links: ['← {PDU} A und B', '↔ {ToR}'],
    },
    loadbank: {
      name: 'Lastmodule (nur {P0})',
      f: 'Gemietete Server-Emulatoren erzeugen die Wärme und den Strom der fehlenden {GPU}. So durchläuft der Prototyp den vollen Test mit 15 kW (Wärme, Elektrik, {EMS}-Tests T1–T10, L1–L8, E1–E8), ohne 16 {GPU} zu kaufen.',
      specs: {
        comp: ['Ausstattung', '{q0} × 3U à {q1}'],
        form: ['Form', 'Miete für die Testphase'],
      },
      links: ['← {PDU} A und B'],
    },
    net: {
      name: 'Netzwerk',
      f: 'Die Firewall trennt den Knoten vom Internet. Der {ToR}-Switch verbindet die Server untereinander. Ein separates {OOB}-Managementnetz ({BMC}, {PDU}, {USV}, {LCP}, Sensoren) bleibt erreichbar, auch wenn die Kundendaten isoliert sind.',
      specs: {
        firewall: ['Firewall', '1U, nur ausgehende Verbindungen'],
        tor: ['{ToR}', '25/100 {GbE}, 1U'],
        oob: ['{OOB}', '1 {GbE}, 1U'],
        patch: ['Patch', 'Patchfeld und Kabelführung'],
      },
      links: ['← Datenanbindung (22)', '→ Server, {EMS}'],
    },
    fire: {
      name: 'Branderkennung und Löschung im Rack (1U)',
      f: 'Ein Ansaugrauchmelder entnimmt Luft aus dem Kreislauf und erkennt Schwelbrände vor einem offenen Feuer. Die Löschflasche löscht direkt im Rack, Volumen ca. 2–2,5 m³. Alarm an das {EMS}: {IT} = 0, Meldung an die Cloud.',
      specs: {
        class: ['Produktklasse', 'z. B. {RittalDET}'],
        agent: ['Löschmittel', 'mit dem Versicherer abstimmen'],
      },
      links: ['→ {EMS} (8), potenzialfreier Kontakt', '→ Cloud'],
    },
    sensors: {
      name: 'Sensoren',
      f: 'Unabhängig von den Sensoren des {LCP}. Liefern dem {EMS} die Zulufttemperatur der Server für die thermische Leistungsreduktion: ab 32 °C Reduktion, bei 40 °C Abschaltung.',
      specs: {
        tin: ['T/H Zuluft', '{q0} Höhen vorne'],
        tout: ['T Abluft', '{q0} Punkte hinten'],
        other: ['Weitere', 'Türkontakte, Leckagesensor unter {LCP} und Leitungen'],
      },
      links: ['→ {EMS} (8)'],
    },
    nshv: {
      name: '{NSHV} / {Zaehlerschrank} des Hofes + Analysator S1',
      f: 'Die Zuleitung des Knotens wird hinter dem Abrechnungszähler angeschlossen. Der Analysator am {NAP} sieht den Netzaustausch des Standorts; danach führt das {EMS} den Knoten am {PV}-Überschuss und hält die Anschlussgrenze ein.',
      specs: {
        analyzer: ['Analysator', '{Janitza} + Stromwandler, {q0}'],
        works: ['Arbeiten im {Zaehlerschrank}', 'nur {Installateur} / {MSB}'],
      },
      links: ['→ Zuleitung (20)', 'S1 → {EMS}, {ModbusTCP}'],
    },
    feeder: {
      name: 'Zuleitung',
      f: 'Querschnitt mit Reserve: Thermisch würden 10 mm² genügen. 25 mm² erlauben den Umstieg von M auf L ohne neues Kabel und senken die Verluste.',
      specs: {
        cable: ['Kabel', '{q0} × {q1} {Cu} {NYYJ}, {q2}'],
        drop: ['Spannungsfall', '{q0} bei {q1}'],
        protection: ['Absicherung', '{NH} {q0}/{q1} {gG}'],
      },
      links: ['{NSHV} (19) → Verteiler (7)'],
    },
    tray: {
      name: 'Kabeltrasse',
      f: 'Verläuft über der Reihe. Leistungs- und Datenleitungen sind durch einen Trennsteg getrennt. Wasserleitungen werden nicht in der Trasse geführt.',
      specs: { sep: ['Trennung', 'Leistung / Daten'] },
      links: ['{NSHV}, Wand, Schränke'],
    },
    uplink: {
      name: 'Datenanbindung',
      f: 'Glasfaser oder 5G. Nur ausgehende Verbindungen ({WireGuard}, {MQTT}/{TLS}). Die Sicherheit hängt nicht von der Verbindung ab: Leistungsbegrenzung und Abschaltung arbeiten lokal.',
      specs: { upload: ['Upload-Bandbreite des Standorts', 'wichtig für datenintensive Aufträge'] },
      links: ['→ Firewall (16)'],
    },
    pe: {
      name: 'Potenzialausgleich',
      f: '{PE}-Schiene im Energieschrank. Schränke, {LCP}, Leitungen, Trasse und Schirme werden mit der Haupterdungsschiene des Gebäudes verbunden. Im {TN_C}-System wird der {PEN} vor dem Anschlusspunkt aufgeteilt.',
      specs: { norm: ['Norm', '{VDE0100}'] },
      links: ['→ Haupterdungsschiene des Gebäudes'],
    },
  },
  conn: {
    types: { power: 'Leistung', data: 'Daten', safety: 'Sicherheit', water: 'Wasser', air: 'Luft' },
    rows: {
      feed: [
        '{NSHV} des Hofes → Verteiler {GGM}',
        '{q0} × {q1} {Cu} {NYYJ}, {q2}',
        '{q3} 3~, {NH} {q4}/{q5} {gG}',
      ],
      upsIn: ['Verteiler → {USV}-Eingang', '{q0} × {q1} {Cu}', '{q2} 3~'],
      upsOut: ['{USV}-Ausgang → {PDU} A, {PDU} B', '{q0} × {q1} / {CEE} {q2}', '{q3} 3~, {q2} je {PDU}'],
      psu: ['{PDU} → Server-Netzteile', '{C19C20}, je {q0} Pfade A/B', '{q1}'],
      lcp: ['Verteiler → {LCP}', 'eigener Abgang', '{q0} 1~ oder {q1} 3~, Messung {P_cool}'],
      chiller: ['Verteiler → Chiller (durch die Wand)', 'eigener Abgang', '{q0} 3~, Messung {P_cool}'],
      ems: ['Verteiler → {EMS}, Sensoren', 'B10 → {q0} DC', '—'],
      s1: ['Analysator S1 ({NAP}) → {EMS}', 'Ethernet, {VLAN} {OT}', '{ModbusTCP}, {q0}'],
      bmc: ['{EMS} → Server ({BMC})', '{OOB} {q0} {GbE}', '{Redfish}, ereignisgesteuert'],
      pduUps: ['{EMS} ↔ {PDU}, {USV}', '{OOB}', '{SNMPv3}, {q0}; Abschaltsignal der {USV}'],
      lcpChiller: ['{EMS} ↔ {LCP}, Chiller', 'Ethernet / {RS485}', '{SNMP} / {Modbus}, {q0}'],
      fire: ['Löschmodul, Sensoren → {EMS}', 'potenzialfreier Kontakt / {Modbus}', 'ereignisgesteuert'],
      steuerbox: ['{Steuerbox} → {EMS}', 'potenzialfreier Kontakt', 'falls anwendbar'],
      internet: ['Firewall → Internet', 'Glasfaser oder 5G', '{WireGuard}, {MQTT}/{TLS}, nur ausgehend'],
      notaus: ['{NotAus} → Verteiler', 'fest verdrahteter Kreis', 'unabhängig vom {EMS}'],
      supply: ['Chiller → {LCP} (Vorlauf)', '{DN} {q0}, Glykol {q1}', '{q2}'],
      return: ['{LCP} → Chiller (Rücklauf)', '{DN} {q0}', '{q1}, {q2}'],
      heat: ['Rücklauf → Wärmetauscher Abwärme', 'Option', '{q0} → Wärmepumpe'],
      air: ['{IT}-Rack ↔ {LCP}', 'geschlossener Kreislauf', '{q0} bei {q1}, ΔT {q2}'],
    },
  },
  rack: {
    lead: 'U1 unten. Schwere Geräte unten, Netzwerk und Branderkennung oben, freie Höheneinheiten mit Blenden verschlossen.',
    rows: {
      fire: 'Branderkennung und Löschung (1U)',
      patch: 'Patchfeld, Kabelführung',
      oob: '{OOB}-Switch 1 {GbE}',
      tor: '{ToR}-Switch 25/100 {GbE}',
      fw: 'Firewall / Router',
      blank: 'Reserve, Blenden',
      load: 'Lastmodule 3 × 3U à 3,75 kW',
      cpu: '{CPU}/Storage-Knoten',
      brick2: '{GPU}-Brick #2',
      brick1: '{GPU}-Brick #1',
      pdu: '{PDU} A und {PDU} B (hinten, vertikal)',
    },
    gpu: '{q} {GPU}',
    zeroU: '0U',
  },
  principle: [
    {
      title: 'Geschlossener Luftkreislauf',
      body: 'Die Luft läuft im Kreis: Rack → Server → Rückseite des Racks → {LCP} → Vorderseite des Racks. Staub und Ammoniak aus dem Raum erreichen die Platinen nicht. Luftmenge ca. 3 000 m³/h bei 15 kW und ΔT 15 K.',
    },
    {
      title: 'Im Raum nur Wasser',
      body: 'Das Kältemittel {R290}/{R32} bleibt im Außengerät. Ins Gebäude kommt Glykol mit 15/21 °C, daher greifen die Füllmengengrenzen der {DINEN378} für kleine Räume nicht. Unter ca. 10–12 °C Außentemperatur läuft die Freikühlung ohne Verdichter.',
    },
    {
      title: 'Energie außerhalb des geschlossenen Kreislaufs',
      body: 'Verteiler, {EMS} und {USV} stehen in einem eigenen, belüfteten Schrank: Bleibatterien geben Wasserstoff ab. Etwa 0,5–0,8 kW Verluste der {USV} gehen in den Raum.',
    },
  ],
  room: [
    'Fläche mindestens 3,2 × 3,0 m, Höhe ab 2,4 m, Tür ab 0,9 m: Das 800-mm-Rack passt durch, der {LCP} wird separat eingebracht.',
    'Vorne ab 1,2 m frei, um Server mit ca. 900 mm Tiefe zu ziehen. Hinten ab 0,8 m.',
    'Boden: ca. 500 kg/m² unter {IT}-Rack und {LCP}. Ältere Decken werden vor Ort geprüft.',
    'Raumlüftung für ca. 0,5–0,8 kW Verluste der {USV} und den Wasserstoff der Batterien.',
    'Außenplatz für den Chiller: Abstand zu Wohngebäuden nach {TALaerm}, Leitungsweg ohne frostgefährdete Abschnitte ohne Glykol.',
    'Keine Aufstellung neben Heu, Stroh, Pellets, Silage oder Kraftstoffen.',
  ],
  open: [
    '{GPU}-Auswahl und OEM. Im Modell: {RTXPRO} als Arbeitsannahme.',
    'Kleinere {LCP}-Baugröße: 40 kW laut Datenblatt gegenüber benötigten 15 kW. Alternativen von {Vertiv}, {Stulz}, {SchaeferIT}.',
    'Chiller: Hersteller, Kältemittel, Schallleistung {L_W} für {TALaerm}, Glykol.',
    'Löschmittel im Rack. Zustimmung des Versicherers vor der Bestellung nötig.',
    'Schutzart des geschlossenen Systems gegen Ammoniak und Staub ({IP}) — Anfrage beim Hersteller.',
    'Gilt {EnWG14a} für Kälteleistung über 4,2 kW?',
    'Pilotstandort mit mindestens 24 kW freier Reserve.',
  ],
  sources: { emulator: 'Server-Emulator 3,75 kW' },
  scene: { wall: 'Gebäudewand', outside: 'außen', room: 'Raum', service: 'Wartungszone' },
};
