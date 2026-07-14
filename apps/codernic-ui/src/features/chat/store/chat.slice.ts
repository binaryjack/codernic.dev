import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ChatMsg, AssistantMsg, CodernicContextFile, ThinkingState, ToolCall, DiagnosticInfo } from '../../../entities/kernel/model/types';
import type { InferenceMetrics } from '../../../entities/kernel/model/types';
import type { CodernicMode } from '../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import type { RootState } from '../../../store';
import { StateTransitionVerifier } from '../../../shared/util/StateTransitionVerifier';
import { createChatState } from '@binaryjack/state-factories';

export interface ChatState {
  messages: ChatMsg[];
  pendingAssistantId: string | null;
  contextFiles: CodernicContextFile[];
  isDragging: boolean;
  modeBySession: Record<string, CodernicMode>;
  sending: boolean;
  activeTaskIdBySession: Record<string, string | null>;
  thinkingBySession: Record<string, ThinkingState>;
  useRagBySession: Record<string, boolean>;
  autoPilotBySession: Record<string, boolean>;
  builderSubModeBySession: Record<string, 'manuel' | 'automatic' | 'dag'>;
  isPlanFrozenBySession: Record<string, boolean>;
  isProcessing: boolean;
  pirsigAttemptsBySession: Record<string, number>;
}

const initialState: ChatState = createChatState() as unknown as ChatState;

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    appendMessage(state, action: PayloadAction<ChatMsg>) {
      state.messages.push(action.payload);
    },
    setMessages(state, action: PayloadAction<ChatMsg[]>) {
      state.messages = action.payload;
    },
    updateAssistantMessage(
      state,
      action: PayloadAction<{
        id: string;
        chunk?: string;
        toolCall?: ToolCall;
        diagnostic?: DiagnosticInfo;
        done?: boolean;
        taskId?: string;
        metrics?: InferenceMetrics;
        sessionId?: string;
      }>,
    ) {
      const { id, chunk, toolCall, diagnostic, done, taskId, metrics, sessionId } = action.payload as any;
      if (taskId && sessionId) {
        state.activeTaskIdBySession[sessionId] = taskId;
      }
      const msg = state.messages.find((m) => m.id === id) as AssistantMsg;
      if (msg) {
        if (chunk) msg.text += chunk;
        if (toolCall) {
          if (!msg.toolCalls) msg.toolCalls = [];
          const existing = msg.toolCalls.find((t: ToolCall) => t.id === toolCall.id);
          if (existing) {
            Object.assign(existing, toolCall);
          } else {
            msg.toolCalls.push(toolCall);
          }
        }
        if (diagnostic) msg.diagnostic = diagnostic;
        if (metrics) msg.metrics = metrics;
        if (done) {
          msg.streaming = false;
          if (sessionId) {
            state.activeTaskIdBySession[sessionId] = null;
          }
        }
      }
    },
    setPendingAssistantId(state, action: PayloadAction<string | null>) {
      state.pendingAssistantId = action.payload;
    },
    setRemoteTaskId(state, action: PayloadAction<{ sessionId: string, taskId: string | null }>) {
      state.activeTaskIdBySession[action.payload.sessionId] = action.payload.taskId;
    },
    abortCurrentTask(state, action: PayloadAction<{ sessionId: string }>) {
      state.sending = false;
      state.thinkingBySession[action.payload.sessionId] = { phase: 'idle' };
      state.activeTaskIdBySession[action.payload.sessionId] = null;
      state.pendingAssistantId = null;
    },
    setMode(state, action: PayloadAction<{ sessionId: string, mode: CodernicMode }>) {
      const sessionId = action.payload.sessionId;
      const prevMode = state.modeBySession[sessionId] || 'brainstorm';
      const nextMode = action.payload.mode;

      StateTransitionVerifier.verify(
        { mode: prevMode, sending: state.sending },
        { mode: nextMode, sending: state.sending },
        'chat/setMode',
        (prev, next) => {
          if (prev.sending && prev.mode !== next.mode) {
            return { valid: false, reason: 'Cannot mutate operating mode during an active sending sequence' };
          }
          return { valid: true };
        }
      );

      state.modeBySession[sessionId] = nextMode;
    },
    setBuilderSubMode(state, action: PayloadAction<{ sessionId: string, subMode: 'manuel' | 'automatic' | 'dag' }>) {
      state.builderSubModeBySession[action.payload.sessionId] = action.payload.subMode;
    },
    transitionToImplementNow(state, action: PayloadAction<{ sessionId: string }>) {
      state.modeBySession[action.payload.sessionId] = 'builder';
      state.builderSubModeBySession[action.payload.sessionId] = 'dag';
    },
    setSending(state, action: PayloadAction<boolean>) {
      StateTransitionVerifier.verify(
        { sending: state.sending },
        { sending: action.payload },
        'chat/setSending',
        (prev, next) => {
          if (prev.sending === next.sending) {
            return { valid: false, reason: 'Redundant sending state transition' };
          }
          return { valid: true };
        }
      );
      state.sending = action.payload;
    },
    setThinking(state, action: PayloadAction<{ sessionId: string, state: ThinkingState }>) {
      state.thinkingBySession[action.payload.sessionId] = action.payload.state;
    },
    setContextFiles(state, action: PayloadAction<CodernicContextFile[]>) {
      state.contextFiles = action.payload;
    },
    setIsDragging(state, action: PayloadAction<boolean>) {
      state.isDragging = action.payload;
    },
    addContextFile(state, action: PayloadAction<CodernicContextFile>) {
      if (!state.contextFiles.some((f) => f.filePath === action.payload.filePath)) {
        state.contextFiles.push(action.payload);
      }
    },
    removeContextFile(state, action: PayloadAction<string>) {
      state.contextFiles = state.contextFiles.filter((f) => f.id !== action.payload);
    },
    clearContextFiles(state) {
      state.contextFiles = [];
    },
    setUseRag(state, action: PayloadAction<{ sessionId: string, useRag: boolean }>) {
      state.useRagBySession[action.payload.sessionId] = action.payload.useRag;
    },
    setAutoPilot(state, action: PayloadAction<{ sessionId: string, autoPilot: boolean }>) {
      state.autoPilotBySession[action.payload.sessionId] = action.payload.autoPilot;
    },
    freezePlan(state, action: PayloadAction<{ sessionId: string }>) {
      state.isPlanFrozenBySession[action.payload.sessionId] = true;
    },
    unfreezePlan(state, action: PayloadAction<{ sessionId: string }>) {
      state.isPlanFrozenBySession[action.payload.sessionId] = false;
    },
    setProcessing(state, action: PayloadAction<boolean>) {
      state.isProcessing = action.payload;
    },
    setPirsigAttempts(state, action: PayloadAction<{ sessionId: string, attempts: number }>) {
      if (!state.pirsigAttemptsBySession) state.pirsigAttemptsBySession = {};
      state.pirsigAttemptsBySession[action.payload.sessionId] = action.payload.attempts;
    },
  },
});

export const {
  appendMessage,
  setMessages,
  updateAssistantMessage,
  setPendingAssistantId,
  setRemoteTaskId,
  abortCurrentTask,
  setMode,
  setSending,
  setThinking,
  setContextFiles,
  setIsDragging,
  addContextFile,
  removeContextFile,
  clearContextFiles,
  setUseRag,
  setAutoPilot,
  setBuilderSubMode,
  transitionToImplementNow,
  freezePlan,
  unfreezePlan,
  setProcessing,
  setPirsigAttempts,
} = chatSlice.actions;

export const selectMessages = (state: RootState) => state.chat.messages;
export const selectPendingAssistantId = (state: RootState) => state.chat.pendingAssistantId;
export const selectActiveTaskId = (state: RootState, sessionId: string) => state.chat.activeTaskIdBySession[sessionId] || null;
export const selectMode = (state: RootState, sessionId: string) => state.chat.modeBySession[sessionId] || 'brainstorm';
export const selectSending = (state: RootState) => state.chat.sending;
const DEFAULT_THINKING: ThinkingState = { phase: 'idle' };
export const selectThinking = (state: RootState, sessionId: string) => state.chat.thinkingBySession[sessionId] || DEFAULT_THINKING;
export const selectContextFiles = (state: RootState) => state.chat.contextFiles;
export const selectIsDragging = (state: RootState) => state.chat.isDragging;
export const selectUseRag = (state: RootState, sessionId: string) => state.chat.useRagBySession[sessionId] ?? true;
export const selectAutoPilot = (state: RootState, sessionId: string) => state.chat.autoPilotBySession[sessionId] ?? false;
export const selectBuilderSubMode = (state: RootState, sessionId: string) => state.chat.builderSubModeBySession[sessionId] || 'manuel';
export const selectIsPlanFrozen = (state: RootState, sessionId: string) => state.chat.isPlanFrozenBySession[sessionId] ?? false;
export const selectIsProcessing = (state: RootState) => state.chat.isProcessing;
export const selectPirsigAttempts = (state: RootState, sessionId: string) => state.chat.pirsigAttemptsBySession?.[sessionId] ?? 0;

export default chatSlice.reducer;
