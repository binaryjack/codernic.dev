import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CodernicMode } from '../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import { Accordion, Button, Watermark, vscode } from '../shared';
import {
  addContextFile,
  appendMessage,
  clearContextFiles,
  dismissAgentRun,
  dismissPhaseGate,
  removeContextFile,
  selectAgentRun,
  
  selectAvailableLlms,
  selectContextFiles,
  selectGalileusError,
  selectGalileusSnapshot,
  selectIsDragging,
  selectJourneyPhase,
  selectMessages,
  selectPhaseGate,
  selectSending,
  selectSessionLlm,
  selectThinking,
  
  selectMetrics,
  sendIntent,
  abortCurrentTask,
  setSending,
  setSessionLlm,
  setRouteProfile,
  setCurrentSessionId,
  setMessages,
  setThinking,
  setMode as setReduxMode,
  setAppVersion,
  selectRouteProfile,
  selectRouteProfiles,
  selectSessions,
  selectCurrentSessionId,
  selectActiveTaskId,
} from '../entities/kernel';
import { HeaderBar } from '../widgets/header-bar';
import { MessageFeed } from '../widgets/message-feed';
import { SessionSelector } from '../widgets/message-feed/ui/session-selector';
import { StatusBarFooter } from '../components/layout/StatusBarFooter';
import { GalileusTracker } from '../widgets/galileus-tracker';
import { SettingsPanel } from '../features/settings';
import { ContextBadgeList, useFileDrop } from '../features/context-files';
import { ChatInput } from '../features/chat-input';
import { ApprovalModal } from '../widgets/dag-pipeline/ui/ApprovalModal';
import { ArtifactModal } from '../features/artifact-negotiation/ArtifactModal';
import { WorkspaceLayout } from '../shared/ui/workspace-layout';
import { MenuBar } from '../widgets/menu-bar';
import { LeftPanel } from '../widgets/left-panel';
import { RightPanel } from '../widgets/right-panel';

export function App() {
  const dispatch = useDispatch();

  // SELECTORS
  const availableLlms = useSelector(selectAvailableLlms);
  const sessionLlm = useSelector(selectSessionLlm);
  const routeProfiles = useSelector(selectRouteProfiles);
  const routeProfile = useSelector(selectRouteProfile);
  const messages = useSelector(selectMessages);
  const sending = useSelector(selectSending);
  const thinking = useSelector(selectThinking);
  const agentRun = useSelector(selectAgentRun);
  const phaseGate = useSelector(selectPhaseGate);
  const journeyPhase = useSelector(selectJourneyPhase);
  const galileusSnapshot = useSelector(selectGalileusSnapshot);
  const galileusError = useSelector(selectGalileusError);
  const contextFiles = useSelector(selectContextFiles);
  const isDragging = useSelector(selectIsDragging);
  const sessions = useSelector(selectSessions);
  const currentSessionId = useSelector(selectCurrentSessionId);
  const metrics = useSelector(selectMetrics);
  const activeTaskId = useSelector(selectActiveTaskId);

  // Layout State
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // LOCAL STATES
  const [mode, setMode] = useState<CodernicMode>('ask');
  const [showSettings, setShowSettings] = useState(false);
  const [missingEnvPkgs, setMissingEnvPkgs] = useState<string[] | null>(null);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // HOOKS
  useFileDrop();

  // Initial bootstrap request to extension host
  useEffect(() => {
    vscode.postMessage({ type: 'codernic:get-last-mode' });
    vscode.postMessage({ type: 'codernic:get-env-check' });
    vscode.postMessage({ type: 'codernic:request-llms' });
    dispatch(sendIntent({ type: 'codernic:get-sessions' }));
  }, []);

  // Listen to messages from VS Code
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'codernic:last-mode' && msg.payload?.mode) {
        setMode(msg.payload.mode);
        dispatch(setReduxMode(msg.payload.mode));
      } else if (msg.type === 'codernic:env-check') {
        setMissingEnvPkgs(msg.payload?.missing || []);
        if (msg.payload?.version) {
          dispatch(setAppVersion(msg.payload.version));
        }
      } else if (msg.type === 'CODERNIC_CONTEXT_ADD_FILE') {
        const fileName = msg.filePath.split(/[/\\]/).pop() || msg.filePath;
        dispatch(
          addContextFile({
            id: String(Date.now()),
            filePath: msg.filePath,
            fileName,
            lines: msg.lines,
          }),
        );
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch]);

  const handleNewSession = () => {
    dispatch(setMessages([]));
    dispatch(setCurrentSessionId(null));
    setIsCreatingNewSession(true);
    // Focus chat input if we had a ref to it, but the empty state acts as the session creation trigger.
  };

  const handleSend = (text: string) => {
    if (!text || sending) return;
    if (!sessionLlm) {
      dispatch(
        appendMessage({
          id: Math.random().toString(),
          role: 'system',
          text: '⚠️ No LLM selected. Please sign in to GitHub Copilot.',
        }),
      );
      return;
    }
    dispatch(appendMessage({ id: Math.random().toString(), role: 'user', text }));
    dispatch(setSending(true));
    dispatch(setThinking({ phase: 'thinking' }));

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', text: m.text }));
    history.push({ role: 'user', text });

    const isPlanGenRequest = mode === 'agent' && !!agentRun && agentRun.status === 'running';

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      dispatch(setCurrentSessionId(activeSessionId));
    }

    const payload = isPlanGenRequest
      ? { task: text, mode, llmId: sessionLlm, contextFiles, routeProfile, sessionId: activeSessionId, useRag, yolo: isAutoPilot }
      : { llmId: sessionLlm, history, mode, contextFiles, routeProfile, sessionId: activeSessionId, useRag, yolo: isAutoPilot };

    dispatch(sendIntent({ type: 'codernic:chat', payload }));
  };

  if (missingEnvPkgs && missingEnvPkgs.length > 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '24px',
          background: 'var(--vscode-editor-background)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <Watermark size={120} opacity={0.04} />
        <h2 style={{ fontSize: '14px', color: '#f87171', marginBottom: '8px' }}>⚠️ Missing Dependencies</h2>
        <pre
          style={{
            background: '#18181b',
            border: '1px solid var(--border, #27272a)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'var(--mono)',
            color: '#e4e4e7',
            marginBottom: '16px',
            maxWidth: '100%',
            overflowX: 'auto',
          }}
        >
          <code>npm install {missingEnvPkgs.join(' ')} -D</code>
        </pre>
        <Button
          onClick={() => vscode.postMessage({ type: 'codernic:get-env-check' })}
          variant="primary"
          size="sm"
        >
          Check Again
        </Button>
      </div>
    );
  }

  const currentSessionName = sessions.find((s) => s.id === currentSessionId)?.name;

  return (
    <WorkspaceLayout
      isLeftOpen={isLeftOpen}
      isRightOpen={isRightOpen}
      onToggleLeft={() => setIsLeftOpen(!isLeftOpen)}
      onToggleRight={() => setIsRightOpen(!isRightOpen)}
      headerBar={
        <MenuBar 
          title="Codernic" 
          onToggleLeft={() => setIsLeftOpen(!isLeftOpen)}
          onOpenLeft={() => setIsLeftOpen(true)}
          onNewSession={handleNewSession}
        />
      }
      leftPanel={
        <LeftPanel
          onSettingsClick={() => setShowSettings(!showSettings)}
        />
      }
      centerPanel={
        <div
          className="flex flex-col h-full w-full relative"
          style={{
            border: isDragging ? '2px dashed var(--vscode-focusBorder, #007acc)' : 'none',
          }}
        >
          <HeaderBar
            sessionName={currentSessionName}
            onSettingsToggle={() => {
              setShowSettings(!showSettings);
            }}
            onNewSession={handleNewSession}
          />

          <main className="flex-1 min-h-0 overflow-y-auto w-full flex flex-col">
            {showSettings ? (
              <SettingsPanel onClose={() => setShowSettings(false)} />
            ) : messages.length === 0 && sessions.length > 0 && !isCreatingNewSession ? (
              <SessionSelector 
                sessions={sessions} 
                onSelect={(id) => dispatch(sendIntent({ type: 'codernic:load-session', payload: { id } }))} 
                onNew={handleNewSession}
                onDelete={(id) => dispatch(sendIntent({ type: 'codernic:delete-session', payload: { id } }))}
              />
            ) : (
              <MessageFeed
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
              />
            )}
          </main>

          {!showSettings && (
            <footer className="flex-shrink-0 w-full">
              <ContextBadgeList
                files={contextFiles}
                onRemoveFile={(id) => dispatch(removeContextFile(id))}
                onClearAll={() => dispatch(clearContextFiles())}
              />
              <ChatInput
                mode={mode}
                onSend={handleSend}
                sending={sending}
                onModeChange={(m) => {
                  setMode(m);
                  dispatch(setReduxMode(m));
                  vscode.postMessage({ type: 'codernic:set-last-mode', payload: { mode: m } });
                }}
                journeyPhase={journeyPhase}
                llmLoading={availableLlms.length === 0}
                llmOptions={availableLlms}
                sessionLlm={sessionLlm}
                onLlmChange={(l) => dispatch(setSessionLlm(l))}
                routeProfiles={routeProfiles}
                routeProfile={routeProfile}
                onRouteProfileChange={(p) => {
                  dispatch(setRouteProfile(p));
                  vscode.postMessage({ type: 'codernic:set-route-profile', payload: { profile: p } });
                }}
                isAutoPilot={isAutoPilot}
                onAutopilotToggle={() => setIsAutoPilot(!isAutoPilot)}
                useRag={useRag}
                onUseRagToggle={() => setUseRag(!useRag)}
                  metrics={metrics}
                onAbort={() => {
                  if (activeTaskId) {
                    dispatch(sendIntent({ type: 'codernic:abort-task', payload: { task_id: activeTaskId } }));
                  }
                  dispatch(abortCurrentTask());
                }}
              />
            </footer>
          )}

          <ApprovalModal />
          <ArtifactModal />
        </div>
      }
      rightPanel={<RightPanel />}
      footerBar={
        <div className="w-full flex flex-col bg-[#09090b] z-40 border-t border-[#27272a]">
          {!showSettings && (
            <div className="px-2">
              <Accordion label="🛰️ Galileus Sequence Tracker">
                <GalileusTracker snapshot={galileusSnapshot} error={galileusError} />
              </Accordion>
            </div>
          )}
          <StatusBarFooter />
        </div>
      }
    />
  );
}
