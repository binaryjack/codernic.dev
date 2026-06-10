/**
 * @file pirsig-preflight.ts
 * @description Runs a Pirsig quality snapshot before AGENT mode execution.
 *
 * Emits a terse one-line style summary to the stream so the developer knows
 * the baseline score before the agent makes any changes.
 */

import * as vscode from 'vscode';
import { callMcpTool, type McpClientInstance, type McpTextContent } from '../../../shared/mcp';

export interface PirsigBaseline {
  kpis: {
    namingConsistency: number;
    exportDiscipline: number;
    testCoverage: number;
    overall: number;
  };
}

interface PirsigReportShape {
  kpis?: {
    namingConsistency?: number;
    exportDiscipline?: number;
    testCoverage?: number;
    overall?: number;
  };
  profile?: {
    naming?: { functions?: string };
    structure?: { prefersNamedExports?: boolean };
    testing?: { testFileRatio?: number };
  };
}

/**
 * Calls `pirsig-audit` (no drift) and emits a one-line baseline summary.
 * Returns `{ kpis }` for use in post-flight delta, or `null` on failure.
 */
export async function runPirsigPreflight(
  mcpClient: McpClientInstance | null,
  workspaceRoot: string,
  stream: vscode.ChatResponseStream,
): Promise<PirsigBaseline | null> {
  if (!mcpClient) return null;

  try {
    const result = await callMcpTool(mcpClient, {
      name: 'pirsig-audit',
      arguments: { projectRoot: workspaceRoot, withDrift: false },
    });

    const text = result.content
      .filter(
        (c): c is McpTextContent =>
          c.type === 'text' && typeof (c as { text?: unknown }).text === 'string',
      )
      .map((c: McpTextContent) => c.text)
      .join('');

    if (!text) return null;

    const report = JSON.parse(text) as PirsigReportShape;
    const kpis = report.kpis;
    if (!kpis) return null;

    const baseline: PirsigBaseline = {
      kpis: {
        namingConsistency: kpis.namingConsistency ?? 0,
        exportDiscipline: kpis.exportDiscipline ?? 0,
        testCoverage: kpis.testCoverage ?? 0,
        overall: kpis.overall ?? 0,
      },
    };

    const namingStyle = report.profile?.naming?.functions ?? 'unknown';
    const hasNamedExports = report.profile?.structure?.prefersNamedExports
      ? 'named exports'
      : 'default exports';
    const score = Math.round(baseline.kpis.overall);

    stream.markdown(
      `📊 *StyleProfile: ${namingStyle} · ${hasNamedExports} · baseline **${score} pts***\n\n`,
    );

    return baseline;
  } catch {
    return null;
  }
}
