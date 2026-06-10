import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { JourneyPhase } from '../../../../../codernic-ext/src/features/codernic/model/journey-state';
import type { CodernicMode } from '../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import { dagStrategyRegistry } from './use-kernel-tracker/dag-strategies/dag-strategy-registry';
import type { DagNode } from './use-kernel-tracker/i-dag-sequence';
import type {
  AgentRunState,
  AnalyseProgressState,
  ChatMsg,
  AssistantMsg,
  CodernicContextFile,
  ContextStats,
  DiagnosticInfo,
  InfraStats,
  PhaseGateState,
  SelectOption,
  ThinkingState,
  ToolCall,
  WorkspaceSnapshot,
  RagProgressState,
  SessionMeta,
  PirsigMetrics,
  AgentIntrospectionEvent,
  InferenceMetrics,
} from './types';

export interface KernelState {
  // DAG State
  nodes: Record<string, DagNode>;
  nodeIds: string[];
  allCompleted: boolean;
  activeNodeId: string | null;
  approvalRequest: { id: string; prompt: string } | null;
  artifactReview: { title: string; filename: string; content?: string } | null;

  // Chat State
  messages: ChatMsg[];
  pendingAssistantId: string | null;
  contextFiles: CodernicContextFile[];
  isDragging: boolean;

  // Sessions
  sessions: SessionMeta[];
  currentSessionId: string | null;

  // UI / Global State
  agentRun: AgentRunState | null;
  analyseProgress: AnalyseProgressState | null;
  ragProgress: RagProgressState | null;
  phaseGate: PhaseGateState | null;
  journeyPhase: JourneyPhase;
  mode: CodernicMode;
  appVersion: string | null;
  pirsigMetrics: PirsigMetrics | null;
  introspectionEvents: AgentIntrospectionEvent[];

  // Telemetry
  infraStats: InfraStats | null;
  contextStats: ContextStats | null;

  // Galileus
  galileusSnapshot: WorkspaceSnapshot | null;
  galileusError: string | null;

  // LLM State
  availableLlms: SelectOption[];
  llmLoading: boolean;
  sessionLlm: string;
  routeProfiles: SelectOption[];
  routeProfile: string;

  // Async status
  sending: boolean;
  thinking: ThinkingState;
  wsStatus: 'connecting' | 'connected' | 'disconnected';

  // Daemon telemetry & status
  daemonStatus: 'running' | 'stopped';
  vramUsage: number | null;
  gpuTarget: string;
  systemLogs: string[];
  activeTaskId: string | null;
  metrics: InferenceMetrics | null;
  useRag: boolean;
}

const initialState: KernelState = {
  nodes: {},
  nodeIds: [],
  allCompleted: false,
  activeNodeId: null,
  approvalRequest: null,
  artifactReview: null,

  messages: [],
  pendingAssistantId: null,
  contextFiles: [],
  isDragging: false,

  sessions: [],
  currentSessionId: null,

  agentRun: null,
  analyseProgress: null,
  ragProgress: null,
  phaseGate: null,
  journeyPhase: 1,
  mode: 'ask',
  appVersion: null,
  pirsigMetrics: null,
  introspectionEvents: [],

  infraStats: null,
  contextStats: null,

  galileusSnapshot: null,
  galileusError: null,

  availableLlms: [],
  llmLoading: true,
  sessionLlm: '',
  routeProfiles: [],
  routeProfile: 'default',

  sending: false,
  thinking: { phase: 'idle' },
  wsStatus: 'disconnected',

  daemonStatus: 'stopped',
  vramUsage: null,
  gpuTarget: '--',
  systemLogs: [],
  activeTaskId: null,
  metrics: null,
  useRag: true,
};

export const kernelSlice = createSlice({
  name: 'kernel',
  initialState,
  reducers: {
    setWsStatus(state, action: PayloadAction<KernelState['wsStatus']>) {
      state.wsStatus = action.payload;
    },
    updateLlms(state, action: PayloadAction<SelectOption[]>) {
      state.availableLlms = action.payload;
      state.llmLoading = false;
      if (state.availableLlms.length > 0 && !state.sessionLlm) {
        state.sessionLlm = state.availableLlms[0].value;
      }
    },
    setSessionLlm(state, action: PayloadAction<string>) {
      state.sessionLlm = action.payload;
    },
    setMetrics(state, action: PayloadAction<InferenceMetrics | null>) {
      state.metrics = action.payload;
    },
    setUseRag(state, action: PayloadAction<boolean>) {
      state.useRag = action.payload;
    },
    updateRouteProfiles(state, action: PayloadAction<SelectOption[]>) {
      state.routeProfiles = action.payload;
      if (state.routeProfiles.length > 0 && !state.routeProfile) {
        state.routeProfile = state.routeProfiles[0].value;
      }
    },
    setRouteProfile(state, action: PayloadAction<string>) {
      state.routeProfile = action.payload;
    },
    setAppVersion(state, action: PayloadAction<string | null>) {
      state.appVersion = action.payload;
    },
    agentRunStarted(state, action: PayloadAction<AgentRunState>) {
      state.agentRun = action.payload;
      state.sending = true;
      state.nodes = {};
      state.nodeIds = [];
    },
    setAgentRun(state, action: PayloadAction<AgentRunState | null>) {
      state.agentRun = action.payload;
    },
    updateKernelState(state, action: PayloadAction<unknown>) {
      const raw = action.payload as { type: string };
      const strategy = dagStrategyRegistry.getStrategy(raw.type);

      if (strategy) {
        const currentNodes = Object.values(state.nodes);
        const nextNodes = strategy.execute(currentNodes, raw);

        const nodesMap: Record<string, DagNode> = {};
        const ids: string[] = [];
        nextNodes.forEach((node: DagNode) => {
          nodesMap[node.id] = node;
          ids.push(node.id);
        });
        state.nodes = nodesMap;
        state.nodeIds = ids;
        state.allCompleted = nextNodes.every((n: DagNode) => n.status === 'success');
      }
    },

    // TELEMETRY
    setInfraStats(state, action: PayloadAction<InfraStats | null>) {
      state.infraStats = action.payload;
    },
    setContextStats(state, action: PayloadAction<ContextStats | null>) {
      state.contextStats = action.payload;
    },
    updateSystemStatus(
      state,
      action: PayloadAction<{
        daemonStatus?: 'running' | 'stopped';
        vramUsage?: number | null;
        gpuTarget?: string;
      }>,
    ) {
      if (action.payload.daemonStatus !== undefined) {
        state.daemonStatus = action.payload.daemonStatus;
      }
      if (action.payload.vramUsage !== undefined) {
        state.vramUsage = action.payload.vramUsage;
      }
      if (action.payload.gpuTarget !== undefined) {
        state.gpuTarget = action.payload.gpuTarget;
      }
    },
    appendSystemLogsBatch(state, action: PayloadAction<any>) {
      const logsArray = action.payload?.logs || (Array.isArray(action.payload) ? action.payload : [action.payload]);
      const formattedLines = logsArray.map((log: any) => {
        if (typeof log === 'object' && log && log.message) {
          const time = log.timestamp ? log.timestamp.split('T')[1].slice(0, 8) : 'LOG';
          return `[${time}] ${log.message}`;
        }
        return String(log);
      });
      state.systemLogs.push(...formattedLines);
      if (state.systemLogs.length > 500) {
        state.systemLogs = state.systemLogs.slice(state.systemLogs.length - 500);
      }
    },

    // GALILEUS
    setGalileusSnapshot(state, action: PayloadAction<WorkspaceSnapshot | null>) {
      state.galileusSnapshot = action.payload;
      state.galileusError = null;
    },
    setGalileusError(state, action: PayloadAction<string | null>) {
      state.galileusError = action.payload;
    },

    // CHAT ACTIONS
    appendMessage(state, action: PayloadAction<ChatMsg>) {
      state.messages.push(action.payload);
    },
    setMessages(state, action: PayloadAction<ChatMsg[]>) {
      state.messages = action.payload;
    },
    updateAssistantMessage(
      state,
      action: PayloadAction<{
        id: string;
        chunk?: string;
        toolCall?: ToolCall;
        diagnostic?: DiagnosticInfo;
        done?: boolean;
        taskId?: string;
        metrics?: InferenceMetrics;
      }>,
    ) {
      const { id, chunk, toolCall, diagnostic, done, taskId, metrics } = action.payload;
      if (taskId) {
        state.activeTaskId = taskId;
      }
      const msg = state.messages.find((m) => m.id === id) as AssistantMsg;
      if (msg) {
        if (chunk) msg.text += chunk;
        if (toolCall) {
          if (!msg.toolCalls) msg.toolCalls = [];
          const existing = msg.toolCalls.find((t: ToolCall) => t.id === toolCall.id);
          if (existing) {
            Object.assign(existing, toolCall);
          } else {
            msg.toolCalls.push(toolCall);
          }
        }
        if (diagnostic) msg.diagnostic = diagnostic;
        if (metrics) msg.metrics = metrics;
        if (done) {
          msg.streaming = false;
          state.activeTaskId = null;
        }
      }
    },
    setPendingAssistantId(state, action: PayloadAction<string | null>) {
      state.pendingAssistantId = action.payload;
    },
    setRemoteTaskId(state, action: PayloadAction<string | null>) {
      state.activeTaskId = action.payload;
    },
    abortCurrentTask(state) {
      state.sending = false;
      state.thinking = { phase: 'idle' };
      state.activeTaskId = null;
      state.pendingAssistantId = null;
    },

    // JOURNEY / ANALYSE
    setAnalyseProgress(state, action: PayloadAction<AnalyseProgressState | null>) {
      state.analyseProgress = action.payload;
    },
    setRagProgress(state, action: PayloadAction<RagProgressState | null>) {
      state.ragProgress = action.payload;
    },
    setPhaseGate(state, action: PayloadAction<PhaseGateState | null>) {
      state.phaseGate = action.payload;
    },
    setJourneyPhase(state, action: PayloadAction<JourneyPhase>) {
      state.journeyPhase = action.payload;
    },
    setPirsigMetrics(state, action: PayloadAction<PirsigMetrics | null>) {
      state.pirsigMetrics = action.payload;
    },
    addIntrospectionEvent(state, action: PayloadAction<AgentIntrospectionEvent>) {
      state.introspectionEvents.push(action.payload);
    },
    clearIntrospectionEvents(state) {
      state.introspectionEvents = [];
    },
    dismissAgentRun(state) {
      state.agentRun = null;
    },
    dismissAnalyseProgress(state) {
      state.analyseProgress = null;
    },
    dismissPhaseGate(state) {
      state.phaseGate = null;
    },

    // UI
    setMode(state, action: PayloadAction<CodernicMode>) {
      state.mode = action.payload;
    },
    setSending(state, action: PayloadAction<boolean>) {
      state.sending = action.payload;
    },
    setThinking(state, action: PayloadAction<ThinkingState>) {
      state.thinking = action.payload;
    },
    setContextFiles(state, action: PayloadAction<CodernicContextFile[]>) {
      state.contextFiles = action.payload;
    },
    setIsDragging(state, action: PayloadAction<boolean>) {
      state.isDragging = action.payload;
    },
    addContextFile(state, action: PayloadAction<CodernicContextFile>) {
      if (!state.contextFiles.some((f) => f.filePath === action.payload.filePath)) {
        state.contextFiles.push(action.payload);
      }
    },
    removeContextFile(state, action: PayloadAction<string>) {
      state.contextFiles = state.contextFiles.filter((f) => f.id !== action.payload);
    },
    clearContextFiles(state) {
      state.contextFiles = [];
    },

    // SESSIONS
    setSessions(state, action: PayloadAction<SessionMeta[]>) {
      state.sessions = action.payload;
    },
    setCurrentSessionId(state, action: PayloadAction<string | null>) {
      state.currentSessionId = action.payload;
    },

    // APPROVALS
    setApprovalRequest(state, action: PayloadAction<{ id: string; prompt: string } | null>) {
      state.approvalRequest = action.payload;
    },
    resolveApproval(state, _action: PayloadAction<{ id: string; verdict: 'approve' | 'reject'; feedback?: string }>) {
      state.approvalRequest = null;
    },
    setArtifactReview(state, action: PayloadAction<{ title: string; filename: string; content?: string } | null>) {
      state.artifactReview = action.payload;
    },
    resolveArtifactReview(state, _action: PayloadAction<{ verdict: 'approve' | 'reject'; feedback?: string }>) {
      state.artifactReview = null;
    },

    // UTILS
    sendIntent(_state: KernelState, _action: PayloadAction<unknown>) {
      // Intercepté par Saga
      void _state;
      void _action;
    },
    resetKernel(state) {
      return {
        ...initialState,
        wsStatus: state.wsStatus,
        availableLlms: state.availableLlms,
        sessionLlm: state.sessionLlm,
      };
    },
  },
});

// SELECTORS
const selectKernel = (state: { kernel: KernelState }) => state.kernel;

export const selectWsStatus = createSelector([selectKernel], (kernel) => kernel.wsStatus);
export const selectAvailableLlms = createSelector([selectKernel], (kernel) => kernel.availableLlms);
export const selectSessionLlm = createSelector([selectKernel], (kernel) => kernel.sessionLlm);
export const selectLlmLoading = createSelector([selectKernel], (kernel) => kernel.llmLoading);
export const selectRouteProfiles = createSelector([selectKernel], (kernel) => kernel.routeProfiles);
export const selectRouteProfile = createSelector([selectKernel], (kernel) => kernel.routeProfile);
export const selectAgentRun = createSelector([selectKernel], (kernel) => kernel.agentRun);
export const selectAnalyseProgress = createSelector(
  selectKernel,
  (state) => state.analyseProgress
);
export const selectRagProgress = createSelector(
  selectKernel,
  (state) => state.ragProgress
);
export const selectPhaseGate = createSelector([selectKernel], (kernel) => kernel.phaseGate);
export const selectJourneyPhase = createSelector([selectKernel], (kernel) => kernel.journeyPhase);
export const selectMode = createSelector([selectKernel], (kernel) => kernel.mode);
export const selectMessages = createSelector([selectKernel], (kernel) => kernel.messages);
export const selectPendingAssistantId = createSelector(
  [selectKernel],
  (kernel) => kernel.pendingAssistantId,
);
export const selectSending = createSelector([selectKernel], (kernel) => kernel.sending);
export const selectThinking = createSelector([selectKernel], (kernel) => kernel.thinking);
export const selectNodeIds = createSelector([selectKernel], (kernel) => kernel.nodeIds);
export const selectNodesMap = createSelector([selectKernel], (kernel) => kernel.nodes);
export const selectInfraStats = createSelector([selectKernel], (kernel) => kernel.infraStats);
export const selectContextStats = createSelector([selectKernel], (kernel) => kernel.contextStats);
export const selectApprovalRequest = createSelector([selectKernel], (kernel) => kernel.approvalRequest);
export const selectArtifactReview = createSelector([selectKernel], (kernel) => kernel.artifactReview);
export const selectGalileusSnapshot = createSelector(
  [selectKernel],
  (kernel) => kernel.galileusSnapshot,
);
export const selectGalileusError = createSelector([selectKernel], (kernel) => kernel.galileusError);
export const selectContextFiles = createSelector([selectKernel], (kernel) => kernel.contextFiles);
export const selectIsDragging = createSelector([selectKernel], (kernel) => kernel.isDragging);
export const selectDaemonStatus = createSelector([selectKernel], (kernel) => kernel.daemonStatus);
export const selectVramUsage = createSelector([selectKernel], (kernel) => kernel.vramUsage);
export const selectGpuTarget = createSelector([selectKernel], (kernel) => kernel.gpuTarget);
export const selectSystemLogs = createSelector([selectKernel], (kernel) => kernel.systemLogs);
export const selectActiveTaskId = createSelector([selectKernel], (kernel) => kernel.activeTaskId);
export const selectMetrics = createSelector([selectKernel], (kernel) => kernel.metrics);
export const selectUseRag = createSelector([selectKernel], (kernel) => kernel.useRag);

export const selectSessions = createSelector([selectKernel], (kernel) => kernel.sessions);
export const selectCurrentSessionId = createSelector([selectKernel], (kernel) => kernel.currentSessionId);
export const selectPirsigMetrics = createSelector([selectKernel], (kernel) => kernel.pirsigMetrics);
export const selectIntrospectionEvents = createSelector([selectKernel], (kernel) => kernel.introspectionEvents);

export const selectDagNodeById = createSelector(
  [selectNodesMap, (_state: { kernel: KernelState }, id: string) => id],
  (nodes, id) => nodes[id],
);

export const selectAppVersion = createSelector([selectKernel], (kernel) => kernel.appVersion);

export const {
  setWsStatus,
  updateLlms,
  setSessionLlm,
  updateRouteProfiles,
  setRouteProfile,
  setAppVersion,
  agentRunStarted,
  setAgentRun,
  updateKernelState,
  appendMessage,
  setMessages,
  updateAssistantMessage,
  setPendingAssistantId,
  setAnalyseProgress,
  setRagProgress,
  setPhaseGate,
  setJourneyPhase,
  dismissAgentRun,
  dismissAnalyseProgress,
  dismissPhaseGate,
  setMode,
  setSending,
  setThinking,
  sendIntent,
  resetKernel,
  setInfraStats,
  setContextStats,
  updateSystemStatus,
  appendSystemLogsBatch,
  setGalileusSnapshot,
  setGalileusError,
  setContextFiles,
  setIsDragging,
  addContextFile,
  removeContextFile,
  clearContextFiles,
  setApprovalRequest,
  resolveApproval,
  setArtifactReview,
  resolveArtifactReview,
  setRemoteTaskId,
  abortCurrentTask,
  setSessions,
  setCurrentSessionId,
  setPirsigMetrics,
  addIntrospectionEvent,
  clearIntrospectionEvents,
  setMetrics,
  setUseRag,
} = kernelSlice.actions;

export default kernelSlice.reducer;
