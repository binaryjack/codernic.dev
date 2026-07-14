import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { SessionMeta } from '../../../entities/kernel/model/types';
import type { RootState } from '../../../store';
import { createSessionsState } from '@binaryjack/state-factories';

export interface SessionsState {
  sessions: Record<string, SessionMeta>;
  currentSessionId: string | null;
  erathosSnapshots: Record<string, string>;
}

const initialState: SessionsState = createSessionsState() as unknown as SessionsState;

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setSessions(state, action: PayloadAction<Record<string, SessionMeta>>) {
      const newSessions = action.payload;
      for (const id in newSessions) {
        if (state.sessions[id] && state.sessions[id].status === 'running') {
          newSessions[id].status = 'running';
        }
      }
      state.sessions = newSessions;
    },
    renameSession(state, action: PayloadAction<{ id: string; newName: string }>) {
      const { id, newName } = action.payload;
      if (state.sessions[id]) {
        state.sessions[id].name = newName;
      }
    },
    updateSessionStatus(state, action: PayloadAction<{ id: string; status: SessionMeta['status'] }>) {
      const { id, status } = action.payload;
      if (state.sessions[id]) {
        state.sessions[id].status = status;
        state.sessions[id].last_updated = Date.now();
      } else {
        console.warn('updateSessionStatus: Ignoring status update for non-existent session (likely deleted)', id, status);
      }
    },
    setCurrentSessionId(state, action: PayloadAction<string | null>) {
      state.currentSessionId = action.payload;
    },
    removeSession(state, action: PayloadAction<string>) {
      console.log('removeSession called for:', action.payload);
      let id = action.payload as any;
      if (id && typeof id === 'object' && id.id) {
        id = id.id;
      }
      if (id && typeof id === 'string') {
        const newSessions = { ...state.sessions };
        delete newSessions[id];
        state.sessions = newSessions;

        const newSnapshots = { ...state.erathosSnapshots };
        delete newSnapshots[id];
        state.erathosSnapshots = newSnapshots;

        if (state.currentSessionId === id) {
          state.currentSessionId = null;
        }
      }
    },
    setErathosSnapshot(state, action: PayloadAction<{ sessionId: string, schema: any }>) {
      const { sessionId, schema } = action.payload;
      if (schema) {
        state.erathosSnapshots[sessionId] = JSON.stringify(schema);
      } else {
        delete state.erathosSnapshots[sessionId];
      }
    },
  },
});

export const {
  setSessions,
  renameSession,
  updateSessionStatus,
  setCurrentSessionId,
  removeSession,
  setErathosSnapshot,
} = sessionsSlice.actions;

export const selectSessions = (state: RootState): Record<string, SessionMeta> => state.sessions.sessions;
export const selectCurrentSessionId = (state: RootState) => state.sessions.currentSessionId;
export const selectErathosSnapshot = (state: RootState, sessionId: string) => state.sessions.erathosSnapshots[sessionId];
export const selectCurrentSessionName = (state: RootState) => {
  const currentId = state.sessions.currentSessionId;
  return currentId ? state.sessions.sessions[currentId]?.name || null : null;
};

export default sessionsSlice.reducer;
