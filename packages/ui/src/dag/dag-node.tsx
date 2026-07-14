'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo, type ReactNode } from 'react'
import { Badge } from '../atoms/badge.js'
import { Icon } from '../icons/index.js'
import { cx } from '../lib/cx.js'
import { checkpointBadge, kindBorder, kindIcon } from './dag-node.classes.js'
import { useTestId } from '../hooks/useTestId';
import type {
    BarrierNodeData,
    BudgetNodeData,
    DagNode,
    LaneNodeData,
    SupervisorNodeData,
    TriggerNodeData,
    WorkerNodeData
} from './types.js'

// ── Shared primitives ─────────────────────────────────────────────────────────

function NodeShell({ dataTestId,
  children,
  border,
  selected,
}: {
  children:  ReactNode
  border:    string
  selected?: boolean
  dataTestId?: string;
}) {
  
  const { rootId, getTestId } = useTestId('node-shell', dataTestId);
return (
    <div
      className={cx(
        'min-w-[160px] rounded-node border-2 bg-white dark:bg-neutral-800 shadow-sm',
        'px-3 py-2 flex flex-col gap-1 text-left',
        border,
        selected && 'ring-2 ring-brand-500 ring-offset-1',
      )}
    >
      <Handle data-testid={getTestId('handle')} type="target" position={Position.Top}    className="!bg-neutral-400" />
      {children}
      <Handle data-testid={getTestId('handle-1')} type="source" position={Position.Bottom} className="!bg-neutral-400" />
    </div>
  )
}

function NodeHeader({ dataTestId, kind, label }: { kind: keyof typeof kindIcon; label: string; dataTestId?: string;
}) {
  
  const { rootId, getTestId } = useTestId('node-header', dataTestId);
const iconName = kindIcon[kind]
  return (
    <div className="flex items-center gap-1.5">
      {iconName
        ? <Icon data-testid={getTestId('icon')} name={iconName} theme="auto" size={16} />
        : <span aria-hidden className="text-base leading-none">●</span>}
      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate max-w-[120px]">
        {label}
      </span>
    </div>
  )
}

// ── Worker ────────────────────────────────────────────────────────────────────

function WorkerNodeInner({ dataTestId, data, selected }: NodeProps<DagNode> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('worker-node-inner', dataTestId);
const d = data as WorkerNodeData
  return (
    <NodeShell data-testid={getTestId('node-shell')} border={kindBorder.worker} selected={selected}>
      <NodeHeader data-testid={getTestId('node-header')} kind="worker" label={d.label} />
      {d.model && (
        <span className="text-[10px] font-mono text-brand-400 truncate">{d.model}</span>
      )}
      {d.agentFile && (
        <span className="text-[10px] text-neutral-400 truncate">
          {d.agentFile.split('/').pop()}
        </span>
      )}
      {d.checkpointMode && d.checkpointMode !== 'none' && (
        <span className={cx('text-[10px] font-medium self-start px-1 rounded', checkpointBadge[d.checkpointMode])}>
          ckpt: {d.checkpointMode}
        </span>
      )}
      {d.dependencies && d.dependencies.length > 0 && (
        <span className="text-[10px] text-neutral-500">
          deps: {d.dependencies.length}
        </span>
      )}
      {d.status && d.status !== 'pending' && (
        <Badge data-testid={getTestId('badge')} status={d.status} label={d.status} dot className="self-start mt-0.5" />
      )}
    </NodeShell>
  )
}

// ── Supervisor ────────────────────────────────────────────────────────────────

function SupervisorNodeInner({ dataTestId, data, selected }: NodeProps<DagNode> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('supervisor-node-inner', dataTestId);
const d = data as SupervisorNodeData
  return (
    <NodeShell data-testid={getTestId('node-shell')} border={kindBorder.supervisor} selected={selected}>
      <NodeHeader data-testid={getTestId('node-header')} kind="supervisor" label={d.label} />
      {d.passThreshold !== undefined && (
        <span className="text-[10px] text-neutral-400">threshold: {d.passThreshold}</span>
      )}
      {d.failBehavior && (
        <span className={cx(
          'text-[10px] font-medium self-start px-1 rounded',
          d.failBehavior === 'halt'
            ? 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-300'
            : 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300',
        )}>
          on fail: {d.failBehavior}
        </span>
      )}
      {d.status && d.status !== 'pending' && (
        <Badge data-testid={getTestId('badge')} status={d.status} label={d.status} dot className="self-start mt-0.5" />
      )}
    </NodeShell>
  )
}

// ── Lane ──────────────────────────────────────────────────────────────────────

function LaneNodeInner({ dataTestId, data, selected }: NodeProps<DagNode> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('lane-node-inner', dataTestId);
const d = data as LaneNodeData
  return (
    <NodeShell data-testid={getTestId('node-shell')} border={kindBorder.lane} selected={selected}>
      <NodeHeader data-testid={getTestId('node-header')} kind="lane" label={d.label} />
      <div className="flex items-center gap-1 flex-wrap">
        {d.parallel && (
          <span className="text-[10px] bg-neutral-100 dark:bg-neutral-700 text-neutral-500 px-1 rounded">
            parallel
          </span>
        )}
        {d.maxConcurrency && (
          <span className="text-[10px] text-neutral-400">×{d.maxConcurrency}</span>
        )}
      </div>
      {d.status && d.status !== 'pending' && (
        <Badge data-testid={getTestId('badge')} status={d.status} label={d.status} dot className="self-start mt-0.5" />
      )}
    </NodeShell>
  )
}

// ── Trigger ───────────────────────────────────────────────────────────────────

function TriggerNodeInner({ dataTestId, data, selected }: NodeProps<DagNode> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('trigger-node-inner', dataTestId);
const d = data as TriggerNodeData
  return (
    <NodeShell data-testid={getTestId('node-shell')} border={kindBorder.trigger} selected={selected}>
      <NodeHeader data-testid={getTestId('node-header')} kind="trigger" label={d.label} />
      {d.cronExpr && (
        <span className="text-[10px] font-mono text-neutral-400 truncate">{d.cronExpr}</span>
      )}
      {d.webhookPath && (
        <span className="text-[10px] text-neutral-400 truncate">{d.webhookPath}</span>
      )}
      {d.manualOnly && (
        <span className="text-[10px] bg-neutral-100 dark:bg-neutral-700 text-neutral-500 px-1 rounded self-start">
          manual
        </span>
      )}
    </NodeShell>
  )
}

// ── Budget ────────────────────────────────────────────────────────────────────

function BudgetNodeInner({ dataTestId, data, selected }: NodeProps<DagNode> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('budget-node-inner', dataTestId);
const d = data as BudgetNodeData
  return (
    <NodeShell data-testid={getTestId('node-shell')} border={kindBorder.budget} selected={selected}>
      <NodeHeader data-testid={getTestId('node-header')} kind="budget" label={d.label} />
      {d.limitUSD !== undefined && (
        <span className="text-[10px] text-neutral-400">${d.limitUSD} limit</span>
      )}
      {d.scope && (
        <span className="text-[10px] text-neutral-400">scope: {d.scope}</span>
      )}
      {d.onExceed && (
        <span className="text-[10px] text-danger-400">on exceed: {d.onExceed}</span>
      )}
    </NodeShell>
  )
}

// ── Barrier ───────────────────────────────────────────────────────────────────

function BarrierNodeInner({ dataTestId, data, selected }: NodeProps<DagNode> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('barrier-node-inner', dataTestId);
const d = data as BarrierNodeData
  return (
    <NodeShell data-testid={getTestId('node-shell')} border={kindBorder.barrier} selected={selected}>
      <NodeHeader data-testid={getTestId('node-header')} kind="barrier" label={d.label} />
      {d.waitFor && d.waitFor.length > 0 && (
        <span className="text-[10px] text-neutral-400">
          waits for {d.waitFor.length} node{d.waitFor.length !== 1 ? 's' : ''}
        </span>
      )}
      {d.status && d.status !== 'pending' && (
        <Badge data-testid={getTestId('badge')} status={d.status} label={d.status} dot className="self-start mt-0.5" />
      )}
    </NodeShell>
  )
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const WorkerNode     = memo(WorkerNodeInner)
export const SupervisorNode = memo(SupervisorNodeInner)
export const LaneNode       = memo(LaneNodeInner)
export const TriggerNode    = memo(TriggerNodeInner)
export const BudgetNode     = memo(BudgetNodeInner)
export const BarrierNode    = memo(BarrierNodeInner)

WorkerNode.displayName     = 'WorkerNode'
SupervisorNode.displayName = 'SupervisorNode'
LaneNode.displayName       = 'LaneNode'
TriggerNode.displayName    = 'TriggerNode'
BudgetNode.displayName     = 'BudgetNode'
BarrierNode.displayName    = 'BarrierNode'

// Keep a named re-export so old imports don't hard-fail at runtime.
// dag-canvas.tsx now registers per-kind components; this is a fallback only.
/** @deprecated Use per-kind components (WorkerNode, SupervisorNode, …) instead. */
export const DagNodeComponent = WorkerNode
