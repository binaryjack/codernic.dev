import { store } from '../../../store';
import { setDiffModalOpen, selectIsErathosDirty, setErathosSchema } from './dag.slice';
import { setErathosSnapshot } from '../../sessions/store/sessions.slice';
import { vscode } from '../../../shared';

let globalResolve: ((value: boolean) => void) | null = null;

export const confirmUnsavedChanges = async (): Promise<boolean> => {
  const state = store.getState();
  const isDirty = selectIsErathosDirty(state);

  console.log('[DEBUG] confirmUnsavedChanges called. isDirty=', isDirty, 'sessionId=', state.sessions.currentSessionId, 'snapshot=', state.sessions.erathosSnapshots[state.sessions.currentSessionId || ''], 'currentSchema=', state.dag.erathosSchema ? JSON.stringify(state.dag.erathosSchema).substring(0, 50) + '...' : null);

  if (!isDirty) return true;

  store.dispatch(setDiffModalOpen(true));

  return new Promise((resolve) => {
    globalResolve = resolve;
  });
};

export const resolveUnsavedChanges = (action: 'approve' | 'discard' | 'cancel') => {
  store.dispatch(setDiffModalOpen(false));

  const state = store.getState();
  const sessionId = state.sessions.currentSessionId;
  const currentSchema = state.dag.erathosSchema;
  const snapshotStr = sessionId ? state.sessions.erathosSnapshots[sessionId] : null;
  
  if (action === 'approve') {
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      targetSessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
      store.dispatch({ type: 'sessions/setCurrentSessionId', payload: targetSessionId });
      store.dispatch({ type: 'sessions/updateSessionStatus', payload: { id: targetSessionId, status: 'idle' } });
    }
    
    if (currentSchema) {
      store.dispatch(setErathosSnapshot({ sessionId: targetSessionId, schema: currentSchema }));
      vscode.postMessage({ type: 'codernic:update-session-schema', payload: { sessionId: targetSessionId, schema: currentSchema } });
    }
    if (globalResolve) globalResolve(true);
  } else if (action === 'discard') {
    // Restore schema to snapshot
    if (snapshotStr) {
      try {
        store.dispatch(setErathosSchema(JSON.parse(snapshotStr)));
      } catch(e) {
        store.dispatch(setErathosSchema(null));
      }
    } else {
      store.dispatch(setErathosSchema(null));
    }
    if (globalResolve) globalResolve(true);
  } else { // cancel
    if (globalResolve) globalResolve(false);
  }
  
  globalResolve = null;
};
