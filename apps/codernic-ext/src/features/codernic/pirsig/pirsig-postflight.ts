/**
 * @file pirsig-postflight.ts
 * @description Runs a Pirsig quality diff after AGENT mode execution.
 *
 * Compares the post-execution quality score against the pre-execution
 * baseline (if provided) and emits a colour-coded summary line.
 */

import * as vscode from 'vscode';
import { callMcpTool, type McpClientInstance, type McpTextContent } from '../../../shared/mcp';
import type { PirsigBaseline } from './pirsig-preflight';

interface PirsigReportShape {
  kpis?: {
    namingConsistency?: number;
    exportDiscipline?: number;
    testCoverage?: number;
    overall?: number;
  };
  violations?: Array<{
    dimension?: string;
    symbolName?: string;
  }>;
}

/**
 * Calls `pirsig-audit { withDrift: true }` after agent execution and emits:
 *   ✅  Quality improved or unchanged
 *   ⚠️  Minor regression (< 5 points)
 *   ❌  Major regression (≥ 5 points)
 *
 * Silently skips if `mcpClient` is null or the tool call fails.
 */
export async function runPirsigPostflight(
  mcpClient: McpClientInstance | null,
  workspaceRoot: string,
  stream: vscode.ChatResponseStream,
  previousBaseline?: PirsigBaseline,
): Promise<void> {
  if (!mcpClient) return;

  try {
    const result = await callMcpTool(mcpClient, {
      name: 'pirsig-audit',
      arguments: { projectRoot: workspaceRoot, withDrift: true },
    });

    const text = result.content
      .filter(
        (c): c is McpTextContent =>
          c.type === 'text' && typeof (c as { text?: unknown }).text === 'string',
      )
      .map((c: McpTextContent) => c.text)
      .join('');

    if (!text) return;

    const report = JSON.parse(text) as PirsigReportShape;
    const kpis = report.kpis;
    if (!kpis) return;

    const current = Math.round(kpis.overall ?? 0);
    const violationCount = report.violations?.length ?? 0;

    // Group violations by dimension for the detail line
    const byDimension: Record<string, number> = {};
    for (const v of report.violations ?? []) {
      const dim = v.dimension ?? 'other';
      byDimension[dim] = (byDimension[dim] ?? 0) + 1;
    }
    const detail = Object.entries(byDimension)
      .map(([d, n]) => `${d}: ${n}`)
      .join(', ');

    if (previousBaseline) {
      const prev = Math.round(previousBaseline.kpis.overall);
      const delta = current - prev;

      if (delta >= 0) {
        stream.markdown(`✅ *Quality: ${prev} → ${current} · ${violationCount} violations*\n\n`);
      } else if (delta > -5) {
        stream.markdown(
          `⚠️ *Quality: ${prev} → ${current} · ${violationCount} violations${detail ? ` [${detail}]` : ''}*\n\n`,
        );
      } else {
        stream.markdown(
          `❌ *Quality degraded: ${prev} → ${current} · ${violationCount} violations — review before merging*\n\n`,
        );
      }
    } else {
      // No baseline — just show current score
      stream.markdown(
        `📊 *Quality score: **${current} pts** · ${violationCount} violations${detail ? ` [${detail}]` : ''}*\n\n`,
      );
    }
  } catch {
    // Postflight is best-effort — never surface errors to the user
  }
}
