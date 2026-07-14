import { all, put, takeEvery, delay, call, select, takeLatest, actionChannel, take } from 'redux-saga/effects';
import { callMcpTool } from '../../../shared/api/mcp-client';
import type { AgentRunState, AnalyseProgressState, PhaseGateState, RagProgressState, PirsigMetrics } from '../../../entities/kernel/model/types';
import type { JourneyPhase } from '../../../../../codernic-ext/src/features/codernic/model/journey-state';
import { sendIntent } from '../../../shared/store/intent';
import type { RootState } from '../../../store';
import { fetchArtifactContentSuccess } from '../../../entities/artifacts/model/artifacts-slice';

import {
  agentRunStarted,
  updateKernelState,
  setAnalyseProgress,
  setRagProgress,
  setPhaseGate,
  setJourneyPhase,
  setPirsigMetrics,
  setApprovalRequest,
  setArtifactReview,
  setErathosSyncing,
} from './dag.slice';
import { updateSystemStatus } from '../../system/store/system.slice';

interface DagWsAction {
  type: string;
  payload?: Record<string, unknown> & {
    taskId?: string;
    profile?: string;
    currentStep?: string;
    percentage?: number;
    currentPhase?: number;
    type?: string;
    step_id?: string;
    delta?: string;
    status?: string;
    sessionId?: string;
  };
}

function* handleDagEvents(action: DagWsAction): Generator<any, void, any> {
  const type = action.type;
  const payload = action.payload;
  const currentSessionId: string | null = yield select((state: RootState) => state.sessions.currentSessionId);

  if (payload?.sessionId) {
    if (currentSessionId && payload.sessionId !== currentSessionId) {
      // Do not return. We must process events for other sessions so their state is updated in the background.
    }
  }

  if (type === 'WS/codernic:agent-run-started') {
    yield put(agentRunStarted({ sessionId: payload?.sessionId || currentSessionId || '', run: payload as unknown as AgentRunState }));
    yield put({ type: 'chat/setThinking', payload: { sessionId: payload?.sessionId || currentSessionId || '', state: { phase: 'executing' } } });
  } else if (type === 'WS/kernel_state_update') {
    yield put(updateKernelState(payload));
  } else if (type === 'WS/codernic:await-approval') {
    yield put(setApprovalRequest(payload as { id: string; prompt: string }));
  } else if (type === 'WS/ArtifactRequestedReview') {
    yield put(setArtifactReview(payload as { title: string; filename: string; content?: string }));
  } else if (type === 'WS/codernic:task-ready') {
    yield put({ type: 'chat/setRemoteTaskId', payload: { sessionId: payload?.sessionId || currentSessionId || '', taskId: payload?.taskId } });
  } else if (type === 'WS/codernic:analyse-started') {
    yield put(setAnalyseProgress({
      sessionId: payload?.sessionId || currentSessionId || '',
      progress: {
        steps: { 'tech-identification': 'pending', 'convention-mining': 'pending', 'agent-generation': 'pending' },
        currentStep: 'tech-identification',
        totalCostUSD: 0,
        profile: payload?.profile,
      } as unknown as AnalyseProgressState
    }));
    yield put({ type: 'chat/setThinking', payload: { sessionId: payload?.sessionId || currentSessionId || '', state: { phase: 'reasoning' } } });
  } else if (type === 'WS/codernic:analyse-progress') {
    yield put(setAnalyseProgress({ sessionId: payload?.sessionId || currentSessionId || '', progress: payload as unknown as AnalyseProgressState }));
    if (payload?.currentStep === null) {
      yield put({ type: 'chat/setSending', payload: false });
      yield put({ type: 'chat/setThinking', payload: { sessionId: payload?.sessionId || currentSessionId || '', state: { phase: 'idle' } } });
    }
  } else if (type === 'WS/codernic:journey-phase-gate') {
    yield put(setPhaseGate(payload as unknown as PhaseGateState));
  } else if (type === 'WS/codernic:indexing-progress') {
    yield put(setRagProgress(payload as unknown as RagProgressState));
    if (payload?.percentage === 100) {
      yield put(setRagProgress(null));
    }
  } else if (type === 'WS/codernic:indexing-done' || type === 'WS/codernic:indexing-error') {
    yield put(setRagProgress(null));
  } else if (type === 'WS/codernic:journey-phase-advanced') {
    yield put(setJourneyPhase(payload?.currentPhase as JourneyPhase));
    yield put(setPhaseGate(null));
  } else if (type === 'WS/codernic:ast-metrics') {
    yield put(setPirsigMetrics(payload as unknown as PirsigMetrics));
  } else if (type === 'WS/codernic:agent-event' || type === 'WS/codernic:agent-introspection') {
    const typeStr = payload.type || 'unknown';
    yield put({ type: 'dag/addIntrospectionEvent', payload: {
      type: typeStr,
      step_id: payload.step_id,
      delta: payload.delta,
      payload: payload.payload,
      timestamp: Date.now()
    }});
  } else if (type === 'WS/codernic:heartbeat') {
    yield put({ type: 'telemetry/updateHeartbeat', payload: payload.status });
    yield put(updateSystemStatus({ daemonStatus: payload.status === 'ok' ? 'running' : 'stopped' }));
  } else if (type === 'WS/codernic:health-telemetry') {
    yield put({ type: 'telemetry/updateDiagnostic', payload });
  }
}

interface ApprovalAction {
  type: string;
  payload: {
    id: string;
    verdict: string;
    feedback?: string;
  };
}

function* watchApprovals(action: ApprovalAction) {
  const { id, verdict, feedback } = action.payload;
  const currentSessionId: string | null = yield select((state: RootState) => state.sessions.currentSessionId);
  yield put(sendIntent({
    type: 'codernic:submit-approval',
    payload: { id, verdict, feedback, sessionId: currentSessionId },
  }));
}

interface ArtifactReviewAction {
  type: string;
  payload: {
    verdict: string;
    feedback?: string;
  };
}

function* watchArtifactReview(action: ArtifactReviewAction) {
  const { verdict, feedback } = action.payload;
  const currentSessionId: string | null = yield select((state: RootState) => state.sessions.currentSessionId);
  yield put(sendIntent({
    type: 'codernic:submit-approval',
    payload: { id: 'artifact', verdict, feedback, sessionId: currentSessionId },
  }));
}



function* handleSendSchemaToCodernic(action: any) {
  const schema = action.payload.schema;
  const currentSessionId: string | null = yield select((state: RootState) => state.sessions.currentSessionId);
  
  if (!currentSessionId) return;

  try {
    // 1. Activer le loading
    yield put(setErathosSyncing(true));

    // 2. Send schema to backend via MCP
    yield call(callMcpTool as any, 'update_erathos_schema', { session_id: currentSessionId, schema });

    // 3. Trigger silent chat evaluation ONLY after MCP confirms
    yield put(sendIntent({
      type: 'codernic:chat',
      payload: {
        text: "J'ai mis à jour le schéma de la base de données. Analyse-le.",
        sessionId: currentSessionId,
        metadata: { silent: true }
      }
    }));
  } catch (error) {
    console.error('Failed to update Erathos schema via MCP:', error);
  } finally {
    // 4. Désactiver le loading
    yield put(setErathosSyncing(false));
  }
}

function* watchSendSchemaChannel(): Generator {
  const channel: any = yield actionChannel('dag/sendSchemaToCodernic');
  while (true) {
    const action = yield take(channel);
    yield call(handleSendSchemaToCodernic, action);
  }
}

function* watchArtifactSchemaChannel(): Generator {
  const channel: any = yield actionChannel(fetchArtifactContentSuccess.type);
  while (true) {
    const action = yield take(channel);
    yield call(handleArtifactContentSuccess, action);
  }
}

export function* dagSaga(): Generator {
  yield all([
    takeEvery((action: DagWsAction) => action.type.startsWith('WS/'), handleDagEvents),
    takeEvery('dag/resolveApproval', watchApprovals),
    takeEvery('dag/resolveArtifactReview', watchArtifactReview),
    call(watchSendSchemaChannel),
    call(watchArtifactSchemaChannel),
  ]);
}

export function* handleArtifactContentSuccess(action: any) {
  const { filename, content } = action.payload;
  // If this is an Erathos schema artifact, inject it back
  if (filename && filename.endsWith('_schema.md') && content) {
    try {
      // The artifact is a markdown file containing ```json <schema> ```
      const match = content.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        const parsedSchema = JSON.parse(match[1]);
        if (parsedSchema && (parsedSchema.nodes || parsedSchema.version)) {
          const currentSessionId: string | null = yield select((state: RootState) => state.sessions.currentSessionId);
          if (currentSessionId) {
             // Rehydrate Erathos via MCP Tool
             yield call(callMcpTool as any, 'update_erathos_schema', {
               session_id: currentSessionId,
               schema: parsedSchema
             });
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse artifact schema content:', e);
    }
  }
}
