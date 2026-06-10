import { describe, it, expect } from 'vitest';
import reducer, { setApprovalRequest, resolveApproval } from './kernel-slice';
import type { KernelState } from './kernel-slice';

describe('kernel-slice reducers', () => {
  const getInitialState = (): KernelState => ({
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
    pirsigMetrics: null,
    introspectionEvents: [],
  });

  it('should handle setApprovalRequest', () => {
    const state = getInitialState();
    const payload = { id: 'node-1', prompt: 'Approve writing tests?' };
    
    const nextState = reducer(state, setApprovalRequest(payload));
    
    expect(nextState.approvalRequest).toEqual(payload);
  });

  it('should handle resolveApproval by clearing approvalRequest', () => {
    const state = {
      ...getInitialState(),
      approvalRequest: { id: 'node-1', prompt: 'Approve writing tests?' },
    };
    
    const nextState = reducer(state, resolveApproval({ id: 'node-1', verdict: 'approve' }));
    
    expect(nextState.approvalRequest).toBeNull();
  });
});
