import React, { HTMLAttributes } from 'react';
import { cx } from '../lib/cx.js';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'bg-[var(--bg-card)] border border-[var(--border)] rounded-md flex flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx('flex items-center justify-between gap-2 p-2 border-b border-[var(--border-subtle)]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: CardProps) {
  return (
    <div className={cx('flex-1 p-2 flex flex-col', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx('flex items-center justify-between p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-card-hover)]', className)}
      {...props}
    >
      {children}
    </div>
  );
}
