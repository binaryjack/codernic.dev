import React from 'react';
import { IconTerminal } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export interface SystemLogsConsoleProps {
  isOpen: boolean;
  logsHeight: number;
  systemLogs: string[];
  consoleEndRef: React.RefObject<HTMLDivElement | null>;
  dataTestId?: string;
}

export function SystemLogsConsole({ dataTestId, isOpen, logsHeight, systemLogs, consoleEndRef }: SystemLogsConsoleProps) {
  
  const { rootId, getTestId } = useTestId('system-logs-console', dataTestId);
if (!isOpen) return null;

  return (
    <div
      style={{ height: `${logsHeight}px` }}
      className="relative bg-[var(--bg-base)] border-t border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-body)] py-2 px-2.5 overflow-y-auto leading-relaxed select-text"
    >
      {/* Console header */}
      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-[var(--border-subtle)]">
        <IconTerminal data-testid={getTestId('icon-terminal')} size={11} className="text-[var(--text-muted)]" />
        <span className="section-label">System Logs</span>
      </div>
      {systemLogs.length === 0 ? (
        <div className="text-[var(--text-muted)] italic">No system logs available</div>
      ) : (
        systemLogs.map((log, idx) => {
          const isError = log.includes('ERROR') || log.includes('error');
          const isWarn = log.includes('WARN') || log.includes('warn');
          return (
            <div
              key={idx}
              className={`whitespace-pre-wrap leading-normal py-[1px] border-b border-[var(--border-subtle)] ${isError ? 'text-[var(--status-error)]' : isWarn ? 'text-[var(--amber-400)]' : 'text-[var(--text-body)]'}`}
            >
              {log}
            </div>
          );
        })
      )}
      <div ref={consoleEndRef} />
    </div>
  );
}
