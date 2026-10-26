/** Pre-fills the contact form from other sections (Standort-Check, "Pilotkunde werden"). */
export type Role = 'farm' | 'company' | 'partner' | 'grid' | 'investor' | 'other';
export const ROLES: Role[] = ['farm', 'company', 'partner', 'grid', 'investor', 'other'];

export interface ContactDraft {
  role: Role;
  message?: string;
}

const EVENT = 'ggm:contact';

export function requestContact(d: ContactDraft) {
  window.dispatchEvent(new CustomEvent<ContactDraft>(EVENT, { detail: d }));
  const el = document.getElementById('kontakt');
  if (el) {
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const url = new URL(window.location.href);
    url.hash = 'kontakt';
    window.history.replaceState(window.history.state, '', url);
  }
}

export function onContactRequest(cb: (d: ContactDraft) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent<ContactDraft>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
