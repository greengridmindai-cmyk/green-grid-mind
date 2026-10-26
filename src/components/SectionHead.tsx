import type { ReactNode } from 'react';

/** Hairline + index row that opens every section: `01 / PRINZIP` … meta note on the right. */
export function SectionHead({ index, label, meta }: { index: number; label: ReactNode; meta?: ReactNode }) {
  return (
    <div className="sec-head" data-reveal>
      <span className="t-label">
        <span className="tnum">{String(index).padStart(2, '0')}</span>
        <span aria-hidden="true">{' / '}</span>
        {label}
      </span>
      {meta ? <span className="t-label muted">{meta}</span> : null}
    </div>
  );
}
