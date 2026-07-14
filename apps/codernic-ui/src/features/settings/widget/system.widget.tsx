import React from 'react';
import { SystemTab } from '../../../features/settings/ui/system-tab';
import { useTestId } from '@ai-agencee/ui';

export function SystemWidget({ dataTestId }: { dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('system-widget', dataTestId);
return (
    <div data-testid={getTestId('root')} className="w-full h-full bg-[#09090b] overflow-y-auto">
      <SystemTab data-testid={getTestId('system-tab')} />
    </div>
  );
}
