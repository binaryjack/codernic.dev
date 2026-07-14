import React from 'react';
import { ModelHubPanel } from '../../../features/models/components/organisms/ModelHubPanel';
import { useTestId } from '@ai-agencee/ui';

export function ModelHubWidget({ dataTestId }: { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('model-hub-widget', dataTestId);
return (
    <div data-testid={getTestId('root')} className="w-full h-full bg-[#09090b] flex flex-col overflow-hidden p-3">
      <ModelHubPanel data-testid={getTestId('model-hub-panel')} />
    </div>
  );
}
