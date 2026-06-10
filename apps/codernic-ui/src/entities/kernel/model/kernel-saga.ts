import type { EventChannel } from 'redux-saga';
import { buffers, eventChannel } from 'redux-saga';
import { all, call, fork, put, select, take } from 'redux-saga/effects';
import type { JourneyPhase } from '../../../../../codernic-ext/src/features/codernic/model/journey-state';
import type { DagNode } from './use-kernel-tracker/i-dag-sequence';
import type {
  AgentRunState,
  AnalyseProgressState,
  DiagnosticInfo,
  PhaseGateState,
  SelectOption,
  ToolCall,
  RagProgressState,
  SessionMeta,
  PirsigMetrics,
  ChatMsg,
} from './types';
import type { KernelState } from './kernel-slice';
import {
  agentRunStarted,
  appendMessage,
  selectPendingAssistantId,
  sendIntent,
  setAnalyseProgress,
  setContextStats,
  setJourneyPhase,
  setPendingAssistantId,
  setPhaseGate,
  setContextFiles,
  setSending,
  setThinking,
  setWsStatus,
  updateAssistantMessage,
  updateKernelState,
  updateLlms,
  updateRouteProfiles,
  setApprovalRequest,
  resolveApproval,
  setRemoteTaskId,
  setRagProgress,
  setSessions,
  setCurrentSessionId,
  setMessages,
  selectMessages,
  setPirsigMetrics,
  addIntrospectionEvent,
  setMetrics,
  setArtifactReview,
  resolveArtifactReview,
} from './kernel-slice';
import { updateHeartbeat, updateDiagnostic } from '../../telemetry/model/telemetry-slice';

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
        
        // Fetch assets payload immediately upon connection
        ws?.send(JSON.stringify({ type: 'codernic:request-assets' }));

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
      } else if (msg.type === 'ac:route-profiles') {
        yield put(updateRouteProfiles(msg.payload as SelectOption[]));
      } else if (msg.type === 'codernic:agent-run-started') {
        yield put(agentRunStarted(msg.payload as AgentRunState));
        yield put(setThinking({ phase: 'executing' }));
      } else if (msg.type === 'kernel_state_update') {
        yield put(updateKernelState(msg.payload as { nodes: DagNode[] }));
      } else if (msg.type === 'codernic:await-approval') {
        yield put(setApprovalRequest(msg.payload as { id: string; prompt: string }));
      } else if (msg.type === 'ArtifactRequestedReview') {
        yield put(setArtifactReview(msg.payload as { title: string; filename: string }));
      } else if (msg.type === 'codernic:task-ready') {
        const { taskId } = msg.payload as { taskId: string };
        yield put(setRemoteTaskId(taskId));
      } else if (msg.type === 'codernic:sessions-list') {
        yield put(setSessions(msg.payload as SessionMeta[]));
      } else if (msg.type === 'codernic:session-loaded') {
        const payload = msg.payload as { id: string; messages: any[] };
        yield put(setCurrentSessionId(payload.id));
        yield put(setMessages(payload.messages));
      } else if (msg.type === 'codernic:assets-payload') {
        // Rediriger vers l'assetsSlice (via une action générique interceptée par le reducer ou un put manuel)
        yield put({ type: 'assets/setAssetsPayload', payload: msg.payload });
      }

      // ── 2. CHAT STREAMING ──
      else if (msg.type === 'codernic:thinking') {
        yield put(setThinking(msg.payload as any));
      } else if (msg.type === 'ac:chat-token' || msg.type === 'codernic:stream-chunk') {
        const { chunk, done, taskId } = msg.payload as { chunk: string; done?: boolean; taskId?: string };
        let pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;

        if (!pendingId && !chunk && !taskId) {
          // Ignore empty dummy tokens sent after errors to close the stream
          continue;
        }

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
          if (taskId) {
            yield put(updateAssistantMessage({ id: pendingId, taskId }));
          }
        } else {
          yield put(updateAssistantMessage({ id: pendingId, chunk, done, taskId }));
        }

        if (done) {
          yield put(setPendingAssistantId(null));
          yield put(setSending(false));
          yield put(setThinking({ phase: 'idle' }));
          yield put(setRemoteTaskId(null));
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
        yield put(setRemoteTaskId(null));
      } else if (msg.type === 'codernic:chat-done' || msg.type === 'ac:chat-done') {
        const pendingId: string | null = (yield select(selectPendingAssistantId)) as string | null;
        if (pendingId) {
          yield put(updateAssistantMessage({ id: pendingId, done: true }));
          yield put(setPendingAssistantId(null));
        }
        yield put(setSending(false));
        yield put(setThinking({ phase: 'idle' }));
        yield put(setRemoteTaskId(null));
      } else if (msg.type === 'ac:inference-metrics') {
        const payload = msg.payload as any;
        const metrics = {
          ttft_ms: payload.ttft_ms,
          tokens_per_second: payload.tokens_per_second,
          vram_allocated_bytes: payload.vram_allocated_bytes,
          context_tokens_count: payload.context_tokens_count
        };
        yield put(setMetrics(metrics));
        
        const messages: ChatMsg[] = (yield select(selectMessages)) as ChatMsg[];
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
        if (lastAssistantMsg) {
          yield put(updateAssistantMessage({ id: lastAssistantMsg.id, metrics }));
        }
      } else if (msg.type === 'codernic:get-sessions-result') {
        yield put(setSessions(msg.payload as SessionMeta[]));
      } else if (msg.type === 'codernic:load-session-result') {
        const payload = msg.payload as any;
        yield put(setCurrentSessionId(payload.id));
        // Clear history and append loaded messages
        yield put(setMessages([]));
        for (const m of payload.messages) {
           yield put(appendMessage({ id: uid(), role: m.role, text: m.content, streaming: false, toolCalls: [] }));
        }
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
      } else if (msg.type === 'codernic:indexing-progress') {
        yield put(setRagProgress(msg.payload as RagProgressState));
        if ((msg.payload as RagProgressState).percentage === 100) {
            yield put(setRagProgress(null));
        }
      } else if (msg.type === 'codernic:journey-phase-advanced') {
        yield put(setJourneyPhase((msg.payload as { currentPhase: JourneyPhase }).currentPhase));
        yield put(setPhaseGate(null));
      } else if (msg.type === 'codernic:ast-metrics') {
        yield put(setPirsigMetrics(msg.payload as PirsigMetrics));
      } else if (msg.type === 'codernic:agent-event') {
        const payload = msg.payload as any;
        const typeStr = payload.type || 'unknown';
        yield put(addIntrospectionEvent({
          type: typeStr,
          step_id: payload.step_id,
          delta: payload.delta,
          payload: payload.payload,
          timestamp: Date.now()
        }));
      } else if (msg.type === 'codernic:heartbeat') {
        yield put(updateHeartbeat((msg.payload as any).status));
      } else if (msg.type === 'codernic:health-telemetry') {
        yield put(updateDiagnostic(msg.payload as any));
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
        if (payload.files) {
          yield put(setContextFiles(payload.files));
        }
      }

      // ── 5. COST PREVIEW / PLAN CTA ──
      // Rendered inline in the chat feed as a plan-cta message, not a footer panel
      else if (msg.type === 'codernic:cost-preview') {
        const preview = msg.payload as { task: string; plan: string; cost: string; duration: string };
        yield put(appendMessage({
          id: uid(),
          role: 'plan-cta' as const,
          text: preview.plan,
          cost: preview.cost,
          duration: preview.duration,
          task: preview.task,
        } as any));
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

function* watchApprovalResolution(): Generator {
  while (true) {
    const action = (yield take(resolveApproval.type)) as {
      payload: { id: string; verdict: 'approve' | 'reject'; feedback?: string };
    };
    const { id, verdict, feedback } = action.payload;
    yield put(
      sendIntent({
        type: 'codernic:submit-approval',
        payload: { id, verdict, feedback },
      }),
    );
  }
}

function* watchArtifactReviewResolution(): Generator {
  while (true) {
    const action = (yield take(resolveArtifactReview.type)) as {
      payload: { verdict: 'approve' | 'reject'; feedback?: string };
    };
    const { verdict, feedback } = action.payload;
    // For artifacts, we send back a generic submit-approval with id: 'artifact'
    // since the rust engine wait_for_user_approval just waits for the next approval event.
    // Wait, the engine wait_for_user_approval in engine.rs currently waits for HumanApproval channel event.
    // Let's send a generic approval resolution. The dispatcher might match it via a standard intent.
    yield put(
      sendIntent({
        type: 'codernic:submit-approval',
        payload: { id: 'artifact', verdict, feedback },
      }),
    );
  }
}

export function* rootKernelSaga(): Generator {
  const env = (import.meta as unknown as { env: Record<string, string> }).env;
  const wsUrl = env?.VITE_CODERNIC_URL || 'ws://localhost:47321';
  const channel = (yield call(createWebSocketChannel, wsUrl)) as EventChannel<WsMessage>;
  yield all([
    fork(watchIncoming, channel),
    fork(watchOutgoing),
    fork(watchApprovalResolution),
    fork(watchArtifactReviewResolution),
  ]);
}
