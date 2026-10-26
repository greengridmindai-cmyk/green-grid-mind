import { Term } from '../i18n/index.ts';

/** Proposal mark (§4.6): the GGM-Node row in front elevation — 800 / 800 / 300 mm, 2 000 mm high. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect x="0" y="0" width="16" height="40" fill="currentColor" opacity=".38" />
      <rect x="17" y="0" width="16" height="40" fill="currentColor" />
      <rect x="34" y="0" width="6" height="40" fill="#5B9BE6" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-word">
        <Term id="GGMname" />
      </span>
    </span>
  );
}
