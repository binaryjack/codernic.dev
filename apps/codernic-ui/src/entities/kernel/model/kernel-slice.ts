import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { JourneyPhase } from '../../../../../vscode-extension/src/features/codernic/model/journey-state';
import { dagStrategyRegistry } from './use-kernel-tracker/dag-strategies/dag-strategy-registry';
import type { DagNode } from './use-kernel-tracker/i-dag-sequence';
import type {
  AgentRunState,
  AnalyseProgressState,
  ChatMsg,
  AssistantMsg,
  CodernicContextFile,
  ContextStats,
  CostPreview,
  DiagnosticInfo,
  InfraStats,
  PhaseGateState,
  SelectOption,
  ThinkingState,
  ToolCall,
  WorkspaceSnapshot,
} from './types';

export interface KernelState {
  // DAG State
  nodes: Record<string, DagNode>;
  nodeIds: string[];
  allCompleted: boolean;
  activeNodeId: string | null;

  // Chat State
  messages: ChatMsg[];
  pendingAssistantId: string | null;
  contextFiles: CodernicContextFile[];
  isDragging: boolean;

  // UI / Global State
  agentRun: AgentRunState | null;
  analyseProgress: AnalyseProgressState | null;
  phaseGate: PhaseGateState | null;
  journeyPhase: JourneyPhase;

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

  // Async status
  sending: boolean;
  thinking: ThinkingState;
  costPreview: CostPreview | null;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
}

const initialState: KernelState = {
  nodes: {},
  nodeIds: [],
  allCompleted: false,
  activeNodeId: null,

  messages: [],
  pendingAssistantId: null,
  contextFiles: [],
  isDragging: false,

  agentRun: null,
  analyseProgress: null,
  phaseGate: null,
  journeyPhase: 1,

  infraStats: null,
  contextStats: null,

  galileusSnapshot: null,
  galileusError: null,

  availableLlms: [],
  llmLoading: true,
  sessionLlm: '',

  sending: false,
  thinking: { phase: 'idle' },
  costPreview: null,
  wsStatus: 'disconnected',
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
      }>,
    ) {
      const { id, chunk, toolCall, diagnostic, done } = action.payload;
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
        if (done) msg.streaming = false;
      }
    },
    setPendingAssistantId(state, action: PayloadAction<string | null>) {
      state.pendingAssistantId = action.payload;
    },

    // JOURNEY / ANALYSE
    setAnalyseProgress(state, action: PayloadAction<AnalyseProgressState | null>) {
      state.analyseProgress = action.payload;
    },
    setPhaseGate(state, action: PayloadAction<PhaseGateState | null>) {
      state.phaseGate = action.payload;
    },
    setJourneyPhase(state, action: PayloadAction<JourneyPhase>) {
      state.journeyPhase = action.payload;
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
    setCostPreview(state, action: PayloadAction<CostPreview | null>) {
      state.costPreview = action.payload;
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
export const selectAgentRun = createSelector([selectKernel], (kernel) => kernel.agentRun);
export const selectAnalyseProgress = createSelector(
  [selectKernel],
  (kernel) => kernel.analyseProgress,
);
export const selectPhaseGate = createSelector([selectKernel], (kernel) => kernel.phaseGate);
export const selectJourneyPhase = createSelector([selectKernel], (kernel) => kernel.journeyPhase);
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
export const selectCostPreview = createSelector([selectKernel], (kernel) => kernel.costPreview);
export const selectGalileusSnapshot = createSelector(
  [selectKernel],
  (kernel) => kernel.galileusSnapshot,
);
export const selectGalileusError = createSelector([selectKernel], (kernel) => kernel.galileusError);
export const selectContextFiles = createSelector([selectKernel], (kernel) => kernel.contextFiles);
export const selectIsDragging = createSelector([selectKernel], (kernel) => kernel.isDragging);

export const selectDagNodeById = createSelector(
  [selectNodesMap, (_state: { kernel: KernelState }, id: string) => id],
  (nodes, id) => nodes[id],
);

export const {
  setWsStatus,
  updateLlms,
  setSessionLlm,
  agentRunStarted,
  setAgentRun,
  updateKernelState,
  appendMessage,
  setMessages,
  updateAssistantMessage,
  setPendingAssistantId,
  setAnalyseProgress,
  setPhaseGate,
  setJourneyPhase,
  dismissAgentRun,
  dismissAnalyseProgress,
  dismissPhaseGate,
  setSending,
  setThinking,
  sendIntent,
  resetKernel,
  setInfraStats,
  setContextStats,
  setCostPreview,
  setGalileusSnapshot,
  setGalileusError,
  setContextFiles,
  setIsDragging,
  addContextFile,
  removeContextFile,
  clearContextFiles,
} = kernelSlice.actions;

export default kernelSlice.reducer;
