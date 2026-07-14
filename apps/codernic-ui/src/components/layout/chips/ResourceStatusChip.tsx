import React from 'react';
import { StatusChipBase } from './StatusChipBase';
import { useTestId } from '@ai-agencee/ui';

export interface ResourceStatusChipProps {
  cpuStr: string;
  ramStr: string;
  vramStr: string;
  dataTestId?: string;
}

export function ResourceStatusChip({ dataTestId, cpuStr, ramStr, vramStr }: ResourceStatusChipProps) {
  
  const { rootId, getTestId } = useTestId('resource-status-chip', dataTestId);
return (
    <StatusChipBase data-testid={getTestId('status-chip-base')} title="System Resources">
      <span className="opacity-50">CPU</span>
      <span className="text-[var(--text-primary)] font-semibold">{cpuStr}</span>
      <span className="mx-0.5 opacity-20">|</span>
      
      <span className="opacity-50">RAM</span>
      <span className="text-[var(--text-primary)] font-semibold">{ramStr}</span>
      <span className="mx-0.5 opacity-20">|</span>
      
      <span className="opacity-50">VRAM</span>
      <span className="text-[var(--text-primary)] font-semibold">{vramStr}</span>
    </StatusChipBase>
  );
}
