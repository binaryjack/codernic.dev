import React from 'react';
import { GalileusLanes } from '../../../features/dag/components/organisms/GalileusLanes';
import { GalileusTopologyWidget } from '../../../features/dag/components/organisms/GalileusTopologyWidget';
import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { useTestId } from '@ai-agencee/ui';

export function GalileusRouterWidget({ dataTestId, id }: { id?: string; dataTestId?: string; }) {
  
  const { rootId, getTestId } = useTestId('galileus-router-widget', dataTestId);
return (
    <ErrorBoundary data-testid={getTestId('error-boundary')}>
      <div data-testid={getTestId('root')} className="w-full h-full bg-zinc-950 flex flex-col overflow-hidden p-2">
        <GalileusTopologyWidget data-testid={getTestId('galileus-topology-widget')} />
      </div>
    </ErrorBoundary>
  );
}
