import type { EventChannel } from 'redux-saga';
import { buffers, eventChannel } from 'redux-saga';
import { all, call, fork, put, select, take } from 'redux-saga/effects';
import type { JourneyPhase } from '../../../../../vscode-extension/src/features/codernic/model/journey-state';
import type { DagNode } from './use-kernel-tracker/i-dag-sequence';
import type {
  AgentRunState,
  AnalyseProgressState,
  DiagnosticInfo,
  PhaseGateState,
  SelectOption,
  ToolCall,
} from './types';
import type { KernelState } from './kernel-slice';
import {
  agentRunStarted,
  appendMessage,
  selectPendingAssistantId,
  sendIntent,
  setAnalyseProgress,
  setContextStats,
  setCostPreview,
  setJourneyPhase,
  setPendingAssistantId,
  setPhaseGate,
  setSending,
  setThinking,
  setWsStatus,
  updateAssistantMessage,
  updateKernelState,
  updateLlms,
} from './kernel-slice';

type WsMessage = { type: string; payload?: unknown };

let ws: WebSocket | null = null;
const outboxBuffer: unknown[] = [];

const uid = (): string => Math.random().toString(36).slice(2, 10);

function createWebSocketChannel(url: string): EventChannel<WsMessage> {
  return eventChannel((emitter) => {
    const connect = () => {
      emitter({ type: 'WS_STATUS_CHANGE', payload: 'connecting' });
      ws = new WebSocket(url);

      ws.onopen = () => {
        emitter({ type: 'WS_STATUS_CHANGE', payload: 'connected' });
        // Purge de la file d'attente hors-ligne
        while (outboxBuffer.length > 0) {
          const payload = outboxBuffer.shift();
          ws?.send(JSON.stringify(payload));
        }
      };

      ws.onclose = () => {
        emitter({ type: 'WS_STATUS_CHANGE', payload: 'disconnected' });
        setTimeout(() => connect(), 3000); // Reconnexion automatique avec backoff
      };

      ws.onerror = (err) => {
        console.error('[SAGA WS] Erreur réseau', err);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WS IN:', message);
          emitter({ type: 'WS_MESSAGE_RECEIVED', payload: message });
        } catch (err) {
          console.error('[SAGA WS] Erreur parsing message', err);
        }
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, buffers.expanding(100));
}

export function* watchIncoming(channel: EventChannel<WsMessage>): Generator {
  while (true) {
    const action = (yield take(channel)) as { type: string; payload: unknown };
    if (action.type === 'WS_STATUS_CHANGE') {
      yield put(setWsStatus(action.payload as KernelState['wsStatus']));
    } else if (action.type === 'WS_MESSAGE_RECEIVED') {
      const msg = action.payload as WsMessage;

      // ── 1. INFRASTRUCTURE & DAG ──
      if (msg.type === 'ac:llms') {
        yield put(updateLlms(msg.payload as SelectOption[]));
      } else if (msg.type === 'codernic:agent-run-started') {
        yield put(agentRunStarted(msg.payload as AgentRunState));
        yield put(setThinking({ phase: 'executing' }));
      } else if (msg.type === 'kernel_state_update') {
        yield put(updateKernelState(msg.payload as { nodes: DagNode[] }));
      }

      // ── 2. CHAT STREAMING ──
      else if (msg.type === 'ac:chat-token' || msg.type === 'codernic:stream-chunk') {
        const { chunk, done } = msg.payload as { chunk: string; done?: boolean };
        let pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;

        if (!pendingId) {
          pendingId = uid();
          yield put(setPendingAssistantId(pendingId));
          yield put(
            appendMessage({
              id: pendingId,
              role: 'assistant',
              text: chunk || '',
              streaming: !done,
              toolCalls: [],
            }),
          );
          yield put(setThinking({ phase: 'writing' }));
        } else {
          yield put(updateAssistantMessage({ id: pendingId, chunk, done }));
        }

        if (done) {
          yield put(setPendingAssistantId(null));
          yield put(setSending(false));
          yield put(setThinking({ phase: 'idle' }));
        }
      } else if (msg.type === 'codernic:tool-call' || msg.type === 'tool-call') {
        const tool = msg.payload as ToolCall;
        let pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;
        if (!pendingId) {
          pendingId = uid();
          yield put(setPendingAssistantId(pendingId));
          yield put(
            appendMessage({
              id: pendingId,
              role: 'assistant',
              text: '',
              streaming: true,
              toolCalls: [],
            }),
          );
        }
        yield put(
          updateAssistantMessage({
            id: pendingId,
            toolCall: { ...tool, status: 'running' },
          }),
        );
        yield put(setThinking({ phase: 'executing', detail: `Running ${tool.name}...` }));
      } else if (msg.type === 'tool-response') {
        const pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;
        if (pendingId) {
          yield put(
            updateAssistantMessage({
              id: pendingId,
              toolCall: { ...(msg.payload as ToolCall), status: 'success' },
            }),
          );
          yield put(setThinking({ phase: 'reflecting' }));
        }
      } else if (msg.type === 'codernic:diagnostic') {
        const pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;
        if (pendingId) {
          yield put(
            updateAssistantMessage({ id: pendingId, diagnostic: msg.payload as DiagnosticInfo }),
          );
        }
      } else if (msg.type === 'ac:chat-error') {
        const payload = msg.payload as any;
        let pendingId = yield select(selectPendingAssistantId);
        if (!pendingId) {
          pendingId = uid();
          yield put(setPendingAssistantId(pendingId));
          yield put(
            appendMessage({
              id: pendingId,
              role: 'assistant',
              text: '\n\n❌ Error: ' + payload.text,
              streaming: false,
              toolCalls: [],
            }),
          );
        } else {
          yield put(
            updateAssistantMessage({
              id: pendingId,
              chunk: '\n\n❌ Error: ' + payload.text,
              done: true,
            }),
          );
        }
        yield put(setPendingAssistantId(null));
        yield put(setSending(false));
        yield put(setThinking({ phase: 'idle' }));
      } else if (msg.type === 'codernic:chat-done' || msg.type === 'ac:chat-done') {
        const pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;
        if (pendingId) {
          yield put(updateAssistantMessage({ id: pendingId, done: true }));
          yield put(setPendingAssistantId(null));
        }
        yield put(setSending(false));
        yield put(setThinking({ phase: 'idle' }));
      }

      // ── 3. ANALYSE & JOURNEY ──
      else if (msg.type === 'codernic:analyse-started') {
        yield put(
          setAnalyseProgress({
            steps: {
              'tech-identification': 'pending',
              'convention-mining': 'pending',
              'agent-generation': 'pending',
            },
            currentStep: 'tech-identification',
            totalCostUSD: 0,
            profile: (msg.payload as { profile: string }).profile,
          }),
        );
        yield put(setThinking({ phase: 'reasoning' }));
      } else if (msg.type === 'codernic:analyse-progress') {
        yield put(setAnalyseProgress(msg.payload as AnalyseProgressState));
        if ((msg.payload as AnalyseProgressState).currentStep === null) {
          yield put(setSending(false));
          yield put(setThinking({ phase: 'idle' }));
        }
      } else if (msg.type === 'codernic:journey-phase-gate') {
        yield put(setPhaseGate(msg.payload as PhaseGateState));
      } else if (msg.type === 'codernic:journey-phase-advanced') {
        yield put(setJourneyPhase((msg.payload as { currentPhase: JourneyPhase }).currentPhase));
        yield put(setPhaseGate(null));
      }

      // ── 4. TELEMETRY & CONTEXT ──
      else if (msg.type === 'codernic:context-window-update') {
        const payload = msg.payload as any;
        yield put(
          setContextStats({
            current_tokens: payload.currentTokens || payload.current_tokens || 0,
            max_tokens: payload.maxTokens || payload.max_tokens || 0,
            usage_percent: payload.usagePercent || payload.usage_percent || 0,
            turn_count: payload.turnCount || payload.turn_count || 0,
          }),
        );
      }

      // ── 5. COST PREVIEW & PLAN ──
      else if (msg.type === 'codernic:cost-preview') {
        yield put(setCostPreview(msg.payload as any));

        const pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;
        if (pendingId) {
          yield put(updateAssistantMessage({ id: pendingId, done: true }));
          yield put(setPendingAssistantId(null));
        }
        yield put(setSending(false));
        yield put(setThinking({ phase: 'idle' }));
      }

      // Compatibilité descendante (Pont d'événements)
      const legacyEvent = new MessageEvent('message', {
        data: msg,
        origin: window.location.origin,
      });
      window.dispatchEvent(legacyEvent);
    }
  }
}

function* watchOutgoing(): Generator {
  while (true) {
    const action = (yield take(sendIntent.type)) as { payload: unknown };
    const payload = action.payload;

    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('WS OUT:', payload);
      ws.send(JSON.stringify(payload));
    } else {
      outboxBuffer.push(payload);
    }
  }
}

export function* rootKernelSaga(): Generator {
  const env = (import.meta as unknown as { env: Record<string, string> }).env;
  const wsUrl = env?.VITE_CODERNIC_URL || 'ws://localhost:47321';
  const channel = (yield call(createWebSocketChannel, wsUrl)) as EventChannel<WsMessage>;
  yield all([fork(watchIncoming, channel), fork(watchOutgoing)]);
}
