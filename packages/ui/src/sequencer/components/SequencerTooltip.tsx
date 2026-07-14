import React from 'react';
import { StepAction } from '../core/StateMachine';
import { Button } from '../../atoms/button';
import { useTestId } from '../../hooks/useTestId';

interface SequencerTooltipProps {
  step: StepAction;
  onNext: () => void;
  onSkip: () => void;
  dataTestId?: string;
  fallbackContent?: string;
}

export function SequencerTooltip({ dataTestId, step, onNext, onSkip, fallbackContent }: SequencerTooltipProps) {
  
  const { rootId, getTestId } = useTestId('sequencer-tooltip', dataTestId);
  
  const displayContent = step.content || fallbackContent;

  const parseMarkdownLinks = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a 
          key={matchIndex} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-amber-400 hover:text-amber-300 underline font-medium transition-colors"
        >
          {linkText}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="w-[450px] p-6 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 z-[10000]">
      {displayContent && (
        <p className="text-base text-zinc-200 leading-relaxed font-sans whitespace-pre-line">
          {parseMarkdownLinks(displayContent)}
        </p>
      )}
      
      <div className={`flex items-center justify-between mt-2 pt-3 ${displayContent ? 'border-t border-zinc-800' : ''}`}>
        <button onClick={onSkip} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium">
          Skip Demo
        </button>
        <Button data-testid={getTestId('button')} onClick={onNext} variant="primary" size="sm" className="!text-xs !px-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          {step.next ? 'Next' : 'Finish'}
        </Button>
      </div>
    </div>
  );
}
