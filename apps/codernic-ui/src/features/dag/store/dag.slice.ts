import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { dagStrategyRegistry } from '../../../entities/kernel/model/use-kernel-tracker/dag-strategies/dag-strategy-registry';
import type { DagNode } from '../../../entities/kernel/model/types';
import type { AgentRunState, AnalyseProgressState, PhaseGateState, WorkspaceSnapshot, RagProgressState, PirsigMetrics, AgentIntrospectionEvent } from '../../../entities/kernel/model/types';
import type { JourneyPhase } from '../../../../../codernic-ext/src/features/codernic/model/journey-state';
import type { RootState } from '../../../store';
import { createDagState } from '@binaryjack/state-factories';

export interface DagState {
  nodes: Record<string, DagNode>;
  nodeIds: string[];
  allCompleted: boolean;
  activeNodeId: string | null;
  approvalRequest: { id: string; prompt: string } | null;
  artifactReview: { title: string; filename: string; content?: string } | null;

  agentRunBySession: Record<string, AgentRunState | null>;
  analyseProgressBySession: Record<string, AnalyseProgressState | null>;
  ragProgress: RagProgressState | null;
  phaseGate: PhaseGateState | null;
  journeyPhase: JourneyPhase;
  
  pirsigMetrics: PirsigMetrics | null;
  introspectionEvents: AgentIntrospectionEvent[];

  galileusSnapshot: WorkspaceSnapshot | null;
  galileusError: string | null;

  erathosSchema: any | null;
  diffModalOpen: boolean;
  isErathosSyncing: boolean;
}

const initialState: DagState = createDagState() as unknown as DagState;

export const dagSlice = createSlice({
  name: 'dag',
  initialState,
  reducers: {
    agentRunStarted(state, action: PayloadAction<{ sessionId: string, run: AgentRunState }>) {
      state.agentRunBySession[action.payload.sessionId] = action.payload.run;
      state.nodes = {};
      state.nodeIds = [];
    },
    setAgentRun(state, action: PayloadAction<{ sessionId: string, run: AgentRunState | null }>) {
      state.agentRunBySession[action.payload.sessionId] = action.payload.run;
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
    setAnalyseProgress(state, action: PayloadAction<{ sessionId: string, progress: AnalyseProgressState | null }>) {
      state.analyseProgressBySession[action.payload.sessionId] = action.payload.progress;
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
      state.agentRunBySession = {};
    },
    dismissAnalyseProgress(state) {
      state.analyseProgressBySession = {};
    },
    dismissPhaseGate(state) {
      state.phaseGate = null;
    },
    setGalileusSnapshot(state, action: PayloadAction<WorkspaceSnapshot | null>) {
      state.galileusSnapshot = action.payload;
      state.galileusError = null;
    },
    setGalileusError(state, action: PayloadAction<string | null>) {
      state.galileusError = action.payload;
    },
    setErathosSchema(state, action: PayloadAction<any | null>) {
      state.erathosSchema = action.payload;
    },
    setDiffModalOpen(state, action: PayloadAction<boolean>) {
      state.diffModalOpen = action.payload;
    },
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
    saveSchemaLocal(state, action: PayloadAction<{ schema: any }>) {
      state.erathosSchema = action.payload.schema;
    },
    sendSchemaToCodernic(_state, _action: PayloadAction<{ schema: any }>) {
      // Saga intercepts this
    },
    setErathosSyncing(state, action: PayloadAction<boolean>) {
      state.isErathosSyncing = action.payload;
    },
  },
});

export const {
  agentRunStarted,
  setAgentRun,
  updateKernelState,
  setAnalyseProgress,
  setRagProgress,
  setPhaseGate,
  setJourneyPhase,
  setPirsigMetrics,
  addIntrospectionEvent,
  clearIntrospectionEvents,
  dismissAgentRun,
  dismissAnalyseProgress,
  dismissPhaseGate,
  setGalileusSnapshot,
  setGalileusError,
  setErathosSchema,
  setDiffModalOpen,
  setApprovalRequest,
  resolveApproval,
  setArtifactReview,
  resolveArtifactReview,
  saveSchemaLocal,
  sendSchemaToCodernic,
  setErathosSyncing,
} = dagSlice.actions;

export const selectAgentRun = (state: RootState, sessionId: string) => state.dag.agentRunBySession[sessionId] || null;
export const selectAnalyseProgress = (state: RootState, sessionId: string) => state.dag.analyseProgressBySession[sessionId] || null;
export const selectRagProgress = (state: RootState) => state.dag.ragProgress;
export const selectPhaseGate = (state: RootState) => state.dag.phaseGate;
export const selectJourneyPhase = (state: RootState) => state.dag.journeyPhase;
export const selectPirsigMetrics = (state: RootState) => state.dag.pirsigMetrics;
export const selectIntrospectionEvents = (state: RootState) => state.dag.introspectionEvents;
export const selectGalileusSnapshot = (state: RootState) => state.dag.galileusSnapshot;
export const selectGalileusError = (state: RootState) => state.dag.galileusError;
export const selectErathosSchema = (state: RootState) => state.dag.erathosSchema;
export const selectDiffModalOpen = (state: RootState) => state.dag.diffModalOpen;
export const selectIsErathosDirty = (state: RootState) => {
  const sessionId = state.sessions.currentSessionId;
  const current = state.dag.erathosSchema;
  
  if (!sessionId) {
    if (!current) return false;
    // Structura states can be complex; a simple heuristic is to check if it's not totally empty.
    // Usually an empty workspace is just boilerplate JSON.
    const str = JSON.stringify(current);
    // If it has actual content (like an ID generated for a node), it's dirty.
    return str.includes('"id":') && str.length > 150;
  }
  
  const snapshot = state.sessions.erathosSnapshots[sessionId];
  if (!current && !snapshot) return false;
  if (!snapshot) return !!current;
  // Use a string comparison
  return JSON.stringify(current) !== snapshot;
};
export const selectApprovalRequest = (state: RootState) => state.dag.approvalRequest;
export const selectArtifactReview = (state: RootState) => state.dag.artifactReview;
export const selectNodeIds = (state: RootState) => state.dag.nodeIds;
export const selectNodesMap = (state: RootState): Record<string, DagNode> => state.dag.nodes;
export const selectDagNodeById = (state: RootState, id: string) => state.dag.nodes[id];
export const selectIsErathosSyncing = (state: RootState) => state.dag.isErathosSyncing;

export default dagSlice.reducer;
