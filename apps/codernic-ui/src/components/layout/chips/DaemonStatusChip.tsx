import React from 'react';
import { StatusChipBase } from './StatusChipBase';
import { useTestId } from '@ai-agencee/ui';

export interface DaemonStatusChipProps {
  daemonOk?: boolean;
  daemonStatus: string;
  sandboxMode?: boolean;
  dataTestId?: string;
}

export function DaemonStatusChip({ dataTestId, daemonStatus, sandboxMode }: DaemonStatusChipProps) {
  
  const { rootId, getTestId } = useTestId('daemon-status-chip', dataTestId);
  let colorClass = 'text-[var(--text-muted)]';
  let dotClass = 'bg-[var(--border-active)]';
  let shouldPulse = false;

  if (sandboxMode) {
    colorClass = 'text-blue-400 border-blue-400/20 bg-blue-400/10 font-bold';
    dotClass = 'bg-blue-400 shadow-[0_0_4px_#60a5fa]';
  } else if (daemonStatus === 'running' || daemonStatus === 'connected') {
    colorClass = 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10 font-bold';
    dotClass = 'bg-emerald-400 shadow-[0_0_4px_#34d399]';
  } else if (daemonStatus === 'stopped' || daemonStatus === 'disconnected') {
    colorClass = 'text-rose-500 border-rose-500/20 bg-rose-500/10 font-bold';
    dotClass = 'bg-rose-500 shadow-[0_0_4px_#fb7185]';
  } else {
    // starting, stopping, loading, reloading
    colorClass = 'text-amber-400 border-amber-400/20 bg-amber-400/10 font-bold';
    dotClass = 'bg-amber-400 shadow-[0_0_4px_#fbbf24]';
    shouldPulse = true;
  }

  return (
    <StatusChipBase data-testid={getTestId('status-chip-base')}
      className={`border-transparent ${colorClass}`}
      title={sandboxMode ? `SaaS Interactive Simulator Active` : `Daemon Status: ${daemonStatus}`}
    >
      <div className={`w-[5px] h-[5px] rounded-full ${dotClass} ${shouldPulse ? 'animate-pulse' : ''}`} />
      <span>{sandboxMode ? 'SandBox' : 'Daemon'}</span>
    </StatusChipBase>
  );
}
