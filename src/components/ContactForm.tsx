import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CONTACT_EMAIL, FORM_ENDPOINT, SITE_URL } from '../config.ts';
import { ROLES, onContactRequest, type Role } from '../lib/contactBus.ts';
import { pageHref } from '../lib/nav.ts';
import { R, plain, useI18n } from '../i18n/index.ts';

const MIN = 20;
const MAX = 4000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Field = 'email' | 'message' | 'privacy';
type State = 'idle' | 'sending' | 'success' | 'error' | 'mailto';

/** Contact form (§9.2): POST to FORM_ENDPOINT if configured, otherwise a prepared mailto: + copy. */
export function ContactForm() {
  const { t, lang } = useI18n();
  const f = t.form;
  const id = useId();
  const [role, setRole] = useState<Role>('farm');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [message, setMessage] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<State>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const msgRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () =>
      onContactRequest((d) => {
        setRole(d.role);
        if (d.message) setMessage(d.message);
        setState('idle');
        setTimeout(() => msgRef.current?.focus({ preventScroll: true }), 400);
      }),
    [],
  );

  const roleText = f.roles[role];
  const subject = plain(f.subject, lang, { role: roleText, name: name.trim() || org.trim() || '—' });
  const body = [
    message.trim(),
    '',
    '—',
    `${f.name}: ${name.trim() || '—'}`,
    `${f.email}: ${email.trim()}`,
    `${f.org}: ${org.trim() || '—'}`,
    `${f.role}: ${roleText}`,
    plain(f.bodyHead, lang, { site: SITE_URL }),
  ].join('\n');

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (!email.trim()) e.email = f.errors.required;
    else if (!EMAIL.test(email.trim())) e.email = f.errors.email;
    const len = message.trim().length;
    if (!len) e.message = f.errors.required;
    else if (len < MIN) e.message = plain(f.errors.min, lang, { n: String(MIN) });
    else if (len > MAX) e.message = plain(f.errors.max, lang, { n: String(MAX) });
    if (!privacy) e.privacy = f.errors.privacy;
    setErrors(e);
    return e;
  };

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (hp) return; // honeypot filled → silently drop
    const e = validate();
    const first = (Object.keys(e) as Field[])[0];
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    if (FORM_ENDPOINT) {
      setState('sending');
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, name, email, org, message, lang }),
        });
        setState(res.ok ? 'success' : 'error');
      } catch {
        setState('error');
      }
      return;
    }
    setState('mailto');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopyState('ok');
    } catch {
      setCopyState('fail');
    }
  };

  const err = (k: Field) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className="err">
        {errors[k]}
      </p>
    ) : null;
  const len = message.trim().length;

  return (
    <form className="contact-form" noValidate onSubmit={onSubmit}>
      <div className="field">
        <label className="t-label" htmlFor={`${id}-role`}>
          {f.role}
        </label>
        <select id={`${id}-role`} className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {f.roles[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="field">
          <label className="t-label" htmlFor={`${id}-name`}>
            {f.name}
          </label>
          <input id={`${id}-name`} className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="t-label" htmlFor={`${id}-email`}>
            {f.email}
          </label>
          <input
            id={`${id}-email`}
            className="input"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${id}-email-err` : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {err('email')}
        </div>
      </div>
      <div className="field">
        <label className="t-label" htmlFor={`${id}-org`}>
          {f.org} <span className="dim">{`(${t.check.optional})`}</span>
        </label>
        <input id={`${id}-org`} className="input" autoComplete="organization" value={org} onChange={(e) => setOrg(e.target.value)} />
      </div>
      <div className="field">
        <label className="t-label" htmlFor={`${id}-message`}>
          {f.message}
        </label>
        <textarea
          ref={msgRef}
          id={`${id}-message`}
          className="input"
          required
          aria-required="true"
          maxLength={MAX}
          aria-invalid={!!errors.message}
          aria-describedby={`${id}-count${errors.message ? ` ${id}-message-err` : ''}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
        />
        <p id={`${id}-count`} className="t-small dim tnum">
          <R s={f.counter} v={{ n: String(len), max: String(MAX) }} />
        </p>
        {err('message')}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor={`${id}-website`}>{f.honeypot}</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>
      <div className="field">
        <label className="check-box">
          <input
            id={`${id}-privacy`}
            type="checkbox"
            checked={privacy}
            aria-invalid={!!errors.privacy}
            aria-describedby={errors.privacy ? `${id}-privacy-err` : undefined}
            onChange={(e) => setPrivacy(e.target.checked)}
          />
          <span>
            <R
              s={f.privacy}
              v={{
                link: (
                  <a className="link" href={pageHref('datenschutz', lang)}>
                    {f.privacyLink}
                  </a>
                ),
              }}
            />
          </span>
        </label>
        {err('privacy')}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn" disabled={state === 'sending'}>
          <span>{FORM_ENDPOINT ? f.submit : f.submitMail}</span>
          <span className="arr" aria-hidden="true">
            →
          </span>
        </button>
        {!FORM_ENDPOINT ? (
          <button type="button" className="btn-ghost" onClick={copy}>
            <span>{f.copy}</span>
          </button>
        ) : null}
      </div>
      <div aria-live="polite" className="form-status t-small">
        {state === 'sending' ? <p>{f.states.sending}</p> : null}
        {state === 'success' ? <p>{f.states.success}</p> : null}
        {state === 'error' ? <p className="err">{f.states.error}</p> : null}
        {state === 'mailto' ? <p>{f.states.mailto}</p> : null}
        {copyState === 'ok' ? <p>{f.copied}</p> : null}
        {copyState === 'fail' ? <p className="err">{f.copyFailed}</p> : null}
      </div>
      {copyState === 'fail' || state === 'mailto' ? (
        <textarea className="input copy-area" readOnly value={`${subject}\n\n${body}`} rows={8} aria-label={f.copy} />
      ) : null}
    </form>
  );
}
