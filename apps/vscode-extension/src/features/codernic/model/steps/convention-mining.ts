import * as fs from 'fs/promises';
import * as path from 'path';
import {
  hashFiles,
  markStepComplete,
  stepIsStale,
  type AnalyseManifest,
} from '../analyse-manifest';
import { INTELLIGENCE_DIR, type AnalyseRunOptions } from '../analyse-runner';
import { type Conventions } from '../analyse.types';
import { extractJsonFromLlmResponse } from '../json-extractor';
import { callLlm } from '../llm-runner';
import { loadAnalysePrompt } from '../prompt-loader';

export async function runConventionMining(
  opts: AnalyseRunOptions,
  sourceFiles: string[],
  manifest: AnalyseManifest,
  totalCostSoFar: number,
): Promise<{ manifest: AnalyseManifest; totalCost: number }> {
  if (opts.profile === 'starter') {
    return { manifest, totalCost: totalCostSoFar };
  }

  const stale = await stepIsStale(manifest, 'convention-mining', opts.profile, sourceFiles);
  if (!stale) {
    opts.onLog('[analyse:conv-mining] no changes — skipping');
    return { manifest, totalCost: totalCostSoFar };
  }

  opts.onProgress({
    steps: {
      'tech-identification': 'done',
      'convention-mining': 'running',
      'agent-generation': 'pending',
    },
    currentStep: 'convention-mining',
    totalCostUSD: totalCostSoFar,
  });

  const systemPrompt = await loadAnalysePrompt(
    'convention-mining',
    opts.workspaceRoot,
    opts.extensionPath,
  );

  const userMsg = `Use the workspace tools to examine:
1. Tool config files: .editorconfig, .prettierrc, .eslintrc, tsconfig.json
2. Sample source file naming
3. Export patterns in 3–5 representative source files

After gathering this information, immediately output the complete conventions JSON.`;

  const { text, costHint } = await callLlm(
    opts.llmId,
    systemPrompt,
    userMsg,
    opts.workspaceRoot,
    opts.onLog,
  );

  const conventions = extractJsonFromLlmResponse<Conventions>(text, 'convention mining');
  conventions.generatedAt = new Date().toISOString();

  const outDir = path.join(opts.workspaceRoot, INTELLIGENCE_DIR);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, 'conventions.json'),
    JSON.stringify(conventions, null, 2),
    'utf-8',
  );

  opts.onLog(`[analyse:conv-mining] complete — cost ≈ $${costHint.toFixed(4)}`);

  const hashes = await hashFiles(sourceFiles);
  const updatedManifest = markStepComplete(manifest, 'convention-mining', opts.profile, hashes);
  return { manifest: updatedManifest, totalCost: totalCostSoFar + costHint };
}
