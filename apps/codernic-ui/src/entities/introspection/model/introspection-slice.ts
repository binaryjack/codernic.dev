import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';
import { createIntrospectionState } from '@binaryjack/state-factories';

export interface IIntrospectionStreamNode {
  id: string;
  timestamp: string;
  type: 'thought' | 'convergence' | 'divergence' | 'tool_call' | 'dag_arbitration';
  content: string;
  agentId?: string;
  messageId?: string;
}

export interface IIntrospectionSession {
  introspectionId: string;
  sessionId: string;
  confidenceScore: number | null; // 0-100
  mode: 'free-flow' | 'deterministic';
  nodes: IIntrospectionStreamNode[];
}

export interface IntrospectionState {
  activeIntrospectionId: string | null;
  sessions: Record<string, IIntrospectionSession>; // Key is introspectionId
}

const initialState: IntrospectionState = createIntrospectionState() as unknown as IntrospectionState;

export const introspectionSlice = createSlice({
  name: 'introspection',
  initialState,
  reducers: {
    setActiveIntrospection(state, action: PayloadAction<string | null>) {
      state.activeIntrospectionId = action.payload;
    },
    initIntrospection(state, action: PayloadAction<{ introspectionId: string; sessionId: string; mode: 'free-flow' | 'deterministic' }>) {
      const { introspectionId, sessionId, mode } = action.payload;
      if (!state.sessions[introspectionId]) {
        state.sessions[introspectionId] = {
          introspectionId,
          sessionId,
          confidenceScore: null,
          mode,
          nodes: [],
        };
      }
    },
    setConfidenceScore(state, action: PayloadAction<{ introspectionId: string; score: number }>) {
      const session = state.sessions[action.payload.introspectionId];
      if (session) {
        session.confidenceScore = action.payload.score;
      }
    },
    addIntrospectionNode(state, action: PayloadAction<{ introspectionId: string; node: IIntrospectionStreamNode }>) {
      const session = state.sessions[action.payload.introspectionId];
      if (session) {
        session.nodes.push(action.payload.node);
      }
    },
  },
});

export const { setActiveIntrospection, initIntrospection, setConfidenceScore, addIntrospectionNode } = introspectionSlice.actions;

export const selectActiveIntrospectionId = (state: RootState) => state.introspection.activeIntrospectionId;
export const selectIntrospectionSession = (state: any, introspectionId: string) => state.introspection.sessions[introspectionId];
export const selectActiveIntrospectionSession = (state: RootState): IIntrospectionSession | null => 
  state.introspection.activeIntrospectionId ? state.introspection.sessions[state.introspection.activeIntrospectionId] : null;

export default introspectionSlice.reducer;
