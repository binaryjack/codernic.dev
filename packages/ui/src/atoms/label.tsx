import React, { LabelHTMLAttributes } from 'react';
import { cx } from '../lib/cx.js';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cx(
        'text-[11px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
