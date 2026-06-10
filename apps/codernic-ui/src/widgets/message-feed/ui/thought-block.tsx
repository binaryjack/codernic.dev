import { useState, useEffect } from 'react';

interface ThoughtBlockProps {
  content: string;
  streaming?: boolean;
}

export function ThoughtBlock({ content, streaming }: ThoughtBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Automatically collapse when streaming finishes (unless user manually interacted)
  useEffect(() => {
    if (!streaming) {
      setIsExpanded(false);
    }
  }, [streaming]);

  return (
    <div
      className="my-3 rounded-md border border-[var(--vscode-widget-border)] overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(99, 102, 241, 0.03)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#818cf8]">🧠</span>
          <span className="text-[10px] font-bold text-[#818cf8] uppercase tracking-wider font-mono">
            {streaming ? 'Thinking Process...' : 'Reasoning Context'}
          </span>
        </div>
        <div className="text-[10px] text-[var(--vscode-descriptionForeground)]">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {isExpanded && (
        <div
          className="px-3 pb-3 pt-1 text-[11px] text-[var(--vscode-descriptionForeground)] font-mono whitespace-pre-wrap"
          style={{
            lineHeight: 1.5,
            opacity: 0.85,
          }}
        >
          {content}
          {streaming && <span className="animate-pulse"> ▊</span>}
        </div>
      )}
    </div>
  );
}
