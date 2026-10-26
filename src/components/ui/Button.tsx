import type { MouseEventHandler, ReactNode } from 'react';

interface Props {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'sm';
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}

/** Link styled as a button, with the trailing arrow micro-interaction. */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
}: Props) {
  const cls = variant === 'primary' ? `btn ${size === 'sm' ? 'btn-sm' : ''}` : 'btn-ghost';
  return (
    <a href={href} className={`${cls} ${className}`} onClick={onClick}>
      <span>{children}</span>
      <span className="arr" aria-hidden="true">
        →
      </span>
    </a>
  );
}
