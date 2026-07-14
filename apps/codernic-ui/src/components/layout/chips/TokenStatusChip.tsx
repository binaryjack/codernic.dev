import React, { useState } from 'react';
import { StatusChipBase } from './StatusChipBase';
import type { CodernicContextFile } from '@binaryjack/state-factories';
import { useTestId } from '@ai-agencee/ui';

export interface TokenStatusChipProps {
  tokenPct: number;
  currentTokens: number;
  dynamicMaxTokens: number;
  sessionLlm: string;
  contextFiles: CodernicContextFile[];
  dataTestId?: string;
}

export function TokenStatusChip({ dataTestId,
  tokenPct,
  currentTokens,
  dynamicMaxTokens,
  sessionLlm,
  contextFiles
}: TokenStatusChipProps) {
  
  const { rootId, getTestId } = useTestId('token-status-chip', dataTestId);
const [showContextHover, setShowContextHover] = useState(false);

  const dynamicColor = tokenPct > 80 ? 'text-[var(--status-error)]' : tokenPct > 60 ? 'text-[var(--amber-400)]' : 'text-[var(--text-body)]';
  const dynamicBorder = tokenPct > 80 ? 'border-red-400/25' : tokenPct > 60 ? 'border-amber-400/25' : 'border-[var(--border-subtle)]';

  return (
    <StatusChipBase data-testid={getTestId('status-chip-base')}
      className={`cursor-help relative ${dynamicColor} ${dynamicBorder}`}
      title={`Context: ${currentTokens.toLocaleString()} / ${dynamicMaxTokens.toLocaleString()} tokens (${tokenPct}%)`}
      onMouseEnter={() => setShowContextHover(true)}
      onMouseLeave={() => setShowContextHover(false)}
    >
      <span>TK</span>
      <span className="font-bold">
        {currentTokens > 999 ? `${(currentTokens / 1000).toFixed(1)}k` : currentTokens}
      </span>
      <span className="opacity-40">/</span>
      <span className="opacity-60">{(dynamicMaxTokens / 1000).toFixed(0)}k</span>

      {/* Context Management Hover Popup */}
      {showContextHover && (
        <div 
          className="absolute bottom-full left-0 mb-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-md py-2 px-3 w-[260px] shadow-xl z-[100] cursor-default flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-1">
            <span className="font-semibold text-[var(--text-primary)]">Context Management</span>
            <span className="text-[9px] text-[var(--text-muted)]">{tokenPct}% used</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Model: <strong className="text-[var(--text-body)]">{sessionLlm || 'Default'}</strong> ({dynamicMaxTokens.toLocaleString()} max tokens)
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[var(--text-body)] mt-1">Loaded Files:</span>
            {contextFiles && contextFiles.length > 0 ? (
              <div className="max-h-[120px] overflow-y-auto flex flex-col gap-0.5">
                {contextFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px]">
                    <span className="text-[var(--amber-400)]">•</span>
                    <span className="truncate">{f.fileName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[9px] italic opacity-60">No explicit files loaded in context.</span>
            )}
          </div>
        </div>
      )}
    </StatusChipBase>
  );
}
