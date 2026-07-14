import React from 'react';
import { Button } from '@ai-agencee/ui';
import { Icon } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export interface PirsigReportEntry {
  originalData: string;
  replacedBy: string;
  status: 'processed' | 'blocked';
  escalatedTo?: string;
}

export interface PirsigReportPayload {
  sessionId: string;
  overallStatus: 'processed' | 'blocked';
  entries: PirsigReportEntry[];
}

interface PirsigReportWidgetProps {
  payloadStr?: string;
  dataTestId?: string;
}

export function PirsigReportWidget({ dataTestId, payloadStr }: PirsigReportWidgetProps) {
  
  const { rootId, getTestId } = useTestId('pirsig-report-widget', dataTestId);
let payload: PirsigReportPayload | null = null;
  
  try {
    if (payloadStr) {
      payload = JSON.parse(payloadStr);
    }
  } catch (e) {
    console.error('Failed to parse Pirsig report payload', e);
  }

  if (!payload) {
    return (
      <div className="p-4 bg-red-900/20 text-red-400 rounded-md border border-red-500/30 text-xs">
        <Icon data-testid={getTestId('icon')} name="warning" className="inline-block w-4 h-4 mr-2" />
        Failed to load Pirsig Report data.
      </div>
    );
  }

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `pirsig-report-${payload?.sessionId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div data-testid={rootId} data-demo-desc="[CODER] In-conversation B2B Sovereign Gate Keeper audits code changes to guarantee policy compliance." className="my-3 rounded-lg border border-[var(--vscode-widget-border)] bg-[#1e1e24] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--vscode-widget-border)] bg-[#27272a]/50">
        <div className="flex items-center gap-2">
          {payload.overallStatus === 'blocked' ? (
            <Icon data-testid={getTestId('icon-1')} name="warning" className="w-5 h-5 text-red-400" />
          ) : (
            <Icon data-testid={getTestId('icon-2')} name="security" className="w-5 h-5 text-emerald-400" />
          )}
          <span className="font-semibold text-sm text-zinc-200 font-[var(--mono)] tracking-wide">
            PIRSIG SOVEREIGN GATE KEEPER
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-[var(--mono)]">ID: {payload.sessionId.substring(0,8)}...</span>
          <Button data-testid={getTestId('button')} variant="outline" size="sm" onClick={handleDownload} className="h-7 text-[10px] px-2 gap-1 bg-transparent border-zinc-700 hover:bg-zinc-800">
            <Icon data-testid={getTestId('icon-3')} name="document" className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#18181b] border-b border-[var(--vscode-widget-border)]">
              <th className="px-4 py-2 font-medium text-zinc-400 whitespace-nowrap">Original Data</th>
              <th className="px-4 py-2 font-medium text-zinc-400 whitespace-nowrap">Replaced By</th>
              <th className="px-4 py-2 font-medium text-zinc-400 whitespace-nowrap">Status</th>
              <th className="px-4 py-2 font-medium text-zinc-400 whitespace-nowrap">Escalation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--vscode-widget-border)]">
            {payload.entries.map((entry, idx) => (
              <tr key={idx} className="hover:bg-[#27272a]/30 transition-colors">
                <td className="px-4 py-2 text-zinc-300 font-[var(--mono)]">
                  {entry.originalData}
                </td>
                <td className="px-4 py-2">
                  <code className="px-1.5 py-0.5 rounded bg-[#18181b] text-emerald-400 font-[var(--mono)] text-[11px]">
                    {entry.replacedBy || 'N/A'}
                  </code>
                </td>
                <td className="px-4 py-2">
                  {entry.status === 'blocked' ? (
                    <span className="inline-flex items-center gap-1 text-red-400 px-1.5 py-0.5 rounded-full bg-red-400/10 text-[10px] uppercase font-bold tracking-wider border border-red-400/20">
                      Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400 px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-[10px] uppercase font-bold tracking-wider border border-emerald-400/20">
                      Processed
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-500 font-[var(--mono)] text-[10px]">
                  {entry.escalatedTo || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
