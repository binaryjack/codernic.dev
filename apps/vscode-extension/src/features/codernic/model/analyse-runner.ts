/** analyse-runner.ts — Orchestrates the 3-step codebase intelligence extraction pipeline. */

import * as path from 'path';
import * as vscode from 'vscode';
import {
  type AnalyseProfile,
  type AnalyseStep,
  loadManifest,
  saveManifest,
} from './analyse-manifest';
import { runAgentGeneration } from './steps/agent-generation';
import { runConventionMining } from './steps/convention-mining';
import { runTechIdentification } from './steps/tech-identification';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalyseStepStatus = 'pending' | 'skipped' | 'running' | 'done' | 'error';

export type AnalyseProgress = {
  steps: Record<AnalyseStep, AnalyseStepStatus>;
  currentStep: AnalyseStep | null;
  totalCostUSD: number;
  errorMessage?: string;
};

export type AnalyseRunOptions = {
  profile: AnalyseProfile;
  llmId: string;
  workspaceRoot: string;
  extensionPath: string;
  onProgress: (p: AnalyseProgress) => void;
  onLog: (line: string) => void;
};

// ─── Intelligence output paths ────────────────────────────────────────────────

export const INTELLIGENCE_DIR = path.join('.agencee', 'config', 'intelligence');

export function intelligencePath(workspaceRoot: string, file: string): string {
  return path.join(workspaceRoot, INTELLIGENCE_DIR, file);
}

// ─── Source file discovery ────────────────────────────────────────────────────

const SOURCE_GLOBS = [
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'tsconfig.json',
  '.eslintrc*',
  '.prettierrc*',
  '.editorconfig',
  'Dockerfile*',
  'docker-compose*.yml',
  '.github/workflows/*.yml',
];

async function discoverSourceFiles(_workspaceRoot: string): Promise<string[]> {
  const found: string[] = [];
  const uris = await vscode.workspace.findFiles(
    `{${SOURCE_GLOBS.join(',')}}`,
    '{node_modules/**,dist/**,build/**,.git/**}',
    200,
  );
  for (const uri of uris) {
    found.push(uri.fsPath);
  }
  return found;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function runAnalysis(opts: AnalyseRunOptions): Promise<void> {
  opts.onLog(`[analyse] starting profile=${opts.profile}`);

  const sourceFiles = await discoverSourceFiles(opts.workspaceRoot);
  opts.onLog(`[analyse] discovered ${sourceFiles.length} source files`);

  let manifest = await loadManifest(opts.workspaceRoot);
  manifest = { ...manifest, profile: opts.profile };

  let totalCost = 0;

  // Step 1
  manifest = await runTechIdentification(opts, sourceFiles, manifest);
  await saveManifest(opts.workspaceRoot, manifest);

  // Step 2
  const step2 = await runConventionMining(opts, sourceFiles, manifest, totalCost);
  manifest = step2.manifest;
  totalCost = step2.totalCost;
  await saveManifest(opts.workspaceRoot, manifest);

  // Step 3
  const step3 = await runAgentGeneration(opts, sourceFiles, manifest, totalCost);
  manifest = step3.manifest;
  totalCost = step3.totalCost;
  await saveManifest(opts.workspaceRoot, manifest);

  try {
    await vscode.commands.executeCommand('ai-agencee.agents.refresh');
  } catch {
    /* skip */
  }

  opts.onProgress({
    steps: {
      'tech-identification': 'done',
      'convention-mining': opts.profile === 'starter' ? 'skipped' : 'done',
      'agent-generation': opts.profile === 'starter' ? 'skipped' : 'done',
    },
    currentStep: null,
    totalCostUSD: totalCost,
  });

  opts.onLog(`[analyse] complete — total cost ≈ $${totalCost.toFixed(4)}`);
}
