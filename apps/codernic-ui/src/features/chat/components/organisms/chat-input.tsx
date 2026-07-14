import { useEffect, useRef, useState } from 'react';
import type { CodernicMode } from '../../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import type { JourneyPhase } from '../../../../../../codernic-ext/src/features/codernic/model/journey-state';
import type { InferenceMetrics, SelectOption } from '../../../../entities/kernel/model/types';
import { erathos } from '../../../../services/erathos';
import { AutopilotToggle, ModeDropdown } from '../../../mode-selector';
import { AutocompleteMenu } from '../molecules/autocomplete-menu';
import { ModelDropdown } from '../../../models/components/molecules/model-dropdown';
import { Button } from '@ai-agencee/ui';
import { ChatInputGlowWrapper } from '@ai-agencee/ui';
import { ChatInputHeader } from '../molecules/ChatInputHeader';
import { WorkflowEngine } from '../../store/WorkflowEngine';
import { useTestId } from '@ai-agencee/ui';


const MODE_UI_CONFIG: Record<CodernicMode, { borderColor: string; placeholder: string }> = {
  brainstorm: {
    borderColor: 'var(--accent-ask, #3b82f6)',
    placeholder: 'Ask about your codebase… (safe Q&A mode, no command execution)',
  },
  plan: {
    borderColor: 'var(--accent-plan, #f59e0b)',
    placeholder: 'Describe what to build… (design mode, commands previewed but not executed)',
  },
  builder: {
    borderColor: 'var(--accent-builder, #ef4444)',
    placeholder: 'Create builder / run workflow… (full execution mode, use /help for commands)',
  },
  journey: {
    borderColor: 'var(--accent-journey, #818cf8)',
    placeholder: 'Talk to your BA… (/journey to start, /journey reset to clear)',
  },
  analyse: {
    borderColor: 'var(--accent-analyse, #06b6d4)',
    placeholder: '/analyse — extract codebase intelligence  ·  /analyse --force to re-run',
  },
  agent: {
    borderColor: 'var(--accent-ask, #3b82f6)',
    placeholder: 'Ask the Agent corporate knowledge… · Enter to send',
  },
} as const;

interface ChatInputProps {
  sessionName?: string;
  mode: CodernicMode;
  onSend: (text: string) => void;
  onAbort: () => void;
  sending: boolean;
  // Controls
  onModeChange: (mode: CodernicMode) => void;
  builderSubMode?: 'manuel' | 'automatic' | 'dag';
  onTransitionToDag?: () => void;
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
  isPlanFrozen?: boolean;
  dataTestId?: string;
  'data-demo-desc'?: string;
}

export function ChatInput({ dataTestId, 'data-demo-desc': dataDemoDesc,
  sessionName,
  mode,
  onSend,
  onAbort,
  sending,
  onModeChange,
  builderSubMode,
  onTransitionToDag,
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
  isPlanFrozen = false
}: ChatInputProps) {
  
  const { rootId, getTestId } = useTestId('chat-input', dataTestId);
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
    setPromptHistory((prev) => [...prev, input.trim()]);
    setHistoryIdx(-1);
    setSavedDraft('');
    setInput('');
  };

  useEffect(() => {
    if (!input || input.trim() === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        console.debug('Autocomplete ignored', e);
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
    <div className="flex-shrink-0 p-4 border-t border-[var(--border)] bg-[#131316]" data-testid={dataTestId || "chat-input"} data-demo-desc={dataDemoDesc}>
      <ChatInputGlowWrapper data-testid={getTestId('chat-input-glow-wrapper')} sending={sending}>
        <ChatInputHeader data-testid={getTestId('chat-input-header')} sessionName={sessionName} />

        <AutocompleteMenu data-testid={getTestId('autocomplete-menu')}
          suggestions={suggestions}
          suggestionIdx={suggestionIdx}
          onApply={applySuggestion}
          onHover={setSuggestionIdx}
        />
        <textarea
          data-testid="chat-textarea"
          ref={textareaRef}
          placeholder={mode === 'builder' && builderSubMode === 'dag' ? 'DAG execution in progress (Read-only)' : `${MODE_UI_CONFIG[mode].placeholder} · Ctrl+Enter to send`}
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
          disabled={sending || (mode === 'builder' && builderSubMode === 'dag')}
          className="w-full box-border min-h-[56px] max-h-[200px] p-0 text-[13px] leading-relaxed font-inherit bg-transparent text-[var(--vscode-input-foreground)] border-none resize-y outline-none disabled:opacity-50"
        />



        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <ModeDropdown dataTestId="chat-mode-selector" data-demo-desc="[CODER] Switch seamlessly between different cognitive modes (Brainstorm, Plan, Builder, etc.)." mode={mode} onChange={onModeChange} />

            {mode === 'journey' && (
              <span className="text-[10px] font-mono font-bold bg-[#818cf826] text-[#818cf8] py-0.5 px-1.5 rounded">
                Phase {journeyPhase}
              </span>
            )}
            
            {mode === 'plan' && onTransitionToDag && WorkflowEngine.isElementVisible('implement-now-button', mode, isPlanFrozen) && (
              <Button data-testid="implement-now-button" size="sm" variant="outline" className="text-amber-500 border-amber-500 hover:bg-amber-500/10" onClick={onTransitionToDag}>
                Implement Now
              </Button>
            )}

            {mode === 'builder' && builderSubMode === 'dag' && (
              <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-400 py-0.5 px-1.5 rounded">
                DAG
              </span>
            )}

            <ModelDropdown data-testid={getTestId('model-dropdown')}
              data-demo-desc-provider="[CODER] Select LLM providers (e.g. GitHub Copilot, custom endpoints) on the fly."
              data-demo-desc-model="[CODER] Swap between available model options for the selected provider."
              llmOptions={llmOptions}
              sessionLlm={sessionLlm}
              onChange={onLlmChange}
              loading={llmLoading}
              routeProfiles={routeProfiles}
              routeProfile={routeProfile}
              onRouteProfileChange={onRouteProfileChange}
            />

            {!(mode === 'builder' && builderSubMode === 'dag') && (
              <AutopilotToggle data-testid={getTestId('autopilot-toggle')} data-demo-desc="[CODER] Toggle full autonomous execution mode." isAutoPilot={isAutoPilot} onToggle={onAutopilotToggle} />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onUseRagToggle}
              title={
                useRag
                  ? 'Disable RAG (Retrieval-Augmented Generation context)'
                  : 'Enable RAG (Retrieval-Augmented Generation context)'
              }
              className={`transition-all ${useRag ? 'opacity-100' : 'opacity-40 grayscale'}`}
              data-testid={getTestId('rag-toggle')}
              data-demo-desc="[CODER] Toggle Retrieval-Augmented Generation (RAG) for codebase semantic context."
            >
              <div className={`flex items-center justify-center w-[18px] h-[18px] rounded font-mono text-[10px] font-bold ${useRag ? 'bg-[var(--amber-glow)] text-[var(--amber-400)] border border-amber-500/30' : 'bg-transparent text-[var(--text-muted)] border border-[var(--border)]'}`}>
                R
              </div>
            </Button>
          </div>

          {sending ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAbort}
              title="Stop Generation"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
              data-testid={getTestId('button-1')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="send-btn"
              onClick={handleSendInternal}
              disabled={!input.trim()}
              title="Send Message"
              data-testid="chat-send-button"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <div className="send-btn-circle absolute w-5 h-5 rounded-full border-2 border-[var(--amber-500)]" />
                <div className="send-btn-circle absolute w-2 h-2 rounded-full bg-[var(--amber-500)]" style={{ animationDelay: '0.5s' }} />
              </div>
            </Button>
          )}
        </div>
      </ChatInputGlowWrapper>
    </div>
  );
}
