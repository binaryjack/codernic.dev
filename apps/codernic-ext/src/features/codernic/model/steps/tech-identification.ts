import * as fs from 'fs/promises';
import * as path from 'path';
import {
  hashFiles,
  markStepComplete,
  stepIsStale,
  type AnalyseManifest,
} from '../analyse-manifest';
import { getIntelligenceWritePath, type AnalyseRunOptions } from '../analyse-runner';
import { type TechRegistry } from '../analyse.types';
import { extractJsonFromLlmResponse } from '../json-extractor';
import { callLlm } from '../llm-runner';
import { loadAnalysePrompt } from '../prompt-loader';

export async function runTechIdentification(
  opts: AnalyseRunOptions,
  sourceFiles: string[],
  manifest: AnalyseManifest,
): Promise<AnalyseManifest> {
  const stale = await stepIsStale(manifest, 'tech-identification', opts.profile, sourceFiles);
  if (!stale) {
    opts.onLog('[analyse:tech-id] no changes — skipping');
    return manifest;
  }

  opts.onProgress({
    steps: {
      'tech-identification': 'running',
      'convention-mining': 'pending',
      'agent-generation': 'pending',
    },
    currentStep: 'tech-identification',
    totalCostUSD: 0,
  });

  const systemPrompt = await loadAnalysePrompt(
    'tech-identification',
    opts.workspaceRoot,
    opts.extensionPath,
  );

  const fileContents: string[] = [];
  for (const fp of sourceFiles.slice(0, 30)) {
    try {
      const rel = path.relative(opts.workspaceRoot, fp);
      const content = await fs.readFile(fp, 'utf-8');
      fileContents.push(`=== ${rel} ===\n${content.slice(0, 2000)}`);
    } catch {
      continue;
    }
  }

  const userMsg = `Here are the configuration files from the project:\n\n${fileContents.join('\n\n')}\n\nGenerate the tech-registry JSON now.`;
  const { text, costHint } = await callLlm(
    opts.llmId,
    systemPrompt,
    userMsg,
    opts.workspaceRoot,
    opts.onLog,
  );

  const techRegistry = extractJsonFromLlmResponse<TechRegistry>(text, 'tech identification');
  techRegistry.generatedAt = new Date().toISOString();

  const outDir = getIntelligenceWritePath(opts.workspaceRoot, "");
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, 'tech-registry.json'),
    JSON.stringify(techRegistry, null, 2),
    'utf-8',
  );

  opts.onLog(`[analyse:tech-id] complete — cost ≈ $${costHint.toFixed(4)}`);

  const hashes = await hashFiles(sourceFiles);
  return markStepComplete(manifest, 'tech-identification', opts.profile, hashes);
}
