import React from 'react';
import { ArtifactsPanel } from '../../../widgets/right-panel/ui/ArtifactsPanel';
import { useSelector } from 'react-redux';
import { selectCurrentSessionId } from '../../../features/sessions/store/sessions.slice';
import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { useTestId } from '@ai-agencee/ui';

export function ArtifactsWidget({ dataTestId, id }: { id?: string; dataTestId?: string; }) {
  
  const { rootId, getTestId } = useTestId('artifacts-widget', dataTestId);
const currentSessionId = useSelector(selectCurrentSessionId);
  return (
    <ErrorBoundary data-testid={getTestId('error-boundary')}>
      <div data-testid={getTestId('root')} className="w-full h-full bg-zinc-950 overflow-hidden">
        <div data-testid="artifacts-panel" className="w-full h-full">
          <ArtifactsPanel sessionId={currentSessionId} widgetId={id} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
