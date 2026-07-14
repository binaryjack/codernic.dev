import type { EventChannel } from 'redux-saga';
import { buffers, eventChannel } from 'redux-saga';
import { all, call, fork, put, take, takeEvery } from 'redux-saga/effects';
import { vscode } from '../../../shared/api/vscode-api';
import { sendIntent } from '../../../shared/store/intent';
import { setWsStatus, setContextStats, updateSystemStatus, appendSystemLogsBatch } from './system.slice';
import { setSandboxMode } from '../../../entities/app/model/app-slice';
import { setDownloadStarted, setDownloadProgress, setDownloadDone } from '../../models/store/models.slice';
import { setValidationErrors } from '../../layout-engine/store/ui-commands.slice';
import { delay } from 'redux-saga/effects';
import { getMockData } from './mock-data-mapper';

type WsMessage = { type: string; payload?: unknown };

const outboxBuffer: unknown[] = [];

function createVsCodeChannel(): EventChannel<WsMessage> {
  return eventChannel((emitter) => {
    emitter({ type: 'WS_STATUS_CHANGE', payload: 'connected' });
    vscode.postMessage({ type: 'codernic:request-assets' });
    vscode.postMessage({ type: 'codernic:get-local-models' });

    while (outboxBuffer.length > 0) {
      const payload = outboxBuffer.shift();
      vscode.postMessage(payload);
    }

    const handler = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        if (typeof event.data.type === 'string' && (event.data.type.startsWith('codernic:') || event.data.type.startsWith('ac:') || event.data.type === 'kernel_state_update' || event.data.type === 'ArtifactRequestedReview')) {
          console.log('SAGA IN:', event.data);
          emitter({ type: 'WS_MESSAGE_RECEIVED', payload: event.data });
        }
      }
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, buffers.expanding(100));
}

function* watchIncoming(channel: EventChannel<WsMessage>): Generator {
  while (true) {
    const action = (yield take(channel)) as { type: string; payload: unknown };
    if (action.type === 'WS_STATUS_CHANGE') {
      yield put(setWsStatus(action.payload as 'connected' | 'disconnected' | 'connecting'));
    } else if (action.type === 'WS_MESSAGE_RECEIVED') {
      const msg = action.payload as WsMessage;
      yield put({ type: `WS/${msg.type}`, payload: msg.payload });
    }
  }
}

function* watchOutgoing(): Generator {
  yield takeEvery(sendIntent.type, function* (action: { type: string; payload: unknown }) {
    const msg = action.payload as { type: string; payload?: any };
    try {
      if (msg.type === 'codernic:daemon-action') {
        const actionType = msg.payload?.action;
        if (actionType === 'stop') {
          yield put(updateSystemStatus({ daemonStatus: 'stopping' }));
        } else if (actionType === 'start' || actionType === 'restart') {
          yield put(updateSystemStatus({ daemonStatus: 'starting' }));
        }
      }
      vscode.postMessage(msg);
    } catch (err) {
      console.error('[SAGA WS] Erreur d\'envoi', err);
    }
  });
}

interface SystemWsAction {
  type: string;
  payload?: Record<string, unknown> & {
    currentTokens?: number;
    current_tokens?: number;
    maxTokens?: number;
    max_tokens?: number;
    usagePercent?: number;
    usage_percent?: number;
    turnCount?: number;
    turn_count?: number;
    files?: unknown[];
  };
}

function* handleSystemEvents(action: SystemWsAction) {
  const type = action.type;
  const payload = action.payload;

  if (type === 'WS/codernic:context-window-update') {
    yield put(setContextStats({
      current_tokens: payload.currentTokens || payload.current_tokens || 0,
      max_tokens: payload.maxTokens || payload.max_tokens || 0,
      usage_percent: payload.usagePercent || payload.usage_percent || 0,
      turn_count: payload.turnCount || payload.turn_count || 0,
    }));
    if (payload.files) {
       yield put({ type: 'chat/setContextFiles', payload: payload.files });
    }
  }
}

function* handleSandboxToggle(action: { type: string; payload: boolean }) {
  if (typeof window !== 'undefined') {
    const current = localStorage.getItem('FORCE_SANDBOX_MODE');
    const next = action.payload ? 'true' : 'false';
    if (current !== next) {
      localStorage.setItem('FORCE_SANDBOX_MODE', next);
      window.location.reload();
    }
  }
}

interface SequencerStepAction {
  type: string;
  payload: {
    widget: string;
    data: string | Record<string, any>;
  };
}

function* handleSequencerStep(action: SequencerStepAction) {
  const { widget, data } = action.payload;

  if (typeof data === 'string' && data.startsWith('SIMULATE_')) {
    // Legacy hardcoded handlers
    if (data === 'SIMULATE_AJV_ERROR') {
      yield put(setValidationErrors({
        id: widget,
        errors: [
          "should have required property 'active_lora'",
          "should match pattern '^[a-zA-Z0-9_-]+$'"
        ]
      }));
    } else if (data === 'SIMULATE_DOWNLOAD_HF') {
      yield put(setDownloadStarted({
        id: 'demo-download',
        modelId: 'meta-llama/Llama-3-8B',
        file: 'model.safetensors',
        providerName: 'HuggingFace'
      }));
      yield delay(1000);
      yield put(setDownloadProgress({ id: 'demo-download', progress: '35%' }));
      yield delay(1000);
      yield put(setDownloadProgress({ id: 'demo-download', progress: '75%' }));
      yield delay(1000);
      yield put(setDownloadDone({ id: 'demo-download' }));
    } else if (data === 'SIMULATE_SANDBOX_WORKTREE') {
      yield put(appendSystemLogsBatch([
        '[SANDBOX] Starting isolated worktree check...',
        '[SANDBOX] Initializing environment clone in workspace directory...',
        '[SANDBOX] Worktree verification successful. Workspace is clean.'
      ]));
    }
    return;
  }

  // Generic Mock Data Injection Mapper
  let mockState: any = null;
  if (typeof data === 'string') {
    // Fallback to old behavior for backward compatibility (if any strings are left)
    mockState = getMockData(widget, data);
  } else if (typeof data === 'object' && data !== null) {
    mockState = data;
  }

  if (mockState && mockState.data) {
      console.log(`[Sequencer] Injecting mock data into slice '${mockState.slice}' for widget '${widget}'`);
      
      // Dispatch a standard payload depending on the slice
      switch (mockState.slice) {
        case 'chat':
          if (mockState.data.messages) {
            yield put({ type: 'chat/setMessages', payload: mockState.data.messages });
          }
          if (mockState.data.contextFiles) {
            yield put({ type: 'chat/setContextFiles', payload: mockState.data.contextFiles });
          }
          if (mockState.data.isAutopilot !== undefined) {
             yield put({ type: 'chat/setAutopilot', payload: mockState.data.isAutopilot });
          }
          if (mockState.data.isRagEnabled !== undefined) {
             yield put({ type: 'chat/setRagEnabled', payload: mockState.data.isRagEnabled });
          }
          if (mockState.data.activeMode) {
             yield put({ type: 'chat/setActiveMode', payload: mockState.data.activeMode });
          }
          break;
        case 'sessions':
          if (mockState.data.list) {
            const sessionsRecord: Record<string, any> = {};
            mockState.data.list.forEach((s: any) => {
              sessionsRecord[s.id] = {
                id: s.id,
                name: s.name,
                status: 'idle',
                last_updated: new Date(s.date).getTime()
              };
            });
            yield put({ type: 'sessions/setSessions', payload: sessionsRecord });
          }
          if (mockState.data.currentId) {
            yield put({ type: 'sessions/setCurrentSessionId', payload: mockState.data.currentId });
          }
          break;
        case 'artifacts':
          if (mockState.data.items) {
             yield put({ type: 'artifacts/fetchArtifactsSuccess', payload: mockState.data.items });
          }
          break;
        case 'models':
          if (mockState.data.localModels) {
             yield put({ type: 'models/setLocalModels', payload: mockState.data.localModels });
          }
          if (mockState.data.activeDownloads) {
             for (const dl of mockState.data.activeDownloads) {
               yield put({ type: 'models/setDownloadStarted', payload: { id: dl.id, modelId: dl.model } });
               yield put({ type: 'models/setDownloadProgress', payload: { id: dl.id, progress: dl.progress } });
             }
          }
          break;
        case 'pirsig':
          yield put({ type: 'dag/setPirsigMetrics', payload: {
            kpi_score: mockState.data.kpi_score || mockState.data.score || 0,
            symbols_count: mockState.data.symbols_count || 0,
            qualitative_flags: mockState.data.qualitative_flags || mockState.data.flags || []
          }});
          break;
        case 'introspection':
          if (mockState.data.nodes) {
             yield put({ type: 'introspection/initIntrospection', payload: { introspectionId: 'mock-intro', sessionId: 'mock-session', mode: 'deterministic' } });
             yield put({ type: 'introspection/setActiveIntrospection', payload: 'mock-intro' });
             for (const node of mockState.data.nodes) {
               yield put({ type: 'introspection/addIntrospectionNode', payload: { introspectionId: 'mock-intro', node } });
             }
          }
          if (mockState.data.confidence !== undefined) {
             yield put({ type: 'introspection/setConfidenceScore', payload: { introspectionId: 'mock-intro', score: mockState.data.confidence } });
          }
          break;
        case 'dag':
          if (mockState.data.nodes) {
             yield put({ type: 'dag/setNodes', payload: mockState.data.nodes });
          }
          if (mockState.data.edges) {
             yield put({ type: 'dag/setEdges', payload: mockState.data.edges });
          }
          break;
        case 'agent_events':
          if (mockState.data.events) {
            yield put({ type: 'dag/clearIntrospectionEvents' });
            for (const evt of mockState.data.events) {
              yield put({ type: 'dag/addIntrospectionEvent', payload: evt });
            }
          }
          break;
        default:
          console.warn(`[Sequencer] Unknown slice '${mockState.slice}' for mock data injection`);
      }
    } else {
      console.warn(`[Sequencer] No valid mock data found for widget '${widget}'`);
    }
}

export function* systemSaga(): Generator {
  const channel = (yield call(createVsCodeChannel)) as EventChannel<WsMessage>;
  yield all([
    fork(watchIncoming, channel),
    fork(watchOutgoing),
    takeEvery((action: SystemWsAction) => action.type.startsWith('WS/'), handleSystemEvents),
    takeEvery(setSandboxMode.type, handleSandboxToggle),
    takeEvery('sequencer/executeStep', handleSequencerStep)
  ]);
}
