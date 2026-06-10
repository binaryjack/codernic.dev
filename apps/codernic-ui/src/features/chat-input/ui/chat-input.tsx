import { useRef, useState, useEffect } from 'react';
import { erathos } from '../../../services/erathos';
import type { CodernicMode } from '../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import type { JourneyPhase } from '../../../../../codernic-ext/src/features/codernic/model/journey-state';
import type { SelectOption, InferenceMetrics } from '../../../entities/kernel';
import { ModeDropdown, AutopilotToggle } from '../../mode-selector';
import { ModelDropdown } from '../../model-selector';
import { Button } from '../../../shared';

const MODE_UI_CONFIG = {
  ask: {
    borderColor: 'var(--accent-ask, #3b82f6)',
    placeholder: 'Ask about your codebase… (safe Q&A mode, no command execution)',
  },
  plan: {
    borderColor: 'var(--accent-plan, #f59e0b)',
    placeholder: 'Describe what to build… (design mode, commands previewed but not executed)',
  },
  agent: {
    borderColor: 'var(--accent-agent, #ef4444)',
    placeholder: 'Create agent / run workflow… (full execution mode, use /help for commands)',
  },
  journey: {
    borderColor: 'var(--accent-journey, #818cf8)',
    placeholder: 'Talk to your BA… (/journey to start, /journey reset to clear)',
  },
  analyse: {
    borderColor: 'var(--accent-analyse, #06b6d4)',
    placeholder: '/analyse — extract codebase intelligence  ·  /analyse --force to re-run',
  },
} as const;

interface ChatInputProps {
  mode: CodernicMode;
  onSend: (text: string) => void;
  onAbort: () => void;
  sending: boolean;
  // Controls
  onModeChange: (mode: CodernicMode) => void;
  journeyPhase: JourneyPhase;
  llmLoading: boolean;
  llmOptions: SelectOption[];
  sessionLlm: string;
  onLlmChange: (llm: string) => void;
  routeProfiles: SelectOption[];
  routeProfile: string;
  onRouteProfileChange: (p: string) => void;
  isAutoPilot: boolean;
  onAutopilotToggle: () => void;
  useRag: boolean;
  onUseRagToggle: () => void;
  metrics: InferenceMetrics | null;
}

export function ChatInput({
  mode,
  onSend,
  onAbort,
  sending,
  onModeChange,
  journeyPhase,
  llmLoading,
  llmOptions,
  sessionLlm,
  onLlmChange,
  routeProfiles,
  routeProfile,
  onRouteProfileChange,
  isAutoPilot,
  onAutopilotToggle,
  useRag,
  onUseRagToggle,
  metrics,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIdx, setSuggestionIdx] = useState<number>(-1);
  const [input, setInput] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [savedDraft, setSavedDraft] = useState('');

  const handleSendInternal = () => {
    if (!input.trim() || sending) return;
    onSend(input);
    setPromptHistory(prev => [...prev, input.trim()]);
    setHistoryIdx(-1);
    setSavedDraft('');
    setInput('');
  };

  useEffect(() => {
    if (!input || input.trim() === '') {
      setSuggestions([]);
      setSuggestionIdx(-1);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const words = input.split(' ');
        const lastWord = words[words.length - 1];
        if (lastWord.length > 2) {
          const res = await erathos.getCompletions(input);
          setSuggestions(res.suggestions || []);
          setSuggestionIdx(-1);
        }
      } catch (e) {
        // Ignore
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [input]);

  const applySuggestion = (idx: number) => {
      if (idx >= 0 && idx < suggestions.length) {
        setInput(input + suggestions[idx]);
      setSuggestions([]);
      setSuggestionIdx(-1);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  return (
    <div
      style={{
        flexShrink: 0,
        padding: '8px',
        borderTop: '1px solid var(--border, #27272a)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: '#131316',
      }}
    >
      {suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '8px',
          background: 'var(--vscode-editor-background, #1e1e1e)',
          border: '1px solid var(--vscode-widget-border, #454545)',
          borderRadius: '4px',
          padding: '4px 0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '200px'
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => applySuggestion(i)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                background: i === suggestionIdx ? 'var(--vscode-list-activeSelectionBackground, #094771)' : 'transparent',
                color: i === suggestionIdx ? 'var(--vscode-list-activeSelectionForeground, #ffffff)' : 'var(--vscode-editor-foreground, #cccccc)',
              }}
              onMouseEnter={() => setSuggestionIdx(i)}
            >
              {s}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        placeholder={`${MODE_UI_CONFIG[mode].placeholder} · Ctrl+Enter to send`}
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (suggestions.length > 0) {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSuggestionIdx((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
              return;
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSuggestionIdx((prev) => (prev >= suggestions.length - 1 ? 0 : prev + 1));
              return;
            } else if (e.key === 'Tab' || e.key === 'Enter') {
              e.preventDefault();
              applySuggestion(suggestionIdx === -1 ? 0 : suggestionIdx);
              return;
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setSuggestions([]);
              return;
            }
          }

          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSendInternal();
          } else if (e.key === 'ArrowUp' && (input.trim() === '' || historyIdx !== -1)) {
            if (promptHistory.length === 0) return;
            e.preventDefault();
            const newIdx =
              historyIdx === -1 ? promptHistory.length - 1 : Math.max(0, historyIdx - 1);
            if (historyIdx === -1) setSavedDraft(input);
            setHistoryIdx(newIdx);
            setInput(promptHistory[newIdx]);
          } else if (e.key === 'ArrowDown' && historyIdx !== -1) {
            e.preventDefault();
            const newIdx = historyIdx + 1;
            if (newIdx >= promptHistory.length) {
              setHistoryIdx(-1);
              setInput(savedDraft);
            } else {
              setHistoryIdx(newIdx);
              setInput(promptHistory[newIdx]);
            }
          }
        }}
        disabled={sending}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 56,
          maxHeight: 120,
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: 'inherit',
          background: 'var(--vscode-input-background, #1e1e1e)',
          color: 'var(--vscode-input-foreground, #cccccc)',
          border: `2px solid ${MODE_UI_CONFIG[mode].borderColor}`,
          borderRadius: '6px',
          resize: 'vertical',
          outline: 'none',
          opacity: sending ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
      />

      {metrics && metrics.context_tokens_count > 0 && (
        <div style={{
          width: '100%',
          marginTop: '4px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '2px',
          height: '4px',
          position: 'relative',
          overflow: 'hidden'
        }} title={`Context: ${metrics.context_tokens_count} tokens used`}>
          <div style={{
            height: '100%',
            background: 'var(--vscode-charts-blue, #3b82f6)',
            width: `${Math.min(100, (metrics.context_tokens_count / 8192) * 100)}%`
          }} />
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <ModeDropdown mode={mode} onChange={onModeChange} />
          
          {mode === 'journey' && (
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--mono)',
                fontWeight: 700,
                background: 'rgba(129, 140, 248, 0.15)',
                color: '#818cf8',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              Phase {journeyPhase}
            </span>
          )}

          <ModelDropdown
            llmOptions={llmOptions}
            sessionLlm={sessionLlm}
            onChange={onLlmChange}
            loading={llmLoading}
            routeProfiles={routeProfiles}
            routeProfile={routeProfile}
            onRouteProfileChange={onRouteProfileChange}
          />

          <AutopilotToggle isAutoPilot={isAutoPilot} onToggle={onAutopilotToggle} />

          <button
            onClick={onUseRagToggle}
            title={useRag ? 'Disable RAG (Semantic Context)' : 'Enable RAG (Semantic Context)'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              opacity: useRag ? 1 : 0.4,
              filter: useRag ? 'none' : 'grayscale(100%)',
              transition: 'all 0.2s',
              fontSize: '14px',
            }}
          >
            🧠
          </button>
        </div>

        {sending ? (
          <Button
            onClick={onAbort}
            variant="danger"
            size="xs"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Stop ⏹
          </Button>
        ) : (
          <Button
            onClick={handleSendInternal}
            disabled={!input.trim()}
            variant="primary"
            size="xs"
          >
            Send ↑
          </Button>
        )}
      </div>
    </div>
  );
}
