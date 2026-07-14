import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIntrospectionEvents, setErathosSchema, sendSchemaToCodernic } from '../../store/dag.slice';
import { selectCurrentSessionId } from '../../../sessions/store/sessions.slice';
import { Heading } from '@ai-agencee/ui';
import { ErathosCanvas } from '../../../../widgets/dag-pipeline/ui/ErathosCanvas';
import { useVBlockContext } from '@ai-agencee/ui/layout-engine';
import { ErathosToolbar } from './ErathosToolbar';
import { createPortal } from 'react-dom';
import { DawLanesSequencer } from './DawLanesSequencer';
import type { DawNodeState } from './DawLanesSequencer';
import { useTestId } from '@ai-agencee/ui';



interface GalileusTopologyWidgetProps {
  dataTestId?: string;
}

export function GalileusTopologyWidget({ dataTestId }: GalileusTopologyWidgetProps) {
  const { rootId, getTestId } = useTestId('galileus-topology-widget', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
  const events = useSelector(selectIntrospectionEvents);
  const currentSessionId = useSelector(selectCurrentSessionId);
  const dispatch = useDispatch();
  const vblockCtx = useVBlockContext();

  // We keep this lightweight reconstruction just to know if we are running and if there's a DAG at all
  // The actual visualization and node-progress animation is natively handled by Atomos Structura via MCP SSE.
  const { nodes, isRunning } = useMemo(() => {
    let currentNodes: Record<string, DawNodeState> = {};
    let active = false;

    events.forEach(evt => {
      const innerPayload = (evt.payload as any) || {};
      const type = evt.type;

      if (type === 'dag_initialized') {
        active = true;
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
        const failedNodeId = innerPayload.failed_node;
        const reviewerId = innerPayload.new_reviewer_node;
        
        if (failedNodeId && currentNodes[failedNodeId]) currentNodes[failedNodeId].status = 'failed';
        if (reviewerId) {
          currentNodes[reviewerId] = {
            id: reviewerId,
            role: 'Reviewer',
            status: 'pending',
            dependencies: [failedNodeId].filter(Boolean)
          };
        }
      } else if (type === 'task_completed') {
        active = false;
      }
    });

    return { nodes: currentNodes, isRunning: active };
  }, [events]);

  useEffect(() => {
    if (Object.keys(nodes).length === 0 || !currentSessionId) return;

    // Build the Structura schema based on current node states
    const entities = Object.values(nodes).map((n, i) => {
      // Clean horizontal/vertical lane positioning layout
      const x = 50 + (i % 2) * 260;
      const y = 50 + Math.floor(i / 2) * 120;
      
      const mappedStatus = n.status === 'completed' ? 'Done' : n.status === 'running' ? 'InProgress' : n.status;

      return {
        id: n.id,
        name: n.id,
        shape: 'rectangle',
        x,
        y,
        width: 180,
        height: 60,
        status: mappedStatus,
        properties: [
          { key: 'status', label: 'Status', value: mappedStatus, dataType: 'string', componentType: 'input' }
        ]
      };
    });

    const links: any[] = [];
    Object.values(nodes).forEach(n => {
      n.dependencies.forEach(dep => {
        links.push({
          id: `link-${dep}-${n.id}`,
          source: dep,
          target: n.id,
          renderType: 'bezier'
        });
      });
    });

    const schema = {
      workspace: {
        name: 'Galileus Topology',
        version: '1',
        last_modified: new Date().toISOString(),
        canvases: {
          'canvas-default': {
            id: 'canvas-default',
            name: 'Canvas 1',
            schemas: {
              'schema-default': {
                id: 'schema-default',
                name: 'Default Schema',
                entities,
                links
              }
            },
            active_schema_id: 'schema-default',
            viewport: {
              pan: { x: 0, y: 0 },
              zoom: 1
            }
          }
        },
        active_canvas_id: 'canvas-default'
      }
    };

    dispatch(setErathosSchema(schema));
    dispatch(sendSchemaToCodernic({ schema }));
  }, [nodes, currentSessionId, dispatch]);

  if (Object.keys(nodes).length === 0) {
    return (
      <div data-testid={dataTestId || 'default-galileus-topology-widget'} className="flex flex-col items-center justify-center h-full text-[#71717a] italic text-sm p-4">
        Waiting for Supervisor to generate DAG topology...
      </div>
    );
  }

  // Pass schema as initialState so settings (black background, transparent grid) are loaded natively
  const schema = {
    workspace: {
      name: 'Galileus Topology',
      version: '1',
      last_modified: new Date().toISOString(),
      canvases: {
        'canvas-default': {
          id: 'canvas-default',
          name: 'Canvas 1',
          schemas: {
            'schema-default': {
              id: 'schema-default',
              name: 'Default Schema',
              entities: [],
              links: []
            }
          },
          active_schema_id: 'schema-default',
          viewport: {
            pan: { x: 0, y: 0 },
            zoom: 1
          }
        }
      },
      active_canvas_id: 'canvas-default'
    }
  };

  return (
    <div data-testid={dataTestId || 'default-galileus-topology-widget'} className="w-full h-full bg-[#0d0d0f] relative overflow-hidden">
        {vblockCtx?.headerPortalRef?.current && createPortal(
          <ErathosToolbar />,
          vblockCtx.headerPortalRef.current
        )}
        <ErathosCanvas data-testid={getTestId('erathos-canvas')} readOnly={true} hideHeader={true} appearance="black" allowMouseZoom={true} allowMultipleSchemas={false} disableLocalStorage={true} fitToScreen={true} initialState={schema} />
    </div>
  );
}
