import React from 'react';
import { StatusChipBase } from './StatusChipBase';
import { IconDatabase, IconLoader } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export interface RagStatusChipProps {
  isIndexing: boolean;
  isStale?: boolean;
  ragProgress: { file: string; step: string } | null;
  useRag: boolean;
  dataTestId?: string;
}

export function RagStatusChip({ dataTestId, isIndexing, isStale = false, ragProgress, useRag }: RagStatusChipProps) {
  
  const { rootId, getTestId } = useTestId('rag-status-chip', dataTestId);
if (!useRag) {
    return (
      <StatusChipBase data-testid={getTestId('status-chip-base')}
        className="text-[var(--text-muted)] border-zinc-500/20 bg-zinc-500/10"
        title="Ragtime Context Engine is Disabled"
      >
        <IconDatabase data-testid={getTestId('icon-database')} size={10} className="opacity-50" />
        <span className="line-through opacity-50">Ragtime</span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1">OFF</span>
      </StatusChipBase>
    );
  }
  let content = "Index Ready";
  let colorClass = 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10 font-bold';
  let icon = <IconDatabase size={10} />;
  let title = "RAG Index is up to date";

  if (isIndexing) {
    content = "Indexing";
    colorClass = 'border-[var(--status-warning)] text-[var(--status-warning)]';
    icon = <IconLoader data-testid={getTestId('icon-loader')} className="animate-spin text-[var(--status-warning)]" size={10} />;
    title = `Indexing: ${ragProgress?.step} - ${ragProgress?.file}`;
  } else if (isStale) {
    content = "Index Stale";
    colorClass = 'border-[var(--status-warning)] text-[var(--status-warning)] opacity-90';
    icon = <IconDatabase data-testid={getTestId('icon-database-1')} size={10} className="opacity-70" />;
    title = "RAG Index is stale (needs update)";
  }

  return (
    <StatusChipBase data-testid={getTestId('status-chip-base-1')}
      className={`transition-colors ${colorClass}`}
      title={title}
    >
      {icon}
      <span>{content}</span>
    </StatusChipBase>
  );
}
