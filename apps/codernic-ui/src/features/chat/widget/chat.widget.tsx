import type { RootState } from '../../../store';
import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectMessages, selectSending, selectThinking, 
  selectContextFiles, selectUseRag, selectAutoPilot, selectMode,
  removeContextFile, clearContextFiles, appendMessage, setSending, setThinking, setAutoPilot, setUseRag, abortCurrentTask,
  selectBuilderSubMode, transitionToImplementNow, selectIsPlanFrozen
} from '../../../features/chat/store/chat.slice';
import { dismissAgentRun, selectAgentRun, selectPhaseGate, dismissPhaseGate, selectJourneyPhase, selectErathosSchema } from '../../../features/dag/store/dag.slice';
import { selectAvailableLlms, selectSessionLlm, setSessionLlm, setRouteProfile, selectRouteProfile, selectRouteProfiles } from '../../../features/models/store/models.slice';
import { selectMetrics } from '../../../features/system/store/system.slice';
import { selectSessions, setCurrentSessionId, selectCurrentSessionId } from '../../../features/sessions/store/sessions.slice';
import { selectSandboxMode } from '../../../entities/app/model/app-slice';
import { sendIntent } from '../../../shared/store/intent';
import { setMode as setReduxMode } from '../../../features/chat/store/chat.slice';
import { vscode } from '../../../shared';
import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { submitChatMessage } from '../store/chat.saga';

import { SequencerLauncherWidget, architectureTourConfig, fsmTourConfig, modelHubTourConfig, exhaustiveDebugDemoSequence, debugAllStatesSequence } from '@ai-agencee/ui';
import { OnboardingHero } from '../../../features/chat/components/organisms/OnboardingHero';

import { MessageFeed } from '../../../features/chat/components/organisms/message-feed';
import { ChatInput } from '../../../features/chat/components/organisms/chat-input';
import { ContextBadgeList } from '../../../features/context-files';
import { GlobalLoader } from '../../../app/ui/GlobalLoader';

import { useIntrospection } from '../../../../../../packages/ui/src/introspection/hooks/useIntrospection';
import { useTestId } from '@ai-agencee/ui';

export function ChatWidget({ dataTestId }: { dataTestId?: string } = {}) {
  const { rootId, getTestId } = useTestId('chat-widget', dataTestId);
  const dispatch = useDispatch();

  const [hideHero, setHideHero] = React.useState(() => localStorage.getItem('codernic_hide_onboarding') === 'true');

  // Selectors
  const currentSessionId = useSelector(selectCurrentSessionId) || '';
  const sessions = Object.values(useSelector(selectSessions));
  const currentSessionName = sessions.find((s) => s.id === currentSessionId)?.name;
  const mode = useSelector((state: RootState) => selectMode(state, currentSessionId));
  const builderSubMode = useSelector((state: RootState) => selectBuilderSubMode(state, currentSessionId));
  const messages = useSelector(selectMessages);
  const sending = useSelector(selectSending);
  const thinking = useSelector((state: RootState) => selectThinking(state, currentSessionId));
  const agentRun = useSelector((state: RootState) => selectAgentRun(state, currentSessionId));
  const phaseGate = useSelector(selectPhaseGate);
  const journeyPhase = useSelector(selectJourneyPhase);
  const contextFiles = useSelector(selectContextFiles);
  const erathosSchema = useSelector(selectErathosSchema);
  
  const availableLlms = useSelector(selectAvailableLlms);
  const sessionLlm = useSelector((state: RootState) => selectSessionLlm(state, currentSessionId));
  const routeProfiles = useSelector(selectRouteProfiles);
  const routeProfile = useSelector((state: RootState) => selectRouteProfile(state, currentSessionId));
  const isAutoPilot = useSelector((state: RootState) => selectAutoPilot(state, currentSessionId));
  const useRag = useSelector((state: RootState) => selectUseRag(state, currentSessionId));
  const metrics = useSelector(selectMetrics);
  const sandboxMode = useSelector(selectSandboxMode);
  const isPlanFrozen = useSelector((state: RootState) => selectIsPlanFrozen(state, currentSessionId));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = (text: string) => {
    if (!text || sending) return;
    if (!sessionLlm && availableLlms.length > 0) {
      dispatch(appendMessage({ id: Math.random().toString(), role: 'system', text: 'No LLM selected. Please sign in to GitHub Copilot.' }));
      return;
    }
    
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      dispatch(setCurrentSessionId(activeSessionId));
    }

    dispatch(submitChatMessage({
      text,
      sessionId: activeSessionId,
      sessionLlm,
      availableLlms,
      contextFiles,
      erathosSchema,
      useRag,
      isAutoPilot,
      messages
    }));
  };

  useIntrospection({
    id: 'chat-widget-main',
    type: 'chat_widget',
    slice: 'chat',
    methods: {
      simulateChat: (text: string) => {
        handleSend(text);
      }
    }
  });

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full w-full relative" data-testid={getTestId('root')}>
        <GlobalLoader data-testid={getTestId('global-loader')} />
        <main className="flex-1 min-h-0 overflow-y-auto w-full flex flex-col">
          <MessageFeed data-testid={getTestId('message-feed')}
            data-demo-desc="[CODER] The unified conversation feed showing both user and assistant interactions."
            mode={mode}
            messages={messages}
            agentRun={agentRun}
            onAgentRunDismiss={() => dispatch(dismissAgentRun())}
            phaseGate={phaseGate}
            onPhaseGateConfirm={() => dispatch(sendIntent({ type: 'codernic:journey-confirm-phase' }))}
            onPhaseGateDismiss={() => dispatch(dismissPhaseGate())}
            sending={sending}
            thinking={thinking}
            messagesEndRef={messagesEndRef}
            onSuggestionClick={handleSend}
            sessionId={currentSessionId}
            renderWelcomeHero={
              sandboxMode
                ? (onDismiss) => (
                    <SequencerLauncherWidget
                      data-testid={`${typeof rootId !== 'undefined' ? rootId : 'anonymous'}-sequencer-launcher-widget`}
                      sequences={[architectureTourConfig, fsmTourConfig, modelHubTourConfig, exhaustiveDebugDemoSequence, debugAllStatesSequence]}
                      onDismiss={onDismiss}
                    />
                  )
                : !hideHero
                ? (onDismiss) => (
                    <OnboardingHero
                      data-testid={`${typeof rootId !== 'undefined' ? rootId : 'anonymous'}-onboarding-hero`}
                      onDismiss={() => {
                        setHideHero(true);
                        onDismiss();
                      }}
                    />
                  )
                : undefined
            }
          />
        </main>

        <footer className="flex-shrink-0 w-full z-10 bg-zinc-950/80 backdrop-blur-md">
          <ContextBadgeList data-testid={getTestId('context-badge-list')}
            files={contextFiles}
            onRemoveFile={(id) => dispatch(removeContextFile(id))}
            onClearAll={() => dispatch(clearContextFiles())}
          />
          <ChatInput data-testid={getTestId('chat-input')}
            data-demo-desc="[CODER] The universal chat interface. Let's look at its components."
            sessionName={currentSessionName}
            mode={mode}
            builderSubMode={builderSubMode}
            onTransitionToDag={() => {
              dispatch(transitionToImplementNow({ sessionId: currentSessionId }));
              dispatch(sendIntent({ type: 'codernic:update-session-config', payload: { sessionId: currentSessionId, currentMode: 'builder' } }));
              vscode.postMessage({ type: 'codernic:set-last-mode', payload: { mode: 'builder' } });
            }}
            onSend={handleSend}
            sending={sending}
            onModeChange={(m) => {
              dispatch(setReduxMode({ sessionId: currentSessionId, mode: m }));
              dispatch(sendIntent({ type: 'codernic:update-session-config', payload: { sessionId: currentSessionId, currentMode: m } }));
              vscode.postMessage({ type: 'codernic:set-last-mode', payload: { mode: m } });
            }}
            journeyPhase={journeyPhase}
            llmLoading={availableLlms.length === 0}
            llmOptions={availableLlms}
            sessionLlm={sessionLlm}
            onLlmChange={(l) => {
              dispatch(setSessionLlm({ sessionId: currentSessionId, llm: l }));
              dispatch(sendIntent({ type: 'codernic:update-session-config', payload: { sessionId: currentSessionId, llmId: l } }));
            }}
            routeProfiles={routeProfiles}
            routeProfile={routeProfile}
            onRouteProfileChange={(p) => {
              dispatch(setRouteProfile({ sessionId: currentSessionId, profile: p }));
            }}
            isAutoPilot={isAutoPilot}
            onAutopilotToggle={() => {
              const val = !isAutoPilot;
              dispatch(setAutoPilot({ sessionId: currentSessionId, autoPilot: val }));
              dispatch(sendIntent({ type: 'codernic:update-session-config', payload: { sessionId: currentSessionId, autoPilot: val } }));
            }}
            useRag={useRag}
            onUseRagToggle={() => {
              const val = !useRag;
              dispatch(setUseRag({ sessionId: currentSessionId, useRag: val }));
              dispatch(sendIntent({ type: 'codernic:update-session-config', payload: { sessionId: currentSessionId, useRag: val } }));
            }}
            metrics={metrics}
            onAbort={() => {
              dispatch(abortCurrentTask({ sessionId: currentSessionId }));
            }}
            isPlanFrozen={isPlanFrozen}
          />
        </footer>
      </div>
    </ErrorBoundary>
  );
}
