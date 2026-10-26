/**
 * Impressum and Datenschutz texts. The German version is legally binding.
 * Every placeholder must be replaced and the texts reviewed by a lawyer before launch (LAUNCH_CHECKLIST.md).
 * `{email}` is replaced with CONTACT_EMAIL, `{date}` with the formatted revision date.
 */
export interface LegalSection {
  h: string;
  p: string[];
}
export interface LegalPage {
  title: string;
  description: string;
  sections: LegalSection[];
}
export interface LegalDict {
  impressum: LegalPage;
  datenschutz: LegalPage;
  /** shown while any placeholder remains */
  banner: string;
  /** EN/RU: courtesy translation notice; DE: empty */
  courtesy: string;
  updated: string;
}

export const legalDe: LegalDict = {
  impressum: {
    title: 'Impressum',
    description: 'Impressum von {GGMname}.',
    sections: [
      {
        h: 'Angaben gemäß § 5 DDG',
        p: [
          'TODO: Firmenname und Rechtsform',
          'TODO: Straße und Hausnummer',
          'TODO: PLZ und Ort',
          'Deutschland',
        ],
      },
      { h: 'Vertreten durch', p: ['TODO: Name der vertretungsberechtigten Person(en)'] },
      { h: 'Kontakt', p: ['E-Mail: {email}', 'Telefon: TODO: Telefonnummer'] },
      { h: 'Registereintrag', p: ['TODO: Registergericht und Registernummer'] },
      { h: 'Umsatzsteuer-Identifikationsnummer', p: ['TODO: USt-IdNr. gemäß § 27a UStG'] },
      { h: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV', p: ['TODO: Name und Anschrift'] },
      {
        h: 'Verbraucherstreitbeilegung',
        p: [
          'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
        ],
      },
    ],
  },
  datenschutz: {
    title: 'Datenschutz',
    description: 'Datenschutzhinweise von {GGMname}.',
    sections: [
      {
        h: 'Verantwortlicher',
        p: [
          'Verantwortlich im Sinne der DSGVO ist der im Impressum genannte Anbieter.',
          'TODO: Name und Anschrift des Verantwortlichen',
          'E-Mail: {email}',
        ],
      },
      {
        h: 'Hosting',
        p: [
          'Diese Website wird über GitHub Pages bereitgestellt, einen Dienst der GitHub, Inc., USA. Beim Aufruf verarbeitet GitHub technisch notwendige Verbindungsdaten (insbesondere {IP}-Adresse, Zeitpunkt, aufgerufene Datei, Browserkennung) in Server-Protokollen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse ist die sichere und zuverlässige Bereitstellung der Website.',
          'Dabei können Daten in die USA übermittelt werden. TODO: Grundlage der Übermittlung prüfen (z. B. EU-US Data Privacy Framework).',
        ],
      },
      {
        h: 'Keine Cookies, kein Tracking',
        p: [
          'Wir setzen keine Cookies, keine Analyse- oder Tracking-Werkzeuge und laden keine Schriftarten, Skripte oder Medien von Dritten. Alle Dateien werden vom selben Server ausgeliefert.',
          'Ihre Sprachwahl speichern wir im lokalen Speicher Ihres Browsers (localStorage), damit die Website beim nächsten Aufruf in derselben Sprache erscheint. Diese Angabe verlässt Ihr Gerät nicht. Die Speicherung ist für den von Ihnen gewünschten Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).',
        ],
      },
      {
        h: 'Standort-Check',
        p: [
          'Der Standort-Check läuft vollständig in Ihrem Browser. Ihre Antworten werden nicht gespeichert und nicht übertragen, bis Sie das Ergebnis selbst über das Kontaktformular an uns senden.',
        ],
      },
      {
        h: 'Kontaktformular und E-Mail',
        p: [
          'Das Kontaktformular öffnet Ihr E-Mail-Programm mit einer vorbereiteten Nachricht; die Website selbst überträgt dabei keine Daten. Wenn Sie uns schreiben, verarbeiten wir Ihre Angaben (Name, E-Mail-Adresse, Organisation, Nachricht, Rolle) zur Bearbeitung Ihrer Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage auf einen Vertrag zielt, sonst Art. 6 Abs. 1 lit. f DSGVO.',
          'Wir löschen die Daten, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten bestehen. TODO: E-Mail-Anbieter und dessen Sitz angeben.',
        ],
      },
      {
        h: 'Ihre Rechte',
        p: [
          'Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f (Art. 21). Wenden Sie sich dazu an {email}.',
          'Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren. TODO: zuständige Aufsichtsbehörde nennen (z. B. Bayerisches Landesamt für Datenschutzaufsicht).',
        ],
      },
    ],
  },
  banner: 'Entwurf: Diese Seite enthält noch Platzhalter und ist rechtlich nicht geprüft.',
  courtesy: '',
  updated: 'Stand: {date}',
};

export const legalEn: LegalDict = {
  impressum: {
    title: 'Impressum',
    description: 'Legal notice (Impressum) of {GGMname}.',
    sections: [
      {
        h: 'Information pursuant to § 5 DDG',
        p: [
          'TODO: company name and legal form',
          'TODO: street and number',
          'TODO: postcode and town',
          'Germany',
        ],
      },
      { h: 'Represented by', p: ['TODO: name of the authorised representative(s)'] },
      { h: 'Contact', p: ['Email: {email}', 'Phone: TODO: phone number'] },
      { h: 'Register entry', p: ['TODO: register court and register number'] },
      { h: 'VAT identification number', p: ['TODO: VAT ID pursuant to § 27a UStG'] },
      { h: 'Responsible for content pursuant to § 18 (2) MStV', p: ['TODO: name and address'] },
      {
        h: 'Consumer dispute resolution',
        p: [
          'We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.',
        ],
      },
    ],
  },
  datenschutz: {
    title: 'Privacy',
    description: 'Privacy notice of {GGMname}.',
    sections: [
      {
        h: 'Controller',
        p: [
          'The controller within the meaning of the GDPR is the provider named in the Impressum.',
          'TODO: name and address of the controller',
          'Email: {email}',
        ],
      },
      {
        h: 'Hosting',
        p: [
          'This website is served via GitHub Pages, a service of GitHub, Inc., USA. When you visit it, GitHub processes technically necessary connection data (in particular {IP} address, time, requested file, browser identifier) in server logs. The legal basis is Art. 6(1)(f) GDPR; our legitimate interest is the secure and reliable provision of the website.',
          'Data may be transferred to the USA. TODO: verify the basis of the transfer (e.g. EU-US Data Privacy Framework).',
        ],
      },
      {
        h: 'No cookies, no tracking',
        p: [
          'We set no cookies, use no analytics or tracking tools and load no fonts, scripts or media from third parties. All files are delivered from the same server.',
          'We store your language choice in your browser’s local storage (localStorage) so the website appears in the same language on your next visit. This value never leaves your device. Storing it is strictly necessary for the service you requested (§ 25(2) no. 2 TDDDG).',
        ],
      },
      {
        h: 'Site check',
        p: [
          'The site check runs entirely in your browser. Your answers are neither stored nor transmitted until you send the result to us yourself via the contact form.',
        ],
      },
      {
        h: 'Contact form and email',
        p: [
          'The contact form opens your email program with a prepared message; the website itself transmits no data. When you write to us, we process your details (name, email address, organisation, message, role) to handle your request. The legal basis is Art. 6(1)(b) GDPR where your request aims at a contract, otherwise Art. 6(1)(f) GDPR.',
          'We delete the data once it is no longer needed to handle your request and no statutory retention obligations apply. TODO: name the email provider and its location.',
        ],
      },
      {
        h: 'Your rights',
        p: [
          'You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object to processing based on Art. 6(1)(f) (Art. 21). Please contact {email}.',
          'You may lodge a complaint with a data protection supervisory authority. TODO: name the competent authority (e.g. the Bavarian State Office for Data Protection Supervision).',
        ],
      },
    ],
  },
  banner: 'Draft: this page still contains placeholders and has not been legally reviewed.',
  courtesy: 'Courtesy translation — the German version is binding.',
  updated: 'Last updated: {date}',
};

export const legalRu: LegalDict = {
  impressum: {
    title: 'Impressum',
    description: 'Выходные данные (Impressum) {GGMname}.',
    sections: [
      {
        h: 'Сведения согласно § 5 DDG',
        p: [
          'TODO: название компании и правовая форма',
          'TODO: улица и номер дома',
          'TODO: индекс и город',
          'Германия',
        ],
      },
      { h: 'Представитель', p: ['TODO: имя уполномоченного представителя'] },
      { h: 'Контакт', p: ['E-mail: {email}', 'Телефон: TODO: номер телефона'] },
      { h: 'Запись в реестре', p: ['TODO: регистрационный суд и номер'] },
      { h: 'Идентификационный номер НДС', p: ['TODO: USt-IdNr. согласно § 27a UStG'] },
      { h: 'Ответственный за содержание согласно § 18 абз. 2 MStV', p: ['TODO: имя и адрес'] },
      {
        h: 'Урегулирование споров с потребителями',
        p: [
          'Мы не готовы и не обязаны участвовать в процедурах урегулирования споров в потребительской арбитражной комиссии.',
        ],
      },
    ],
  },
  datenschutz: {
    title: 'Конфиденциальность',
    description: 'Информация о защите данных {GGMname}.',
    sections: [
      {
        h: 'Ответственное лицо',
        p: [
          'Ответственным в смысле DSGVO является поставщик, указанный в Impressum.',
          'TODO: имя и адрес ответственного лица',
          'E-mail: {email}',
        ],
      },
      {
        h: 'Хостинг',
        p: [
          'Сайт размещён на GitHub Pages — сервисе компании GitHub, Inc., США. При посещении GitHub обрабатывает технически необходимые данные соединения (в частности {IP}-адрес, время, запрошенный файл, идентификатор браузера) в журналах сервера. Правовое основание — ст. 6 п. 1 лит. f DSGVO; наш законный интерес — надёжная и безопасная работа сайта.',
          'Данные могут передаваться в США. TODO: проверить основание передачи (например, EU-US Data Privacy Framework).',
        ],
      },
      {
        h: 'Без cookies и отслеживания',
        p: [
          'Мы не используем cookies, инструменты аналитики и отслеживания и не загружаем шрифты, скрипты или медиа с чужих серверов. Все файлы отдаются с того же сервера.',
          'Выбранный язык мы сохраняем в локальном хранилище браузера (localStorage), чтобы при следующем посещении сайт открылся на том же языке. Это значение не покидает ваше устройство. Хранение строго необходимо для запрошенного вами сервиса (§ 25 абз. 2 п. 2 TDDDG).',
        ],
      },
      {
        h: 'Проверка площадки',
        p: [
          'Проверка площадки полностью работает в вашем браузере. Ответы не сохраняются и не передаются, пока вы сами не отправите результат через форму обратной связи.',
        ],
      },
      {
        h: 'Форма обратной связи и e-mail',
        p: [
          'Форма открывает вашу почтовую программу с подготовленным письмом; сам сайт при этом данные не передаёт. Если вы нам пишете, мы обрабатываем ваши данные (имя, адрес e-mail, организация, сообщение, роль) для ответа на запрос. Правовое основание — ст. 6 п. 1 лит. b DSGVO, если запрос касается договора, иначе ст. 6 п. 1 лит. f DSGVO.',
          'Мы удаляем данные, когда они больше не нужны для обработки запроса и нет законных обязанностей по хранению. TODO: указать почтового провайдера и его местонахождение.',
        ],
      },
      {
        h: 'Ваши права',
        p: [
          'Вы имеете право на получение информации (ст. 15 DSGVO), исправление (ст. 16), удаление (ст. 17), ограничение обработки (ст. 18), переносимость данных (ст. 20) и возражение против обработки на основании ст. 6 п. 1 лит. f (ст. 21). Пишите на {email}.',
          'Вы можете подать жалобу в надзорный орган по защите данных. TODO: указать компетентный орган (например, Баварское земельное ведомство по надзору за защитой данных).',
        ],
      },
    ],
  },
  banner: 'Черновик: на странице ещё есть заполнители, юридическая проверка не проводилась.',
  courtesy: 'Перевод для удобства — юридически обязательна немецкая версия.',
  updated: 'Актуально на: {date}',
};
