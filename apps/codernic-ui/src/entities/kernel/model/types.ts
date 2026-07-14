import type { AnalyseStepStatus } from '../../../../../codernic-ext/src/features/codernic/model/analyse-runner';

export interface DiagnosticInfo {
  code: string;
  title: string;
  message: string;
  fix_suggestion: string;
  documentation_url?: string;
}

export type SystemMsg = {
  id: string;
  role: 'system';
  text: string;
  diagnostic?: DiagnosticInfo;
};

export type UserMsg = {
  id: string;
  role: 'user';
  text: string;
  diagnostic?: DiagnosticInfo;
};

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'running' | 'success' | 'failed';
  result?: string;
};

export type AssistantMsg = {
  id: string;
  role: 'assistant';
  text: string;
  streaming?: boolean;
  diagnostic?: DiagnosticInfo;
  toolCalls?: ToolCall[];
  metrics?: InferenceMetrics;
};

export type PlanCtaMsg = {
  id: string;
  role: 'plan-cta';
  text: string;
  cost: string;
  duration: string;
  task: string;
};

export type ChatMsg = SystemMsg | UserMsg | AssistantMsg | PlanCtaMsg;

export type SelectOption = {
  value: string;
  label: string;
  group?: string;
  isMissing?: boolean;
};

export interface PhaseGateState {
  phase: number;
  summary: string;
}

export interface InferenceMetrics {
  ttft_ms: number;
  tokens_per_second: number;
  vram_allocated_bytes: number;
  context_tokens_count: number;
  prompt_tokens_original?: number;
  prompt_tokens_compressed?: number;
  cost_saved_usd?: number;
}

export type CostPreview = {
  task: string;
  plan: string;
  cost: string;
  duration: string;
  mode: string;
};

// AGENT RUN TYPES
export type CheckpointState = { id: string; verdict: string; durationMs: number };
export type LaneStatus = 'pending' | 'running' | 'success' | 'failed' | 'escalated';
export type LaneState = {
  id: string;
  status: LaneStatus;
  checkpoints: CheckpointState[];
  durationMs?: number;
  cost: number;
};
export type AgentRunState = {
  dagName: string;
  runId: string;
  lanes: LaneState[];
  runningCostUSD: number;
  startedAt: number;
  status: 'running' | 'success' | 'failed' | 'partial';
};

export interface AgentIntrospectionEvent {
  type: 'step_start' | 'step_success' | 'step_retry' | 'ToolExecutionResult' | 'agent-thinking-stream' | string;
  step_id?: string;
  delta?: string;
  payload?: any;
  timestamp: number;
}

// ANALYSE & PIRSIG TYPES
export type AnalyseStep = 'tech-identification' | 'convention-mining' | 'agent-generation';
export type AnalyseProgressState = {
  steps: Record<AnalyseStep, AnalyseStepStatus>;
  currentStep: AnalyseStep | null;
  totalCostUSD: number;
  errorMessage?: string;
  profile?: string;
};

export interface PirsigMetrics {
  kpi_score: number;
  symbols_count: number;
  qualitative_flags: string[] | null;
}

// RAG TYPES
export type RagProgressState = {
  filesIndexed: number;
  totalFiles: number;
  percentage: number;
};

// GALILEUS TYPES
export type GalileusSession = {
  id: string;
  label: string;
  state: 'ACTIVE' | 'IDLE' | 'WAITING' | 'DONE';
  agent_type: string;
  claimed_files_count: number;
  waiter_count: number;
};

export type WorkspaceSnapshot = {
  sessions: GalileusSession[];
  queue: unknown[];
  generated_at: number;
};

// INFRASTRUCTURE TYPES
export interface InfraStats {
  vram_used: number;
  vram_total: number;
  vram_available: number;
  vram_required: number;
}

export interface ContextStats {
  current_tokens: number;
  max_tokens: number;
  usage_percent: number;
  turn_count: number;
}

// THINKING TYPES
export type ThinkingPhase =
  | 'thinking'
  | 'reasoning'
  | 'considering'
  | 'reading'
  | 'searching'
  | 'reflecting'
  | 'planning'
  | 'writing'
  | 'executing'
  | 'loading'
  | 'idle';

export type ThinkingState = {
  phase: ThinkingPhase;
  detail?: string;
};

// CONTEXT FILES
export interface CodernicContextFile {
  id: string;
  filePath: string;
  fileName: string;
  lines?: [number, number];
}

// SESSIONS
export interface SessionMeta {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  last_updated: number;
  current_mode?: 'brainstorm' | 'plan' | 'agent';
  llm_id?: string;
  use_rag?: boolean;
  auto_pilot?: boolean;
  erathos_schema?: unknown;
}
export type { DagNode } from './use-kernel-tracker/i-dag-sequence';
export type { NodeStatus } from './use-kernel-tracker/i-dag-sequence';
