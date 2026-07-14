import { all, put, select, takeEvery, call } from 'redux-saga/effects';
import { createAction } from '@reduxjs/toolkit';
import type { ChatMsg, ThinkingState, ToolCall, DiagnosticInfo } from '../../../entities/kernel/model/types';
import { DiagnosticInfoSchema, ToolCallSchema, PlanCtaMsgSchema } from '@binaryjack/state-factories';
import {
  appendMessage,
  setPendingAssistantId,
  setSending,
  setThinking,
  updateAssistantMessage,
  setRemoteTaskId,
  selectIsPlanFrozen,
  selectMode,
  setMode,
  freezePlan,
  unfreezePlan,
  setProcessing,
  transitionToImplementNow,
} from './chat.slice';

const uid = (): string => Math.random().toString(36).slice(2, 10);

import type { RootState } from '../../../store';
import { sendIntent } from '../../../shared/store/intent';
import { selectActiveTaskId, abortCurrentTask, setPirsigAttempts, selectPirsigAttempts } from './chat.slice';
import { getCodernicHttpUrl } from '../../../shared/config';
import { selectAgentRun } from '../../../features/dag/store/dag.slice';
import { vscode } from '../../../shared';
import { WorkflowEngine } from './WorkflowEngine';
import type { ValidationContext, ValidationResult } from './WorkflowEngine';

export const submitChatMessage = createAction<{
  text: string;
  sessionId: string;
  sessionLlm: string | null;
  availableLlms: any[];
  contextFiles: any[];
  erathosSchema: any;
  useRag: boolean;
  isAutoPilot: boolean;
  messages: any[];
}>('chat/submitChatMessage');

interface WsAction {
  type: string;
  payload?: {
    chunk?: string;
    text?: string;
    done?: boolean;
    taskId?: string;
    name?: string;
    detail?: string;
    phase?: string;
    ttft_ms?: number;
    tokens_per_second?: number;
    vram_allocated_bytes?: number;
    context_tokens_count?: number;
    plan?: string;
    sessionId?: string;
  } & Record<string, unknown>;
}

function* handleChatEvents(action: WsAction) {
  const type = action.type;
  const payload = action.payload || {};
  const currentSessionId = yield select((state: RootState) => state.sessions.currentSessionId);

  const [activeTaskId, mode, useRag, autoPilot, builderSubMode] = yield select((state: RootState) => [
    state.chat.activeTaskIdBySession[payload.sessionId || ''],
    state.chat.modeBySession[payload.sessionId || ''] || 'brainstorm',
    state.chat.useRagBySession[payload.sessionId || ''] ?? true,
    state.chat.autoPilotBySession[payload.sessionId || ''] ?? false,
    state.chat.builderSubModeBySession[payload.sessionId || ''] || 'manuel',
  ]);

  const isBuilder = mode === 'builder';
  const isAutomaticOrDag = isBuilder && (builderSubMode === 'automatic' || builderSubMode === 'dag');
  const resolvedAutoPilot = autoPilot || isAutomaticOrDag;

  // Retrieve explicitly selected model from chat session (bypassing routes.json)
  const sessionLlm = yield select((state: RootState) => (state.sessions as any).llmsBySession?.[payload.sessionId || '']);

  if (type === 'WS/codernic:thinking') {
    let pendingId: string | null = (yield select((state: RootState) => state.chat.pendingAssistantId)) as string | null;
    yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: payload as unknown as ThinkingState }));
    if (payload.sessionId && payload.sessionId !== currentSessionId) return; // Background session, only update thinking state
    const introId = `intro-${payload.sessionId || currentSessionId || 'default'}`;
    yield put({ type: 'introspection/initIntrospection', payload: { introspectionId: introId, sessionId: payload.sessionId || currentSessionId || 'default', mode: 'free-flow' } });
    yield put({ type: 'introspection/setActiveIntrospection', payload: introId });
    yield put({ type: 'introspection/addIntrospectionNode', payload: {
      introspectionId: introId,
      node: {
        id: uid(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'phase',
        content: payload.detail || `Phase: ${payload.phase}`,
        messageId: pendingId || undefined
      }
    }});
  } else if (type === 'WS/ac:chat-token' || type === 'WS/codernic:stream-chunk') {
    // If background session, ignore chunk updates
    if (payload.sessionId && payload.sessionId !== currentSessionId) return;
    
    const chunk = payload.chunk || payload.text || '';
    const { done, taskId } = payload;
    let pendingId: string | null = (yield select((state: RootState) => state.chat.pendingAssistantId)) as string | null;

    if (!pendingId && !chunk && !taskId) return;

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
      const introId = `intro-${payload.sessionId || currentSessionId || 'default'}`;
      yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: { phase: 'writing' } }));

      if (taskId) {
        yield put(updateAssistantMessage({ id: pendingId, taskId, sessionId: payload.sessionId || currentSessionId || '' }));
      }

      const newCount = ((chunk || '').match(/<think>|<thought>/g) || []).length;
      if (newCount > 0) {
        const thoughtId = `${pendingId}-thought-0`;
        yield put({ type: 'introspection/addIntrospectionNode', payload: {
          introspectionId: introId,
          node: {
            id: thoughtId,
            timestamp: new Date().toLocaleTimeString(),
            type: 'thought',
            content: `LLM Reasoning Stream #1`,
            messageId: pendingId || undefined
          }
        }});
      }
    } else {
      const prevMessages = (yield select((state: RootState) => state.chat.messages)) as ChatMsg[];
      const prevMsg = prevMessages.find(m => m.id === pendingId);
      const prevText = prevMsg ? prevMsg.text : '';

      yield put(updateAssistantMessage({ id: pendingId, chunk, done, taskId, sessionId: payload.sessionId || currentSessionId || '' }));

      const prevCount = (prevText.match(/<think>|<thought>/g) || []).length;
      const newText = prevText + (chunk || '');
      const newCount = (newText.match(/<think>|<thought>/g) || []).length;
      
      if (newCount > prevCount) {
        const introId = `intro-${payload.sessionId || currentSessionId || 'default'}`;
        const thoughtId = `${pendingId}-thought-${newCount - 1}`;
        yield put({ type: 'introspection/addIntrospectionNode', payload: {
          introspectionId: introId,
          node: {
            id: thoughtId,
            timestamp: new Date().toLocaleTimeString(),
            type: 'thought',
            content: `LLM Reasoning Stream #${newCount}`,
            messageId: pendingId || undefined
          }
        }});
      }
    }

    if (done) {
      const prevMessages = (yield select((state: RootState) => state.chat.messages)) as ChatMsg[];
      const pendingId = (yield select((state: RootState) => state.chat.pendingAssistantId)) as string | null;
      if (pendingId) {
        const msg = prevMessages.find(m => m.id === pendingId);
        if (msg && msg.text) {
          const structuraMatch = msg.text.match(/```(structura|erathos-snapshot)\n([\s\S]*?)```/);
          if (structuraMatch) {
            const jsonStr = structuraMatch[2];
            try {
              const baseUrl = getCodernicHttpUrl();
              const pirsigResponse: Response = yield call(fetch, `${baseUrl}/api/pirsig/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: jsonStr, technology: 'json' })
              });
              const pirsigResult: any = yield call([pirsigResponse, 'json']);
              
              if (!pirsigResult.valid) {
                const sessionId = payload.sessionId || currentSessionId || 'default';
                const pirsigAttempts = (yield select((state: RootState) => selectPirsigAttempts(state, sessionId))) as number + 1;
                
                if (pirsigAttempts <= 3) {
                  yield put(setPirsigAttempts({ sessionId, attempts: pirsigAttempts }));
                  const errorMsgs = pirsigResult.report.violations.map((v: any) => v.message).join('\n');
                  yield put(appendMessage({
                    id: uid(),
                    role: 'user',
                    text: `[PIRSIG-SHIELD] Structural validation failed. Please fix the JSON according to the DAGExchange schema.\n\nViolations:\n${errorMsgs}`,
                  }));
                  // Trigger healing loop
                  const payloadToSend = isPlanGenRequest
                    ? { task: text, mode: activeMode, llmId: sessionLlm, contextFiles, erathosSchema, sessionId, useRag, yolo: isAutoPilot }
                    : { llmId: sessionLlm, history, mode: activeMode, contextFiles, erathosSchema, sessionId, useRag, yolo: isAutoPilot };
                  yield put(sendIntent({ type: 'codernic:chat', payload: payloadToSend }));
                  return; // Stop current saga execution so we wait for the next turn
                } else {
                  yield put(setPirsigAttempts({ sessionId, attempts: 0 }));
                  yield put(appendMessage({
                    id: uid(),
                    role: 'assistant',
                    text: '',
                    diagnostic: {
                      code: 'PIRSIG_VALIDATION_FAILED',
                      title: 'Validation Pirsig Echouée',
                      message: 'Le modèle a échoué 3 fois à générer un schéma valide.',
                      fix_suggestion: pirsigResult.report.violations[0]?.message,
                    }
                  }));
                }
              } else {
                const sessionId = payload.sessionId || currentSessionId || 'default';
                yield put(setPirsigAttempts({ sessionId, attempts: 0 }));
              }
            } catch (e) {
              console.error("Pirsig validation error:", e);
            }
          }
        }
      }

      const introId = `intro-${payload.sessionId || currentSessionId || 'default'}`;
      yield put(setPendingAssistantId(null));
      yield put(setSending(false));
      yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: { phase: 'idle' } }));

      yield put(setRemoteTaskId({ sessionId: payload.sessionId || currentSessionId || '', taskId: null }));
    }
  } else if (type === 'WS/codernic:tool-call' || type === 'WS/tool-call') {
    if (payload.sessionId && payload.sessionId !== currentSessionId) return;

    let validatedPayload: ToolCall;
    try {
      validatedPayload = ToolCallSchema.parse(payload as any) as unknown as ToolCall;
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown validation error';
      yield put(appendMessage({
        id: uid(),
        role: 'assistant',
        text: '',
        diagnostic: {
           code: 'SCHEMA_INVALID',
           title: 'Erreur Système',
           message: 'Le modèle a généré une structure inattendue pour l\'outil. Action annulée.',
           fix_suggestion: errorMsg,
           documentation_url: 'https://docs.codernic.ai'
        }
      }));
      yield put(sendIntent({ type: 'codernic:telemetry-log', payload: { type: 'hallucination', rawPayload: payload, validationError: errorMsg } }));
      return;
    }

    let pendingId: string | null = (yield select((state: RootState) => state.chat.pendingAssistantId)) as string | null;
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
        toolCall: { ...validatedPayload, status: 'running' },
      }),
    );
    const introId = `intro-${payload.sessionId || currentSessionId || 'default'}`;
    yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: { phase: 'executing', detail: `Running ${validatedPayload.name}...` } }));
    yield put({ type: 'introspection/addIntrospectionNode', payload: {
      introspectionId: introId,
      node: {
        id: uid(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'tool_call',
        content: `Executing tool: ${validatedPayload.name}\n${JSON.stringify(validatedPayload.args || {})}`,
        messageId: pendingId || undefined
      }
    }});
  } else if (type === 'WS/tool-response') {
    const pendingId: string | null = (yield select((state: RootState) => state.chat.pendingAssistantId)) as string | null;
    if (pendingId) {
      yield put(
        updateAssistantMessage({
          id: pendingId,
          toolCall: { ...(payload as unknown as ToolCall), status: 'success' } as ToolCall,
        }),
      );
      const introId = `intro-${payload.sessionId || currentSessionId || 'default'}`;
      yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: { phase: 'reflecting' } }));
      yield put({ type: 'introspection/addIntrospectionNode', payload: {
        introspectionId: introId,
        node: {
          id: uid(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'convergence',
          content: `Processed response for tool execution.`,
          messageId: pendingId || undefined
        }
      }});
    }
  } else if (type === 'WS/codernic:diagnostic') {
    const pendingId: string | null = (yield select((state: RootState) => state.chat.pendingAssistantId)) as string | null;
    if (pendingId) {
      try {
        const validatedPayload = DiagnosticInfoSchema.parse(payload as any) as unknown as DiagnosticInfo;
        yield put(updateAssistantMessage({ id: pendingId, diagnostic: validatedPayload }));
      } catch (err: any) {
        const errorMsg = err.message || 'Unknown validation error';
        yield put(appendMessage({
          id: uid(),
          role: 'assistant',
          text: '',
          diagnostic: {
             code: 'SCHEMA_INVALID',
             title: 'Erreur Système',
             message: 'Le modèle a généré une structure inattendue pour le diagnostic. Action annulée.',
             fix_suggestion: errorMsg,
             documentation_url: 'https://docs.codernic.ai'
          }
        }));
        yield put(sendIntent({ type: 'codernic:telemetry-log', payload: { type: 'hallucination', rawPayload: payload, validationError: errorMsg } }));
      }
    }
  } else if (type === 'WS/ac:chat-error') {
    let pendingId = yield select((state: RootState) => state.chat.pendingAssistantId);
    const sending = yield select((state: RootState) => state.chat.sending);

    if (!pendingId && !sending) {
      // Unsolicited background error (e.g. from Daemon at startup)
      yield put({ 
        type: 'system/appendSystemLogsBatch', 
        payload: [{ message: '[DAEMON ERROR/WARN] ' + payload.text, timestamp: new Date().toISOString() }] 
      });
      yield put({ 
        type: 'notifications/pushNotification', 
        payload: { 
          id: uid(), 
          message: 'Background system error occurred. Check System Logs.', 
          level: 'error', 
          is_read: false, 
          created_at: Date.now() 
        } 
      });
      return;
    }

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
    yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: { phase: 'idle' } }));
    yield put(setRemoteTaskId({ sessionId: payload.sessionId || currentSessionId || '', taskId: null }));
  } else if (type === 'WS/codernic:chat-done' || type === 'WS/ac:chat-done') {
    const pendingId: string | null = (yield select((state: RootState) => state.chat.pendingAssistantId)) as string | null;
    if (pendingId) {
      yield put(updateAssistantMessage({ id: pendingId, done: true }));
      yield put(setPendingAssistantId(null));
    }
    yield put(setSending(false));
    yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: { phase: 'idle' } }));
    yield put(setRemoteTaskId({ sessionId: payload.sessionId || currentSessionId || '', taskId: null }));
  } else if (type === 'WS/ac:inference-metrics') {
    const metrics = {
      ttft_ms: payload.ttft_ms,
      tokens_per_second: payload.tokens_per_second,
      vram_allocated_bytes: payload.vram_allocated_bytes,
      context_tokens_count: payload.context_tokens_count
    };
    
    yield put({ type: 'system/setMetrics', payload: metrics });
    
    const messages = (yield select((state: RootState) => state.chat.messages)) as ChatMsg[];
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      yield put(updateAssistantMessage({ id: lastAssistantMsg.id, metrics }));
    }
  } else if (type === 'WS/codernic:cost-preview') {
    try {
      // Structura strict validation
      const validatedPayload = PlanCtaMsgSchema.parse(payload) as any;
      yield put(appendMessage({
        id: uid(),
        role: 'plan-cta' as 'assistant',
        text: validatedPayload.plan || payload.plan,
      } as ChatMsg));
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown validation error';
      yield put(appendMessage({
        id: uid(),
        role: 'assistant',
        text: '',
        diagnostic: {
           code: 'SCHEMA_INVALID',
           title: 'Erreur Système',
           message: 'Le modèle a généré une structure inattendue pour le plan d\'action. Action annulée.',
           fix_suggestion: errorMsg,
           documentation_url: 'https://docs.codernic.ai'
        }
      }));
      yield put(sendIntent({ type: 'codernic:telemetry-log', payload: { type: 'hallucination', rawPayload: payload, validationError: errorMsg } }));
    }
    yield put(setSending(false));
    yield put(setThinking({ sessionId: payload.sessionId || currentSessionId || '', state: { phase: 'idle' } }));
  }
}

function* handleAbortTask(action: ReturnType<typeof abortCurrentTask>) {
  const { sessionId } = action.payload;
  const taskId = (yield select((state: RootState) => selectActiveTaskId(state, sessionId))) as string | null;
  if (taskId) {
    yield put(sendIntent({ type: 'codernic:abort-task', payload: { task_id: taskId } }));
  }
}

function* handleSubmitChatMessage(action: ReturnType<typeof submitChatMessage>) {
  try {
    yield put(setProcessing(true));

    const {
      text,
      sessionId,
      sessionLlm,
      contextFiles,
      erathosSchema,
      useRag,
      isAutoPilot,
      messages,
    } = action.payload;

    const mode = (yield select((state: RootState) => selectMode(state, sessionId))) as string;
    const isPlanFrozen = (yield select((state: RootState) => selectIsPlanFrozen(state, sessionId))) as boolean;

    const command = text.trim().startsWith('/') ? text.trim().split(/\s+/)[0] : '';
    const validationCtx: ValidationContext = {
      command,
      mode,
      isPlanFrozen,
    };

    const validationResult: ValidationResult = WorkflowEngine.validateCommand(validationCtx);

    if (!validationResult.allowed) {
      const actionsToPut: any[] = [];
      const fakeDispatch = (act: any) => {
        actionsToPut.push(act);
      };
      WorkflowEngine.executeBlockedVectors(validationResult, fakeDispatch);
      for (const act of actionsToPut) {
        yield put(act);
      }
      return;
    }

    // Execute slash command actions
    let activeMode = mode;
    if (command === '/plan') {
      activeMode = 'plan';
      yield put(setMode({ sessionId, mode: 'plan' }));
      yield put(sendIntent({ type: 'codernic:update-session-config', payload: { sessionId, currentMode: 'plan' } }));
      vscode.postMessage({ type: 'codernic:set-last-mode', payload: { mode: 'plan' } });
    } else if (command === '/freeze') {
      yield put(freezePlan({ sessionId }));
      yield put(appendMessage({ id: uid(), role: 'user', text }));
      yield put(setSending(true));
      yield put(setThinking({ sessionId, state: { phase: 'thinking' } }));
      yield put(sendIntent({ type: 'codernic:freeze', payload: { sessionId } }));
      return;
    } else if (command === '/cf') {
      yield put(unfreezePlan({ sessionId }));
      yield put(appendMessage({ id: uid(), role: 'user', text }));
      yield put(setSending(true));
      yield put(setThinking({ sessionId, state: { phase: 'thinking' } }));
      yield put(sendIntent({ type: 'codernic:cancel-freeze', payload: { sessionId } }));
      return;
    } else if (command === '/dag' || command === '/impl' || command === '/implementnow') {
      activeMode = 'builder';
      yield put(transitionToImplementNow({ sessionId }));
      yield put(sendIntent({ type: 'codernic:update-session-config', payload: { sessionId, currentMode: 'builder' } }));
      vscode.postMessage({ type: 'codernic:set-last-mode', payload: { mode: 'builder' } });
      yield put(appendMessage({ id: uid(), role: 'user', text }));
      yield put(setSending(true));
      yield put(setThinking({ sessionId, state: { phase: 'thinking' } }));
      yield put(sendIntent({ type: 'codernic:implement', payload: { sessionId } }));
      return;
    }

    // Append user message
    yield put(appendMessage({ id: uid(), role: 'user', text }));
    yield put(setSending(true));
    yield put(setThinking({ sessionId, state: { phase: 'thinking' } }));

    // Initialize introspection session immediately
    const introId = `intro-${sessionId}`;
    yield put({ type: 'introspection/initIntrospection', payload: { introspectionId: introId, sessionId, mode: 'free-flow' } });
    yield put({ type: 'introspection/setActiveIntrospection', payload: introId });

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', text: m.text }));
    history.push({ role: 'user', text });

    const agentRun = yield select((state: RootState) => selectAgentRun(state, sessionId));
    const isPlanGenRequest = activeMode === 'agent' && !!agentRun && agentRun.status === 'running';

    const payload = isPlanGenRequest
      ? { task: text, mode: activeMode, llmId: sessionLlm, contextFiles, erathosSchema, sessionId, useRag, yolo: isAutoPilot }
      : { llmId: sessionLlm, history, mode: activeMode, contextFiles, erathosSchema, sessionId, useRag, yolo: isAutoPilot };

    yield put(sendIntent({ type: 'codernic:chat', payload }));
  } catch (error) {
    console.error('[handleSubmitChatMessage] Error in chat workflow:', error);
  } finally {
    yield put(setProcessing(false));
  }
}

export function* chatSaga(): Generator {
  yield all([
    takeEvery((action: WsAction) => action.type.startsWith('WS/'), handleChatEvents),
    takeEvery(abortCurrentTask.type, handleAbortTask),
    takeEvery(submitChatMessage.type, handleSubmitChatMessage),
  ]);
}
