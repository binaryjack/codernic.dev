import * as fs from 'fs/promises';
import * as path from 'path';
import {
  hashFiles,
  markStepComplete,
  stepIsStale,
  type AnalyseManifest,
} from '../analyse-manifest';
import { INTELLIGENCE_DIR, intelligencePath, type AnalyseRunOptions } from '../analyse-runner';
import { type AgentGenerationResult } from '../analyse.types';
import { extractJsonFromLlmResponse } from '../json-extractor';
import { callLlm } from '../llm-runner';
import { loadAnalysePrompt } from '../prompt-loader';

export async function runAgentGeneration(
  opts: AnalyseRunOptions,
  sourceFiles: string[],
  manifest: AnalyseManifest,
  totalCostSoFar: number,
): Promise<{ manifest: AnalyseManifest; totalCost: number }> {
  if (opts.profile === 'starter') {
    return { manifest, totalCost: totalCostSoFar };
  }

  const stale = await stepIsStale(manifest, 'agent-generation', opts.profile, sourceFiles);
  if (!stale) {
    opts.onLog('[analyse:agent-gen] no changes — skipping');
    return { manifest, totalCost: totalCostSoFar };
  }

  opts.onProgress({
    steps: {
      'tech-identification': 'done',
      'convention-mining': 'done',
      'agent-generation': 'running',
    },
    currentStep: 'agent-generation',
    totalCostUSD: totalCostSoFar,
  });

  const systemPrompt = await loadAnalysePrompt(
    'agent-generation',
    opts.workspaceRoot,
    opts.extensionPath,
  );

  const techPath = intelligencePath(opts.workspaceRoot, 'tech-registry.json');
  const convPath = intelligencePath(opts.workspaceRoot, 'conventions.json');

  let userMsg = 'Generate agent rules based on the following artefacts.\n\n';
  try {
    const techContent = await fs.readFile(techPath, 'utf-8');
    userMsg += `=== tech-registry.json ===\n${techContent}\n\n`;
  } catch {
    /* skip */
  }
  try {
    const convContent = await fs.readFile(convPath, 'utf-8');
    userMsg += `=== conventions.json ===\n${convContent}\n\n`;
  } catch {
    /* skip */
  }

  userMsg += 'Now output the complete JSON response with rules and agentHints.';

  const { text, costHint } = await callLlm(
    opts.llmId,
    systemPrompt,
    userMsg,
    opts.workspaceRoot,
    opts.onLog,
  );

  const result = extractJsonFromLlmResponse<AgentGenerationResult>(text, 'agent generation');
  const outDir = path.join(opts.workspaceRoot, INTELLIGENCE_DIR);

  for (const rule of result.rules ?? []) {
    const rulePath = path.join(opts.workspaceRoot, INTELLIGENCE_DIR, rule.filename);
    await fs.mkdir(path.dirname(rulePath), { recursive: true });
    await fs.writeFile(rulePath, rule.content, 'utf-8');
  }

  if (result.agentHints) {
    await fs.writeFile(
      path.join(outDir, 'agent-hints.json'),
      JSON.stringify({ ...result.agentHints, generatedAt: new Date().toISOString() }, null, 2),
      'utf-8',
    );
  }

  opts.onLog(`[analyse:agent-gen] complete — cost ≈ $${costHint.toFixed(4)}`);

  const hashes = await hashFiles(sourceFiles);
  const updatedManifest = markStepComplete(manifest, 'agent-generation', opts.profile, hashes);
  return { manifest: updatedManifest, totalCost: totalCostSoFar + costHint };
}
