import React, { Suspense } from 'react';
import type { BlockState } from '@ai-agencee/ui/layout-engine';
import { WIDGET_REGISTRY } from '../../model/widget-registry';
import { useTestId } from '@ai-agencee/ui';

interface WidgetSuspenseBoundaryProps {
  block: BlockState;
}

export function WidgetSuspenseBoundary({ block }: WidgetSuspenseBoundaryProps) {
  const { rootId, getTestId } = useTestId('render-widget', block['data-testid']);
  const config = WIDGET_REGISTRY[block.widgetType ?? 'unknown-type'];
  
  if (!config) {
    return <div className="p-4 text-zinc-500">Unknown Widget: {block.widgetType}</div>;
  }
  
  const Component = config.component;
  return (
    <Suspense data-testid={getTestId('suspense')}
      fallback={
        <div className="p-4 text-zinc-500 animate-pulse">Loading {block.widgetType}...</div>
      }
    >
      <Component id={block.id} />
    </Suspense>
  );
}

export function renderWidget(block: BlockState) {
  return <WidgetSuspenseBoundary block={block} />;
}
