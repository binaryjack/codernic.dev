import type { AnalyseStepStatus } from '../../../../../vscode-extension/src/features/codernic/model/analyse-runner';

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
};

export type ChatMsg = SystemMsg | UserMsg | AssistantMsg;

export type SelectOption = {
  value: string;
  label: string;
  group?: string;
};

export type PhaseGateState = {
  phase: number;
  summary: string;
};

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

// ANALYSE TYPES
export type AnalyseStep = 'tech-identification' | 'convention-mining' | 'agent-generation';
export type AnalyseProgressState = {
  steps: Record<AnalyseStep, AnalyseStepStatus>;
  currentStep: AnalyseStep | null;
  totalCostUSD: number;
  errorMessage?: string;
  profile?: string;
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
