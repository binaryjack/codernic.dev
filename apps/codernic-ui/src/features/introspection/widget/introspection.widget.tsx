import React from 'react';
import { IntrospectionPanel } from '../../../widgets/right-panel/ui/IntrospectionPanel';
import { useTestId } from '@ai-agencee/ui';

export function IntrospectionWidget({ dataTestId }: { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('introspection-widget', dataTestId);
return (
    <div data-testid={getTestId('root')} className="w-full h-full bg-zinc-950 overflow-hidden">
      <IntrospectionPanel data-testid={getTestId('introspection-panel')} />
    </div>
  );
}
