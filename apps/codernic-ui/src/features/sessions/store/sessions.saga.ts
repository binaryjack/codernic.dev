import { all, put, takeEvery, select } from 'redux-saga/effects';
import { sendIntent } from '../../../shared/store/intent';
import type { RootState } from '../../../store';
import {
  setSessions,
  setCurrentSessionId,
  updateSessionStatus,
  setErathosSnapshot,
  removeSession,
} from './sessions.slice';
import { setErathosSchema } from '../../dag/store/dag.slice';
import type { SessionMeta } from '../../../entities/kernel/model/types';

const uid = (): string => Math.random().toString(36).slice(2, 10);

interface SessionsWsAction {
  type: string;
  payload?: SessionMeta[] | { id: string; messages: { role: string; content: string }[] } | unknown;
}

function* handleSessionsEvents(action: SessionsWsAction) {
  const type = action.type;
  const payload = action.payload;

  if (type === 'WS/codernic:sessions-list' || type === 'WS/codernic:get-sessions-result') {
    const sessionsArr = payload as SessionMeta[];
    const sessionsRecord: Record<string, SessionMeta> = {};
    for (const s of sessionsArr) { sessionsRecord[s.id] = s; }
    yield put(setSessions(sessionsRecord));
  } else if (type === 'WS/codernic:session-deleted') {
    const deletedId = typeof payload === 'string' ? payload : (payload as any)?.id || (payload as any)?.payload?.id;
    if (deletedId) {
      console.log('[sessionsSaga] Removing session:', deletedId);
      yield put(removeSession(deletedId));
    }
  } else if (type === 'WS/codernic:load-session-result') {
    const loadedPayload = payload as { id: string; messages: { role: string; content: string }[]; erathosSchema?: any; config?: any };
    yield put(setCurrentSessionId(loadedPayload.id));
    yield put({ type: 'chat/setMessages', payload: [] });
    for (const m of loadedPayload.messages) {
      yield put({
        type: 'chat/appendMessage',
        payload: { id: uid(), role: m.role, text: m.content, streaming: false, toolCalls: [] }
      });
    }
    
    // Restore Erathos schema from the session if it exists
    yield put(setErathosSchema(loadedPayload.erathosSchema || null));
    yield put(setErathosSnapshot({ sessionId: loadedPayload.id, schema: loadedPayload.erathosSchema || null }));

    if (loadedPayload.config) {
      if (loadedPayload.config.llm_id) yield put({ type: 'models/setSessionLlm', payload: { sessionId: loadedPayload.id, llm: loadedPayload.config.llm_id }});
      if (loadedPayload.config.use_rag !== undefined) yield put({ type: 'chat/setUseRag', payload: { sessionId: loadedPayload.id, useRag: loadedPayload.config.use_rag }});
      if (loadedPayload.config.auto_pilot !== undefined) yield put({ type: 'chat/setAutoPilot', payload: { sessionId: loadedPayload.id, autoPilot: loadedPayload.config.auto_pilot }});
      if (loadedPayload.config.current_mode) yield put({ type: 'chat/setMode', payload: { sessionId: loadedPayload.id, mode: loadedPayload.config.current_mode }});
    }

    // Reset transient UI states
    yield put({ type: 'chat/setSending', payload: false });
    yield put({ type: 'chat/setRemoteTaskId', payload: { sessionId: loadedPayload.id, taskId: null } });
    yield put({ type: 'dag/setAnalyseProgress', payload: { sessionId: loadedPayload.id, progress: null } });
    yield put({ type: 'dag/setRagProgress', payload: null });

    // Sync thinking state with session status
    const sessionsMap: Record<string, SessionMeta> = yield select((state: RootState) => state.sessions.sessions);
    const sessionStatus = sessionsMap[loadedPayload.id]?.status;
    if (sessionStatus === 'running') {
      yield put({ type: 'chat/setThinking', payload: { sessionId: loadedPayload.id, state: { phase: 'reasoning' } } });
    } else {
      yield put({ type: 'chat/setThinking', payload: { sessionId: loadedPayload.id, state: { phase: 'idle' } } });
    }
  } else if (type === 'WS/codernic:session-status') {
    const statusPayload = payload as { sessionId: string; status: SessionMeta['status'] };
    yield put(updateSessionStatus({ id: statusPayload.sessionId, status: statusPayload.status }));
  }
}

export function* handleIntentEvents(action: any): Generator<any, void, any> {
  if (action.payload?.type === 'codernic:export-session') {
    const currentSessionId: string | null = yield select((state: RootState) => state.sessions.currentSessionId);
    if (!currentSessionId) {
      alert("No active session to export.");
      return;
    }
    const messages = yield select((state: RootState) => state.chat.messages);
    const sessionMeta = yield select((state: RootState) => state.sessions.sessions[currentSessionId]);
    
    const exportData = {
      meta: sessionMeta,
      history: messages
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codernic-session-${(sessionMeta?.name || currentSessionId).replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export function* sessionsSaga(): Generator {
  yield all([
    takeEvery((action: SessionsWsAction) => action.type.startsWith('WS/'), handleSessionsEvents),
    takeEvery('intent/send', handleIntentEvents),
  ]);
}
