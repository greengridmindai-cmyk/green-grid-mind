import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface SegOption<V extends string> {
  value: V;
  label: ReactNode;
  /** language of the label, e.g. for language names */
  lang?: string;
  ariaLabel?: string;
}

interface Props<V extends string> {
  options: SegOption<V>[];
  value: V;
  onChange: (v: V) => void;
  label: string;
  className?: string;
  size?: 'md' | 'lg';
}

/** Segmented control: group of toggle buttons, ←/→ moves between segments, Enter/Space selects. */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
  size = 'md',
}: Props<V>) {
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const buttons = [...(ref.current?.querySelectorAll('button') ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
    next?.focus();
  };
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={`seg ${size === 'lg' ? 'seg-lg' : ''} ${className}`}
      onKeyDown={onKey}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.lang}
          aria-label={o.ariaLabel}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
