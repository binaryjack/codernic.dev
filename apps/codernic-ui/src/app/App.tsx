import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CodernicMode } from '../../../vscode-extension/src/features/codernic/model/codernic-mode.types';
import { Accordion, Button, Watermark, vscode } from '../shared';
import {
  addContextFile,
  appendMessage,
  clearContextFiles,
  dismissAgentRun,
  dismissAnalyseProgress,
  dismissPhaseGate,
  removeContextFile,
  selectAgentRun,
  selectAnalyseProgress,
  selectAvailableLlms,
  selectContextFiles,
  selectContextStats,
  selectCostPreview,
  selectGalileusError,
  selectGalileusSnapshot,
  selectInfraStats,
  selectIsDragging,
  selectJourneyPhase,
  selectMessages,
  selectPhaseGate,
  selectSending,
  selectSessionLlm,
  selectThinking,
  sendIntent,
  setCostPreview,
  setSending,
  setSessionLlm,
  setThinking,
} from '../entities/kernel';
import { HeaderBar } from '../widgets/header-bar';
import { InfraHud } from '../widgets/infra-hud';
import { MessageFeed } from '../widgets/message-feed';
import { GalileusTracker } from '../widgets/galileus-tracker';
import { SettingsPanel } from '../features/settings';
import { ContextBadgeList, useFileDrop } from '../features/context-files';
import { ChatInput } from '../features/chat-input';

export function App() {
  const dispatch = useDispatch();

  // SELECTORS
  const availableLlms = useSelector(selectAvailableLlms);
  const costPreview = useSelector(selectCostPreview);
  const sessionLlm = useSelector(selectSessionLlm);
  const messages = useSelector(selectMessages);
  const sending = useSelector(selectSending);
  const thinking = useSelector(selectThinking);
  const agentRun = useSelector(selectAgentRun);
  const analyseProgress = useSelector(selectAnalyseProgress);
  const phaseGate = useSelector(selectPhaseGate);
  const journeyPhase = useSelector(selectJourneyPhase);
  const infraStats = useSelector(selectInfraStats);
  const contextStats = useSelector(selectContextStats);
  const galileusSnapshot = useSelector(selectGalileusSnapshot);
  const galileusError = useSelector(selectGalileusError);
  const contextFiles = useSelector(selectContextFiles);
  const isDragging = useSelector(selectIsDragging);

  // LOCAL STATES
  const [mode, setMode] = useState<CodernicMode>('ask');
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [savedDraft, setSavedDraft] = useState('');
  const [missingEnvPkgs, setMissingEnvPkgs] = useState<string[] | null>(null);
  const [isAutoPilot, setIsAutoPilot] = useState(false);

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
  }, []);

  // Listen to messages from VS Code
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'codernic:last-mode' && msg.payload?.mode) {
        setMode(msg.payload.mode);
      } else if (msg.type === 'codernic:env-check') {
        setMissingEnvPkgs(msg.payload?.missing || []);
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

  const handleSend = () => {
    const text = input.trim();
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
    setPromptHistory((prev) => [...prev, text]);
    setHistoryIdx(-1);
    setSavedDraft('');
    setInput('');
    dispatch(appendMessage({ id: Math.random().toString(), role: 'user', text }));
    dispatch(setSending(true));
    dispatch(setThinking({ phase: 'thinking' }));

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', text: m.text }));
    history.push({ role: 'user', text });

    const payload =
      mode === 'plan'
        ? { task: text, mode, llmId: sessionLlm, contextFiles }
        : { llmId: sessionLlm, history, mode, contextFiles };

    dispatch(
      sendIntent({
        type: mode === 'plan' ? 'codernic:generate' : 'codernic:chat',
        payload,
      }),
    );
  };

  const handleApplyCostPreview = () => {
    if (costPreview) {
      dispatch(
        sendIntent({
          type: 'codernic:run-dag-direct',
          payload: { plan: costPreview.plan, task: costPreview.task },
        }),
      );
      setMode('agent');
      vscode.postMessage({ type: 'codernic:set-last-mode', payload: { mode: 'agent' } });
    }
    dispatch(setCostPreview(null));
  };

  const handleCancelCostPreview = () => {
    dispatch(setCostPreview(null));
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--vscode-editor-background)',
        position: 'relative',
        border: isDragging ? '2px dashed var(--vscode-focusBorder, #007acc)' : 'none',
        boxSizing: 'border-box',
      }}
    >
      <HeaderBar
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          vscode.postMessage({ type: 'codernic:set-last-mode', payload: { mode: m } });
        }}
        journeyPhase={journeyPhase}
        llmLoading={availableLlms.length === 0}
        llmOptions={availableLlms}
        sessionLlm={sessionLlm}
        onLlmChange={(l) => dispatch(setSessionLlm(l))}
        contextWindowUI={
          contextStats
            ? {
                currentTokens: contextStats.current_tokens,
                maxTokens: contextStats.max_tokens,
                usagePercent: contextStats.usage_percent,
                costEstimate: 0,
                lastUpdated: new Date().toISOString(),
                optimizedTurnCount: contextStats.turn_count,
                removedTurnsCount: 0,
                compressionRatio: 1,
                atCapacity: contextStats.usage_percent >= 100,
                statusMessage: '',
                recommendations: [],
              }
            : null
        }
        onContextWarning={(s) =>
          dispatch(
            appendMessage({
              id: Math.random().toString(),
              role: 'system',
              text: s === 'critical' ? '🔴 Critical: Context 95% full!' : '🟡 Warning: Context 85% full.',
            }),
          )
        }
        onSettingsToggle={() => setShowSettings(!showSettings)}
        isAutoPilot={isAutoPilot}
        onAutopilotToggle={() => setIsAutoPilot(!isAutoPilot)}
      />

      <InfraHud infra={infraStats} context={contextStats} />

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {showSettings ? (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        ) : (
          <MessageFeed
            mode={mode}
            messages={messages}
            agentRun={agentRun}
            onAgentRunDismiss={() => dispatch(dismissAgentRun())}
            analyseProgress={analyseProgress}
            onAnalyseProgressDismiss={() => dispatch(dismissAnalyseProgress())}
            phaseGate={phaseGate}
            onPhaseGateConfirm={() => {
              dispatch(sendIntent({ type: 'codernic:journey-confirm-phase' }));
            }}
            onPhaseGateDismiss={() => dispatch(dismissPhaseGate())}
            sending={sending}
            thinking={thinking}
            messagesEndRef={messagesEndRef}
          />
        )}
      </main>

      {!showSettings && (
        <footer style={{ flexShrink: 0, width: '100%' }}>
          {costPreview && (
            <div
              style={{
                padding: '12px',
                borderTop: '1px solid var(--border, #27272a)',
                background: '#131316',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                💰 Cost Preview — {costPreview.cost} · {costPreview.duration}
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: '11px',
                  fontFamily: 'var(--mono)',
                  overflowY: 'auto',
                  maxHeight: '100px',
                  whiteSpace: 'pre-wrap',
                  color: '#fbbf24',
                  background: '#09090b',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                }}
              >
                {costPreview.plan}
              </pre>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={handleApplyCostPreview} variant="primary" style={{ flex: 1 }}>
                  ✅ Apply Changes
                </Button>
                <Button onClick={handleCancelCostPreview} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <ContextBadgeList
            files={contextFiles}
            onRemoveFile={(id) => dispatch(removeContextFile(id))}
            onClearAll={() => dispatch(clearContextFiles())}
          />

          <ChatInput
            mode={mode}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            sending={sending}
            promptHistory={promptHistory}
            historyIdx={historyIdx}
            onHistoryIdxChange={setHistoryIdx}
            savedDraft={savedDraft}
            onSavedDraftChange={setSavedDraft}
          />
        </footer>
      )}

      {!showSettings && (
        <Accordion label="🛰️ Galileus Sequence Tracker">
          <GalileusTracker snapshot={galileusSnapshot} error={galileusError} />
        </Accordion>
      )}
    </div>
  );
}
