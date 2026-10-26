import { useId, useMemo, useState, type ReactNode } from 'react';
import { SITE_VARS } from '../data/node.ts';
import { evaluateSite, type CriterionId, type SiteInput, type SiteStatus } from '../lib/evaluateSite.ts';
import { requestContact } from '../lib/contactBus.ts';
import { R, Term, plain, useI18n, type Dict } from '../i18n/index.ts';
import { fmtQ, n } from '../i18n/format.ts';
import type { Lang } from '../config.ts';

type Key = keyof SiteInput;
type Opt = { v: string; label: ReactNode; text: string };

const STATUS_KEY: Record<SiteStatus, keyof Dict['check']['status']> = {
  'suitable-L': 'suitableL',
  'suitable-M': 'suitableM',
  check: 'check',
  'not-suitable': 'notSuitable',
  outside: 'outside',
  incomplete: 'incomplete',
};

function Choice({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: ReactNode;
  options: Opt[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="check-q">
      <legend>{label}</legend>
      <div className="check-opts">
        {options.map((o) => (
          <label key={o.v} className="opt">
            <input
              type="radio"
              name={name}
              value={o.v}
              checked={value === o.v}
              onChange={() => onChange(o.v)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function useVars(lang: Lang) {
  return useMemo(
    () =>
      Object.fromEntries(Object.entries(SITE_VARS).map(([k, q]) => [k, fmtQ(q, lang)])) as Record<
        keyof typeof SITE_VARS,
        string
      >,
    [lang],
  );
}

/** "Passt Ihr Hof?" — client-side only; nothing leaves the browser until the user sends it (§9.1). */
export function StandortCheck() {
  const { t, lang } = useI18n();
  const c = t.check;
  const v = useVars(lang);
  const uid = useId();
  const [input, setInput] = useState<SiteInput>({});
  const res = evaluateSite(input);
  const set = (k: Key) => (val: string) =>
    setInput((s) => ({
      ...s,
      [k]: k === 'pv' ? (val === '' ? null : Math.max(0, Math.min(2000, Number(val)))) : val,
    }));

  const yn = (unsure = true): Opt[] => [
    { v: 'yes', label: c.yes, text: c.yes },
    { v: 'no', label: c.no, text: c.no },
    ...(unsure ? [{ v: 'unsure', label: c.unsure, text: c.unsure }] : []),
  ];
  const q = (s: string) => <R s={s} v={v} />;
  const questions: { k: Key; label: string; opts: Opt[] }[] = [
    {
      k: 'state',
      label: c.q.state,
      opts: (['by', 'bw', 'other'] as const).map((s) => ({ v: s, label: c.states[s], text: c.states[s] })),
    },
    { k: 'bess', label: c.q.bess, opts: yn(false) },
    {
      k: 'reserve',
      label: c.q.reserve,
      opts: [
        { v: 'ge24', label: v.reserveL, text: v.reserveL },
        { v: '16to24', label: v.reserveMid, text: v.reserveMid },
        { v: 'lt16', label: v.reserveLow, text: v.reserveLow },
        { v: 'unknown', label: c.reserveUnknown, text: c.reserveUnknown },
      ],
    },
    { k: 'room', label: c.q.room, opts: yn() },
    { k: 'floor', label: c.q.floor, opts: yn() },
    {
      k: 'distance',
      label: c.q.distance,
      opts: [
        { v: 'near', label: v.cable, text: v.cable },
        { v: 'far', label: v.cableFar, text: v.cableFar },
        { v: 'unsure', label: c.unsure, text: c.unsure },
      ],
    },
    { k: 'outdoor', label: c.q.outdoor, opts: yn() },
    { k: 'fire', label: c.q.fire, opts: yn(false) },
  ];

  const statusText = plain(c.status[STATUS_KEY[res.status]], lang);
  const criterionText = (id: CriterionId) => plain(c.criteria[id], lang, v);

  const send = () => {
    const answers = [
      `${plain(c.q.state, lang, v)}: ${input.state ? c.states[input.state] : c.summary.none}`,
      `${plain(c.q.pv, lang)}: ${input.pv != null ? fmtQ(n(input.pv, 'kWp'), lang) : c.summary.none}`,
      ...questions
        .filter((x) => x.k !== 'state')
        .map(
          (x) =>
            `${plain(x.label, lang, v)}: ${x.opts.find((o) => o.v === input[x.k])?.text ?? c.summary.none}`,
        ),
    ];
    const marks = res.criteria.map(
      (cr) => `${cr.mark === 'ok' ? '✓' : cr.mark === 'fail' ? '✕' : '?'} ${criterionText(cr.id)}`,
    );
    const msg = [
      `${c.summary.title}`,
      `${c.summary.result}: ${statusText}`,
      '',
      ...marks,
      '',
      `${c.summary.answers}:`,
      ...answers.map((a) => `- ${a}`),
    ].join('\n');
    requestContact({ role: 'farm', message: msg });
  };

  return (
    <div className="check grid12" id="standort-check">
      <form className="check-form" onSubmit={(e) => e.preventDefault()} aria-labelledby={`${uid}-t`}>
        <p className="t-label muted">{c.label}</p>
        <h3 id={`${uid}-t`} className="t-h2 check-title">
          {c.title}
        </h3>
        <p className="t-lede">{c.sub}</p>
        <p className="t-small muted">{c.privacy}</p>
        <div className="check-qs">
          {questions.slice(0, 1).map((x) => (
            <Choice
              key={x.k}
              name={`${uid}-${x.k}`}
              label={q(x.label)}
              options={x.opts}
              value={input[x.k] as string | undefined}
              onChange={set(x.k)}
            />
          ))}
          <div className="field check-q">
            <label className="t-label" htmlFor={`${uid}-pv`}>
              <R s={c.q.pv} /> <span className="dim">{`(${c.optional})`}</span>
            </label>
            <div className="input-unit">
              <input
                id={`${uid}-pv`}
                className="input tnum"
                type="number"
                inputMode="numeric"
                min={0}
                max={2000}
                step={1}
                value={input.pv ?? ''}
                onChange={(e) => set('pv')(e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                <Term id="kWp" />
              </span>
            </div>
          </div>
          {questions.slice(1).map((x) => (
            <Choice
              key={x.k}
              name={`${uid}-${x.k}`}
              label={q(x.label)}
              options={x.opts}
              value={input[x.k] as string | undefined}
              onChange={set(x.k)}
            />
          ))}
        </div>
      </form>
      <aside className="check-result" aria-live="polite" aria-label={c.result}>
        <p className="t-label muted">{c.result}</p>
        <p className={`check-status st-${res.status}`}>{statusText}</p>
        <ul className="check-list">
          {res.criteria.map((cr) => (
            <li key={cr.id} className={`m-${cr.mark}`}>
              <span className="check-mark" aria-hidden="true">
                {cr.mark === 'ok' ? '✓' : cr.mark === 'fail' ? '✕' : '?'}
              </span>
              <span>
                <span className="sr-only">{`${c.marks[cr.mark]}: `}</span>
                {criterionText(cr.id)}
                {cr.mark !== 'ok' && cr.answered && cr.note && cr.note !== 'outside' ? (
                  <span className="check-note">{c.notes[cr.note]}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <ul className="check-notes t-small">
          {res.notes
            .filter((x) => x !== 'lowReserve' && x !== 'fixable')
            .map((x) => (
              <li key={x}>
                <R s={c.notes[x]} />
              </li>
            ))}
        </ul>
        <button
          type="button"
          className="btn"
          onClick={send}
          disabled={res.status === 'incomplete' && !Object.keys(input).length}
        >
          <span>{c.send}</span>
          <span className="arr" aria-hidden="true">
            →
          </span>
        </button>
      </aside>
    </div>
  );
}
