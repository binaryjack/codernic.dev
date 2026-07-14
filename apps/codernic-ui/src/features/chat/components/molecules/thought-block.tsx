import { useState, useEffect } from 'react';
import { useHubEvent, IconThought } from '@ai-agencee/ui';

interface ThoughtBlockProps {
  id?: string;
  content: string;
  streaming?: boolean;
  'data-testid'?: string;
}

export function ThoughtBlock({ id, content, streaming, 'data-testid': dataTestId }: ThoughtBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Automatically collapse when streaming finishes (unless user manually interacted)
  useEffect(() => {
    if (!streaming) {
      setIsExpanded(false);
    }
  }, [streaming]);

  useHubEvent('codernic:focus-thought', (event) => {
    if (!id) return;
    if (event.payload.id === id) {
      setIsExpanded(true);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
    }
  });

  return (
    <div
      id={id}
      data-testid={dataTestId || "chat-message-thinking"}
      data-demo-desc="[CODER] Deep-dive reasoning block shows the agent's internal monologue."
      className={`my-2 py-1 transition-all duration-300 ${isHighlighted ? 'bg-white/5 ring-1 ring-white/10 rounded-sm' : ''}`}
      style={{
        borderLeft: '2px solid var(--vscode-widget-border, #3f3f46)',
        background: 'transparent',
        paddingLeft: '12px',
      }}
    >
      <div
        className="flex items-center justify-between cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (id) {
            import('@ai-agencee/ui').then(({ WidgetHub }) => {
              WidgetHub.publish({
                type: 'codernic:focus-introspection',
                payload: { id },
                dedupKey: `focus-intro-${id}`
              });
            });
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-mono tracking-wide">
            THINKING
          </span>
          {streaming && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"></span>
            </span>
          )}
        </div>
        <div className="text-zinc-600">
          <IconThought size={12} />
        </div>
      </div>
      
      {isExpanded && (
        <div 
          className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed mt-2"
        >
          {content}
          {streaming && <span className="ml-1 animate-pulse">▊</span>}
        </div>
      )}
    </div>
  );
}
