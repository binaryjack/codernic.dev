import React from 'react';
import { ErathosCanvas } from '../../../widgets/dag-pipeline/ui/ErathosCanvas';
import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { useTestId } from '@ai-agencee/ui';

export function ErathosWidget({ dataTestId, id }: { id?: string; dataTestId?: string; }) {
  
  const { rootId, getTestId } = useTestId('erathos-widget', dataTestId);
return (
    <ErrorBoundary data-testid={getTestId('error-boundary')}>
      <div data-testid={getTestId('root')} className="w-full h-full bg-zinc-950 overflow-hidden">
        <div data-testid="erathos-preview-container" className="w-full h-full">
          <ErathosCanvas data-testid={getTestId('canvas')} id={id} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
