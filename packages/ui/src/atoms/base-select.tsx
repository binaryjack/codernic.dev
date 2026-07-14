import type { SelectHTMLAttributes } from 'react';
import { Skeleton } from './skeleton.js';
import { useTestId } from '../hooks/useTestId';

interface BaseSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  isLoading?: boolean;
  dataTestId?: string;
}

export function BaseSelect({ dataTestId,
  isLoading = false,
  className,
  children,
  ...props
}: Readonly<BaseSelectProps>) {
  
  const { rootId, getTestId } = useTestId('base-select', dataTestId);
if (isLoading) {
    return <Skeleton data-testid={getTestId('skeleton')} className="h-8 w-full rounded-node" />;
  }

  return (
    <select title={`base-selector`} className={className} {...props}>
      {children}
    </select>
  );
}
