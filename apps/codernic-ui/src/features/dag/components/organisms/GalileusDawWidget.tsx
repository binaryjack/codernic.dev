import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectIntrospectionEvents } from '../../store/dag.slice';
import { DawLanesSequencer } from './DawLanesSequencer';
import type { DawNodeState } from './DawLanesSequencer';
import { useTestId } from '@ai-agencee/ui';

export function GalileusDawWidget({ dataTestId }: { dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('galileus-daw-widget', dataTestId);
  const events = useSelector(selectIntrospectionEvents);

  const { nodes } = useMemo(() => {
    let currentNodes: Record<string, DawNodeState> = {};

    events.forEach(evt => {
      const innerPayload = (evt.payload as any) || {};
      const type = evt.type;

      if (type === 'dag_initialized') {
        currentNodes = {};
        const initNodes = Array.isArray(innerPayload.nodes) ? innerPayload.nodes : [];
        initNodes.forEach((n: any) => {
          currentNodes[n.id] = {
            id: n.id,
            role: n.role,
            status: 'pending',
            dependencies: n.dependencies || []
          };
        });
      } else if (type === 'step_start') {
        const nodeId = innerPayload.node_id || evt.step_id;
        if (nodeId && currentNodes[nodeId]) currentNodes[nodeId].status = 'running';
      } else if (type === 'step_success') {
        const nodeId = innerPayload.node_id || evt.step_id;
        if (nodeId && currentNodes[nodeId]) currentNodes[nodeId].status = 'completed';
      } else if (type === 'dag_mutation') {
        if (innerPayload.type === 'node_added' && innerPayload.node) {
          const n = innerPayload.node;
          currentNodes[n.id] = {
            id: n.id,
            role: n.role,
            status: 'pending',
            dependencies: n.dependencies || []
          };
        }
      }
    });

    return { nodes: Object.values(currentNodes) };
  }, [events]);

  return (
    <div data-testid={getTestId('root')} className="w-full h-full bg-[#0d0d0f] relative overflow-hidden">
      <DawLanesSequencer data-testid={getTestId('sequencer')} nodes={nodes} />
    </div>
  );
}
