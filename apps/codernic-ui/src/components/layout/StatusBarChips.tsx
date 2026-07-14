import React from 'react';
import { IconThought, IconShield, IconZap, IconCheckCircle, IconCpu } from '@ai-agencee/ui';
import type { CodernicContextFile } from '@binaryjack/state-factories';

import { TokenStatusChip } from './chips/TokenStatusChip';
import { ResourceStatusChip } from './chips/ResourceStatusChip';
import { RagStatusChip } from './chips/RagStatusChip';
import { DaemonStatusChip } from './chips/DaemonStatusChip';
import { StatusChipBase } from './chips/StatusChipBase';
import { useTestId } from '@ai-agencee/ui';

export interface StatusBarChipsProps {
  tokenPct: number;
  currentTokens: number;
  dynamicMaxTokens: number;
  sessionLlm: string;
  contextFiles: CodernicContextFile[];
  cpuStr: string;
  ramStr: string;
  vramStr: string;
  isIndexing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ragProgress: any;
  isThinking: boolean;
  thinking: { phase: string; details?: string };
  daemonStatus: string;
  gpuTarget: string | null;
  appVersion: string;
  isOpen: boolean;
  daemonOk: boolean;
  isStale?: boolean;
  loraTrainingStatus: string | null;
  isAutoPilot?: boolean;
  useRag?: boolean;
  sandboxMode?: boolean;
  dataTestId?: string;
}

export function StatusBarChips({ dataTestId,
  tokenPct,
  currentTokens,
  dynamicMaxTokens,
  sessionLlm,
  contextFiles,
  cpuStr,
  ramStr,
  vramStr,
  isIndexing,
  ragProgress,
  isThinking,
  thinking,
  daemonStatus,
  gpuTarget,
  appVersion,
  isOpen,
  daemonOk,
  isStale,
  loraTrainingStatus,
  isAutoPilot,
  useRag,
  sandboxMode
}: StatusBarChipsProps) {
  
  const { rootId, getTestId } = useTestId('status-bar-chips', dataTestId);
return (
    <>
      {/* Left side chips */}
      <div className="flex items-center gap-1.5">
        <TokenStatusChip data-testid={getTestId('token-status-chip')}
          tokenPct={tokenPct}
          currentTokens={currentTokens}
          dynamicMaxTokens={dynamicMaxTokens}
          sessionLlm={sessionLlm}
          contextFiles={contextFiles}
        />

        <ResourceStatusChip data-testid={getTestId('resource-status-chip')} cpuStr={cpuStr} ramStr={ramStr} vramStr={vramStr} />

        {/* Separator */}
        <span className="text-[var(--border)] text-xs">│</span>

        <RagStatusChip data-testid={getTestId('rag-status-chip')} isStale={isStale} isIndexing={isIndexing} ragProgress={ragProgress} useRag={useRag ?? true} />

        {/* Separator */}
        <span className="text-[var(--border)] text-xs">│</span>

        {/* Enterprise Anonymization Chip */}
        <StatusChipBase data-testid={getTestId('status-chip-base')}
          className="text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
          title="Enterprise AST Anonymization Active"
        >
          <IconShield data-testid={getTestId('icon-shield')} size={10} className="animate-pulse" />
          <span>AST Anonymizer</span>
        </StatusChipBase>

        {/* Execution Mode Chip */}
        {isAutoPilot ? (
          <StatusChipBase data-testid={getTestId('status-chip-base-1')}
            className="text-amber-400 border-amber-400/20 bg-amber-400/10 font-bold"
            title="AutoPilot (YOLO) Mode Active"
          >
            <IconZap data-testid={getTestId('icon-zap')} size={10} className="animate-pulse" />
            <span>AUTOPILOT ON</span>
          </StatusChipBase>
        ) : (
          <StatusChipBase data-testid={getTestId('status-chip-base-2')}
            className="text-blue-400 border-blue-400/20 bg-blue-400/10 font-bold"
            title="Manual Supervision Active"
          >
            <IconCheckCircle data-testid={getTestId('icon-check-circle')} size={10} />
            <span>MANUAL MODE</span>
          </StatusChipBase>
        )}

        {/* LLM thinking */}
        {isThinking && (
          <StatusChipBase data-testid={getTestId('status-chip-base-3')}
            className="text-[var(--amber-400)] border-amber-400/25"
            title={`LLM Active: ${thinking.phase}`}
          >
            <IconThought data-testid={getTestId('icon-thought')} size={10} className="animate-pulse-amber" />
            <span>{thinking.phase}</span>
          </StatusChipBase>
        )}

        {/* LoRA Training */}
        {loraTrainingStatus && (
          <StatusChipBase data-testid={getTestId('status-chip-base-4')}
            className="text-[var(--purple-400)] border-purple-400/25"
            title={`Training LoRA: ${loraTrainingStatus}`}
          >
            <span className="animate-spin text-[10px]">⚙</span>
            <span>Training: {loraTrainingStatus}</span>
          </StatusChipBase>
        )}
      </div>

      {/* Right side chips */}
      <div className="flex items-center gap-1.5">
        <DaemonStatusChip data-testid={getTestId('daemon-status-chip')} daemonStatus={daemonStatus} sandboxMode={sandboxMode} />

        {/* GPU target */}
        {(() => {
          if (!gpuTarget) {
            return (
              <StatusChipBase data-testid={getTestId('status-chip-base')} className="text-[var(--text-muted)] border-zinc-500/20 bg-zinc-500/10 font-bold tracking-widest uppercase" title="Compute target">
                <IconCpu data-testid={getTestId('icon-cpu')} size={10} className="mr-0.5" />
                <span>CPU</span>
              </StatusChipBase>
            );
          }
          const target = gpuTarget.toUpperCase();
          let colorClass = "text-amber-400 border-amber-400/20 bg-amber-400/10";
          if (target.includes('CUDA')) {
            colorClass = "text-emerald-400 border-emerald-400/20 bg-emerald-400/10";
          } else if (target.includes('ROCM') || target.includes('AMD')) {
            colorClass = "text-rose-500 border-rose-500/20 bg-rose-500/10";
          } else if (target.includes('METAL') || target.includes('APPLE')) {
            colorClass = "text-slate-300 border-slate-300/20 bg-slate-300/10";
          }
          return (
            <StatusChipBase data-testid={getTestId('status-chip-base-1')}
              className={`font-bold tracking-widest uppercase ${colorClass}`}
              title="Compute target"
            >
              <IconCpu data-testid={getTestId('icon-cpu-1')} size={10} className="mr-0.5" />
              <span>{target}</span>
            </StatusChipBase>
          );
        })()}

        {/* Version */}
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          {appVersion ? `v${appVersion}` : 'v0.0.0'}
        </span>

        {/* Chevron */}
        <span className="text-[9px] text-[var(--text-muted)]">
          {isOpen ? '▼' : '▲'}
        </span>
      </div>
    </>
  );
}
