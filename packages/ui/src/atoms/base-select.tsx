import type { SelectHTMLAttributes } from 'react';
import { Skeleton } from './skeleton.js';

interface BaseSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  isLoading?: boolean;
}

export function BaseSelect({
  isLoading = false,
  className,
  children,
  ...props
}: Readonly<BaseSelectProps>) {
  if (isLoading) {
    return <Skeleton className="h-8 w-full rounded-node" />;
  }

  return (
    <select title={`base-selector`} className={className} {...props}>
      {children}
    </select>
  );
}
