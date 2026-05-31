import { useRef } from 'react';
import type { CodernicMode } from '../../../../../vscode-extension/src/features/codernic/model/codernic-mode.types';
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
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  promptHistory: string[];
  historyIdx: number;
  onHistoryIdxChange: (idx: number) => void;
  savedDraft: string;
  onSavedDraftChange: (draft: string) => void;
}

export function ChatInput({
  mode,
  input,
  onInputChange,
  onSend,
  sending,
  promptHistory,
  historyIdx,
  onHistoryIdxChange,
  savedDraft,
  onSavedDraftChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <textarea
        ref={textareaRef}
        placeholder={`${MODE_UI_CONFIG[mode].placeholder} · Ctrl+Enter to send`}
        value={input}
        onChange={(e) => onInputChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSend();
          } else if (e.key === 'ArrowUp' && (input.trim() === '' || historyIdx !== -1)) {
            if (promptHistory.length === 0) return;
            e.preventDefault();
            const newIdx =
              historyIdx === -1 ? promptHistory.length - 1 : Math.max(0, historyIdx - 1);
            if (historyIdx === -1) onSavedDraftChange(input);
            onHistoryIdxChange(newIdx);
            onInputChange(promptHistory[newIdx]);
          } else if (e.key === 'ArrowDown' && historyIdx !== -1) {
            e.preventDefault();
            const newIdx = historyIdx + 1;
            if (newIdx >= promptHistory.length) {
              onHistoryIdxChange(-1);
              onInputChange(savedDraft);
            } else {
              onHistoryIdxChange(newIdx);
              onInputChange(promptHistory[newIdx]);
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={onSend}
          disabled={sending || !input.trim()}
          variant="primary"
          size="xs"
        >
          {sending ? '…' : 'Send ↑'}
        </Button>
      </div>
    </div>
  );
}
