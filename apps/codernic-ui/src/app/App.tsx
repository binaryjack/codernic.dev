import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { vscode } from '../shared';
import { Accordion, Button, SequencerProvider, SequencerOverlay, architectureTourConfig, exhaustiveDebugDemoSequence, Banner } from '@ai-agencee/ui';
import { useIntrospection } from '../../../../packages/ui/src/introspection/hooks/useIntrospection';
import { addContextFile, appendMessage, clearContextFiles, removeContextFile, selectContextFiles, selectIsDragging, selectMessages, selectSending, selectThinking, abortCurrentTask, setSending, setMessages, setThinking, setMode as setReduxMode, selectActiveTaskId, selectUseRag, selectAutoPilot, setUseRag, setAutoPilot, selectMode } from '../features/chat/store/chat.slice';
import { dismissAgentRun, dismissPhaseGate, selectAgentRun, selectGalileusError, selectGalileusSnapshot, selectJourneyPhase, selectPhaseGate, selectErathosSchema } from '../features/dag/store/dag.slice';
import { selectAvailableLlms, selectSessionLlm, setSessionLlm, setRouteProfile, selectRouteProfile, selectRouteProfiles } from '../features/models/store/models.slice';
import { sendIntent } from '../shared/store/intent';
import { setCurrentSessionId, selectSessions, selectCurrentSessionId } from '../features/sessions/store/sessions.slice';
import { setWorkspaceName, selectSandboxMode, selectWaitingForDaemonOverlay, setDaemonIsLoaded } from '../entities/app/model/app-slice';
import { getCodernicHttpUrl } from '../shared/config';
import { setJsonEditorSchemas } from '../entities/assets/model/assets-slice';
import { setAppVersion, selectWsStatus } from '../features/system/store/system.slice';
import { selectMetrics } from '../features/system/store/system.slice';
import { SessionSelector } from '../features/sessions/components/molecules/session-selector';
import { MessageFeed } from '../features/chat/components/organisms/message-feed';
import { GalileusLanes } from '../features/dag/components/organisms/GalileusLanes';
import { StatusBarFooter } from '../components/layout/StatusBarFooter';

import { useTestId } from '@ai-agencee/ui';
import { ContextBadgeList, useFileDrop } from '../features/context-files';
import { ChatInput } from '../features/chat/components/organisms/chat-input';
import { ApprovalModal } from '../widgets/dag-pipeline/ui/ApprovalModal';
import { ErathosDiffModal } from '../widgets/dag-pipeline/ui/ErathosDiffModal';
import { ArtifactModal } from '../features/artifact-negotiation/ArtifactModal';
import { GlobalLoader } from "./ui/GlobalLoader";
import { AgnosticModalProvider } from '../features/modal/ui/AgnosticModalProvider';
import { confirmUnsavedChanges } from '../features/dag/store/confirmUnsavedChanges';
import { selectIsErathosDirty } from '../features/dag/store/dag.slice';
import { LayoutEngine } from '../features/layout-engine/components/templates/LayoutEngine';
import { LayoutValidator } from '../features/layout-engine/util/LayoutValidator';
import { fetchNotificationsRequest } from '../entities/notifications/model/notifications-slice';
import { ToastsContainer } from '../features/notifications/components/toasts-container';

export function App() {
  const { getTestId } = useTestId('app');
  
  const rootId = 'app';
const dispatch = useDispatch();

  // SELECTORS
  const currentSessionId = useSelector(selectCurrentSessionId) || '';
  const availableLlms = useSelector(selectAvailableLlms);
  const sandboxMode = useSelector(selectSandboxMode);
  const sessionLlm = useSelector((state: RootState) => selectSessionLlm(state, currentSessionId));
  const routeProfiles = useSelector(selectRouteProfiles);
  const routeProfile = useSelector((state: RootState) => selectRouteProfile(state, currentSessionId));
  const messages = useSelector(selectMessages);
  const sending = useSelector(selectSending);
  const thinking = useSelector((state: RootState) => selectThinking(state, currentSessionId));
  const agentRun = useSelector((state: RootState) => selectAgentRun(state, currentSessionId));
  const phaseGate = useSelector(selectPhaseGate);
  const journeyPhase = useSelector(selectJourneyPhase);
  const galileusSnapshot = useSelector(selectGalileusSnapshot);
  const galileusError = useSelector(selectGalileusError);
  const contextFiles = useSelector(selectContextFiles);
  const erathosSchema = useSelector(selectErathosSchema);
  const isDragging = useSelector(selectIsDragging);
  const sessions = Object.values(useSelector(selectSessions));
  const metrics = useSelector(selectMetrics);
  const activeTaskId = useSelector((state: RootState) => selectActiveTaskId(state, currentSessionId));
  const wsStatus = useSelector(selectWsStatus);

  // Layout State
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  const mode = useSelector((state: RootState) => selectMode(state, currentSessionId));
  const useRag = useSelector((state: RootState) => selectUseRag(state, currentSessionId));
  const isAutoPilot = useSelector((state: RootState) => selectAutoPilot(state, currentSessionId));
  const [missingEnvPkgs, setMissingEnvPkgs] = useState<string[] | null>(null);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isErathosDirty = useSelector(selectIsErathosDirty);
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isErathosDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isErathosDirty]);

  // HOOKS
  useFileDrop();

  // Initial bootstrap request to extension host
  useEffect(() => {
    dispatch(fetchNotificationsRequest());
    
    if (!sandboxMode) {
      const baseUrl = getCodernicHttpUrl();
      fetch(`${baseUrl}/api/schemas`)
        .then(r => r.json())
        .then(schemas => dispatch(setJsonEditorSchemas(schemas)))
        .catch(err => console.warn('Failed to fetch schemas:', err));
    }

    vscode.postMessage({ type: 'codernic:ready' });
    vscode.postMessage({ type: 'codernic:get-last-mode' });
    vscode.postMessage({ type: 'codernic:get-env-check' });
    vscode.postMessage({ type: 'codernic:request-llms' });
    vscode.postMessage({ type: 'codernic:load-layouts' });
    dispatch(sendIntent({ type: 'codernic:get-sessions' }));
  }, []);

  // Expose system-level Introspection API
  useIntrospection({
    id: 'system-root',
    type: 'system',
    methods: {
      dispatchRedux: (action: any) => {
        dispatch(action);
      },
      dispatchReduxBatch: (actions: any[]) => {
        actions.forEach(action => dispatch(action));
      }
    }
  });

  // Listen to messages from VS Code
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'codernic:last-mode' && msg.payload?.mode) {
        // dispatch(setReduxMode({ sessionId: currentSessionId, mode: msg.payload.mode }));
      }
      if (msg.type === 'codernic:workspace-info' && msg.payload?.name) {
        dispatch(setWorkspaceName(msg.payload.name));
      }
      if (msg.type === 'codernic:env-check') {
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
      } else if (msg.type === 'codernic:json-schemas') {
        dispatch(setJsonEditorSchemas(msg.payload || {}));
      } else if (msg.type === 'codernic:load-layouts') {
        const layoutPayload = msg.payload;
        if (!LayoutValidator.validateSchema(layoutPayload) || !LayoutValidator.validateGraphConsistency(layoutPayload)) {
          console.error('[LayoutValidator] SECURITY FAULT: Layout validation failed. Blocking state attribution.');
          return;
        }
      }
    };
    window.addEventListener('message', handleMessage);

    const handleActivateIntrospection = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      dispatch({ type: 'introspection/setActiveIntrospection', payload: customEvent.detail });
      dispatch({ type: 'app/setActiveRightPanelTab', payload: 'introspection' });
    };
    window.addEventListener('codernic:activate-introspection', handleActivateIntrospection);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('codernic:activate-introspection', handleActivateIntrospection);
    };
  }, [dispatch]);

  const handleNewSession = async () => {
    if (!(await confirmUnsavedChanges())) return;
    dispatch(setMessages([]));
    dispatch(setCurrentSessionId(null));
    setIsCreatingNewSession(true);
    // Focus chat input if we had a ref to it, but the empty state acts as the session creation trigger.
  };

  const handleSend = (text: string) => {
    if (!text || sending) return;
    console.log('App.tsx handleSend:', { text, sessionLlm, availableLlms: availableLlms.length });
    if (!sessionLlm && availableLlms.length > 0) {
      console.log('App.tsx handleSend returning early due to no LLM selected');
      dispatch(
        appendMessage({
          id: Math.random().toString(),
          role: 'system',
          text: 'No LLM selected. Please sign in to GitHub Copilot.',
        }),
      );
      return;
    }
    console.log('App.tsx handleSend dispatching user message');
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      dispatch(setUseRag({ sessionId: activeSessionId, useRag }));
      dispatch(setAutoPilot({ sessionId: activeSessionId, autoPilot: isAutoPilot }));
      dispatch(setReduxMode({ sessionId: activeSessionId, mode }));
      dispatch(setCurrentSessionId(activeSessionId));
    }

    dispatch(appendMessage({ id: Math.random().toString(), role: 'user', text }));
    dispatch(setSending(true));
    dispatch(setThinking({ sessionId: activeSessionId, state: { phase: 'thinking' } }));

    // Initialize introspection session immediately
    const introId = `intro-${activeSessionId}`;
    dispatch({ type: 'introspection/initIntrospection', payload: { introspectionId: introId, sessionId: activeSessionId, mode: 'free-flow' } });
    dispatch({ type: 'introspection/setActiveIntrospection', payload: introId });
    dispatch({ type: 'app/setActiveRightPanelTab', payload: 'introspection' });

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', text: m.text }));
    history.push({ role: 'user', text });

    const isPlanGenRequest = mode === 'agent' && !!agentRun && agentRun.status === 'running';

    const payload = isPlanGenRequest
      ? { task: text, mode, llmId: sessionLlm, contextFiles, erathosSchema, sessionId: activeSessionId, useRag, yolo: isAutoPilot }
      : { llmId: sessionLlm, history, mode, contextFiles, erathosSchema, sessionId: activeSessionId, useRag, yolo: isAutoPilot };

    dispatch(sendIntent({ type: 'codernic:chat', payload }));
  };

  if (missingEnvPkgs && missingEnvPkgs.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 mb-6 text-yellow-500 font-bold text-4xl flex items-center justify-center">!</div>
        <h1 className="text-2xl font-bold mb-4 text-zinc-100">Missing Dependencies</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          To use the local VS Code environment, please install these missing packages:
        </p>
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800/50 mb-8 w-full max-w-lg shadow-xl">
          <code className="text-sm text-yellow-400/90 font-mono break-all text-left block">
            npm install {missingEnvPkgs.join(' ')} -D
          </code>
        </div>
        <Button data-testid={getTestId('button')} onClick={() => window.location.reload()} variant="primary" className="shadow-lg shadow-blue-500/20">
          Check Again
        </Button>
      </div>
    );
  }

  const waitingForDaemon = useSelector(selectWaitingForDaemonOverlay);

  useEffect(() => {
    if (wsStatus === 'connected') {
      dispatch(setDaemonIsLoaded(true));
    } else if (wsStatus === 'disconnected') {
      dispatch(setDaemonIsLoaded(false));
    }
  }, [wsStatus, dispatch]);

  if (waitingForDaemon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-zinc-950 animate-in fade-in duration-700">
        <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">Backend Disconnected</h1>
        <p className="text-zinc-400 max-w-md mb-10 text-lg">
          The connection to the Rust Daemon was lost. The port 47321 might be occupied or the daemon crashed.
        </p>
        <Button data-testid={getTestId('button-1')} onClick={() => window.location.reload()} variant="primary" className="px-8 py-3 text-lg font-medium shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
          Reconnect Backend
        </Button>
      </div>
    );
  }

  const currentSessionName = sessions.find((s) => s.id === currentSessionId)?.name;

  return (
    <SequencerProvider data-testid={getTestId('sequencer-provider')} config={new URLSearchParams(window.location.search).get('demo') === 'exhaustive' ? exhaustiveDebugDemoSequence : architectureTourConfig} onDispatch={dispatch}>
      <div data-testid="system-root" className="flex flex-col h-full w-full bg-black overflow-hidden relative">
        <ToastsContainer data-testid={getTestId('toasts-container')} />
        <GlobalLoader data-testid={getTestId('global-loader')} />
        <AgnosticModalProvider data-testid={getTestId('agnostic-modal-provider')} />
        {/* Tablet Viewport Warning Banner */}
        <Banner
          id="tablet-viewport"
          message="Codernic is optimized for larger viewports. Mobile layouts are coming soon."
          type="warning"
          className="hidden md:flex lg:hidden z-[9999]"
        />

        {/* Main Layout Engine */}
        <main className="flex-1 min-h-0 w-full flex flex-col relative z-0">
          <LayoutEngine data-testid={getTestId('layout-engine')} />
        </main>
        {/* Modals */}
        <ApprovalModal data-testid={getTestId('approval-modal')} />
        <ErathosDiffModal data-testid={getTestId('erathos-diff-modal')} />
        <ArtifactModal data-testid={getTestId('artifact-modal')} />

        {/* Footer */}
        <div className="relative z-[9999] flex-shrink-0">
          <StatusBarFooter data-testid={getTestId('status-bar-footer')} />
        </div>
        <SequencerOverlay data-testid={getTestId('sequencer-overlay')} />

        {/* Mobile Viewport Overlay Disclaimer */}
        <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6 text-center md:hidden">
          <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3 text-zinc-100 tracking-tight">Desktop-Only Optimization</h1>
          <p className="text-zinc-400 max-w-xs mb-8 text-sm leading-relaxed">
            Codernic is currently optimized for desktop viewports. Mobile and tablet workflows are under active development!
          </p>
          <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
            Codernic Workspace v0.6.477
          </div>
        </div>
      </div>
    </SequencerProvider>
  );
}
