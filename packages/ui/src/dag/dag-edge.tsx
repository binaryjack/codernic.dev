import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useTestId } from '../hooks/useTestId';

export function DagEdgeComponent({ dataTestId,
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  label,
  markerEnd,
  style,
}: EdgeProps & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('dag-edge-component', dataTestId);
const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      <BaseEdge data-testid={getTestId('base-edge')}
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ strokeWidth: 1.5, stroke: '#94a3b8', ...style }}
      />
      {label && (
        <EdgeLabelRenderer data-testid={getTestId('edge-label-renderer')}>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className="absolute pointer-events-none text-[10px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded text-neutral-500"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

DagEdgeComponent.displayName = 'DagEdge'
