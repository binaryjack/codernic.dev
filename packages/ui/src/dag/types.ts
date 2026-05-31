/** Shared types for the DAG canvas — used by both dag-editor and showcase-web. */

import type { Edge, Node } from '@xyflow/react'
import type { StatusKey } from '../tokens/index.js'

// ─── Checkpoint / block enrichment ───────────────────────────────────────────

/** How strongly a worker node checkpoints before proceeding. */
export type CheckpointMode = 'none' | 'soft' | 'hard' | 'human-review'

// ─── Node data ────────────────────────────────────────────────────────────────

export interface BaseNodeData extends Record<string, unknown> {
  label:       string
  nodeType:    DagNodeKind
  status?:     StatusKey
  /** Optional annotation shown below the label */
  subtitle?:   string
}

export interface WorkerNodeData extends BaseNodeData {
  nodeType:        'worker'
  agentFile?:      string
  model?:          string
  laneId?:         string
  retries?:        number
  budgetUSD?:      number
  timeoutMs?:      number
  continueOnFail?: boolean
  durationMs?:     number
  costUSD?:        number
  /** Checkpoint policy applied after this worker completes. */
  checkpointMode?: CheckpointMode
  /** IDs of nodes this worker depends on (must complete first). */
  dependencies?:   string[]
}

export interface SupervisorNodeData extends BaseNodeData {
  nodeType:        'supervisor'
  checkHandlers?:  string[]
  passThreshold?:  number
  failBehavior?:   'halt' | 'warn'
}

export interface LaneNodeData extends BaseNodeData {
  nodeType:        'lane'
  laneId?:         string
  parallel?:       boolean
  maxConcurrency?: number
}

export interface TriggerNodeData extends BaseNodeData {
  nodeType:      'trigger'
  cronExpr?:     string
  webhookPath?:  string
  manualOnly?:   boolean
}

export interface BudgetNodeData extends BaseNodeData {
  nodeType:  'budget'
  limitUSD?: number
  scope?:    'run' | 'lane' | 'llm-call'
  onExceed?: 'halt' | 'warn' | 'notify'
}

/** Synchronisation barrier — waits for all listed nodes before unblocking. */
export interface BarrierNodeData extends BaseNodeData {
  nodeType:   'barrier'
  /** Node IDs that must complete before this barrier releases. */
  waitFor?:   string[]
  timeoutMs?: number
}

export type DagNodeKind = 'worker' | 'supervisor' | 'lane' | 'trigger' | 'budget' | 'barrier'

export type AnyNodeData =
  | WorkerNodeData
  | SupervisorNodeData
  | LaneNodeData
  | TriggerNodeData
  | BudgetNodeData
  | BarrierNodeData

export type DagNode = Node<AnyNodeData>
export type DagEdge = Edge

// ─── Canvas props ─────────────────────────────────────────────────────────────

export interface DagCanvasProps {
  nodes:           DagNode[]
  edges:           DagEdge[]
  readonly?:       boolean
  /** Only used when readonly=false (dag-editor) */
  onNodesChange?:  (nodes: DagNode[]) => void
  onEdgesChange?:  (edges: DagEdge[]) => void
  onConnect?:      (params: { source: string; target: string }) => void
  onNodeClick?:    (nodeId: string, data: AnyNodeData) => void
  className?:      string
}
