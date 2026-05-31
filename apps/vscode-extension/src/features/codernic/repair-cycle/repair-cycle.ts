/**
 * @file repair-cycle.ts
 * @description Precision Repair Cycle — bounded test-feedback loop for AGENT mode.
 *
 * After a DAG execution, detected test failures are compressed, classified,
 * and repaired by an LLM within a hard cost/iteration budget.
 *
 * Design goals:
 *   - Bounded by design  — max 3 iterations, max $0.05 per cycle
 *   - Cost-transparent   — ledger line emitted after each iteration
 *   - Scope-pinned       — only files in the grounding context may be modified
 *   - Cycle-safe         — identical failure fingerprint on two consecutive
 *                          iterations triggers an immediate architectural exit
 *
 * Always runs Pirsig post-flight on exit (success or abort), mirroring the
 * contract of the AGENT mode `finally` block it replaces.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { executeWorkspaceTool } from '../../../shared/api/workspace-tools';
import type { McpClientInstance } from '../../../shared/mcp';
import type { DagExecutionResult } from '../agent-mode/executor';
import type { ModelTier } from '../model-router/types/model-router.types';
import { runPirsigPostflight } from '../pirsig/pirsig-postflight';
import type { PirsigBaseline } from '../pirsig/pirsig-preflight';
import { classifyErrors, effectiveTier } from './error-classifier';
import { compressErrors, type CompressedError } from './error-compressor';
import {
  accrue,
  createBudget,
  formatBudgetExhaustedLine,
  formatCycleDetectedLine,
  formatLedgerLine,
  wouldExceed,
} from './repair-budget';
import { buildAllowedScope, validatePatch } from './scope-pinner';
import { detectTestCommand } from './test-runner-detector';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface RepairCycleOptions {
  /** MCP client (may be null if not connected). */
  readonly mcpClient: McpClientInstance | null;
  /** Absolute path to the workspace root. */
  readonly workspaceRoot: string;
  /** Chat response stream for user-visible progress. */
  readonly stream: vscode.ChatResponseStream;
  /** Cancellation token from the chat request. */
  readonly token: vscode.CancellationToken;
  /** Pirsig quality baseline captured before DAG execution, or null. */
  readonly baseline: PirsigBaseline | null;
  /** Code-search-context text gathered pre-execution (breadcrumb source). */
  readonly codeContext: string;
  /** Result of the preceding executeDag call (used for modifiedFiles scope). */
  readonly dagResult: DagExecutionResult;
  /** The language model from the originating chat request. */
  readonly requestModel: vscode.LanguageModelChat;
}

// ─── Tier configuration ───────────────────────────────────────────────────────

/** Loop tiers in ascending capability order. */
const REPAIR_TIERS: ModelTier[] = ['fast', 'balanced', 'reasoning'];

/** VS Code LM API model family for each tier. */
const TIER_FAMILY: Record<ModelTier, string> = {
  fast: 'gpt-4o-mini',
  balanced: 'gpt-4o',
  reasoning: 'gpt-4o', // Escalate prompt detail; o1 availability varies
};

/** Rough cost estimation rates (USD per 1 000 tokens). */
const COST_PER_1K: Record<ModelTier, { input: number; output: number }> = {
  fast: { input: 0.00015, output: 0.0006 }, // gpt-4o-mini
  balanced: { input: 0.0025, output: 0.01 }, // gpt-4o
  reasoning: { input: 0.01, output: 0.03 }, // o1 proxy
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Runs the Precision Repair Cycle.
 *
 * Always calls `runPirsigPostflight` before returning, regardless of outcome.
 */
export async function runRepairCycle(opts: RepairCycleOptions): Promise<void> {
  const {
    mcpClient,
    workspaceRoot,
    stream,
    token,
    baseline,
    codeContext,
    dagResult,
    requestModel,
  } = opts;

  // ─── Initial test run ───────────────────────────────────────────────────────
  const testCommand = await detectTestCommand(workspaceRoot);
  stream.markdown(`🧪 *Repair cycle: running \`${testCommand}\`…*\n\n`);

  let currentOutput = await executeWorkspaceTool(
    'run_terminal',
    { command: testCommand },
    workspaceRoot,
  );

  if (currentOutput.startsWith('✅')) {
    stream.markdown('✅ *All tests pass — no repair needed.*\n\n');
    await runPirsigPostflight(mcpClient, workspaceRoot, stream, baseline ?? undefined);
    return;
  }

  // ─── Repair loop ────────────────────────────────────────────────────────────
  let budget = createBudget();
  const seenFingerprints = new Set<string>();

  for (const loopTier of REPAIR_TIERS) {
    if (token.isCancellationRequested) break;

    const errors = compressErrors(currentOutput);
    if (errors.length === 0) break; // Unparseable success — treat as clean

    // Cycle detection
    const fingerprint = errors
      .map((e) => `${e.testName}||${e.file}:${e.line}||${e.assertion}`)
      .sort()
      .join('\x1F');

    if (seenFingerprints.has(fingerprint)) {
      stream.markdown(formatCycleDetectedLine(errors.length));
      await runPirsigPostflight(mcpClient, workspaceRoot, stream, baseline ?? undefined);
      return;
    }
    seenFingerprints.add(fingerprint);

    // Tier + budget gate
    const classified = classifyErrors(errors);
    const eTier = effectiveTier(loopTier, classified);
    const allowedScope = buildAllowedScope(codeContext, errors, dagResult.modifiedFiles ?? []);
    const estimatedCost = roughCostEstimate(errors, eTier, allowedScope.size);

    if (wouldExceed(budget, estimatedCost)) {
      stream.markdown(formatBudgetExhaustedLine(budget));
      await runPirsigPostflight(mcpClient, workspaceRoot, stream, baseline ?? undefined);
      return;
    }

    const preCount = errors.length;

    // Apply LLM patch
    await callLlmForPatch(errors, allowedScope, eTier, requestModel, workspaceRoot, token, stream);

    // Post-patch test run
    const postOutput = await executeWorkspaceTool(
      'run_terminal',
      { command: testCommand },
      workspaceRoot,
    );
    const errorsAfter = postOutput.startsWith('✅') ? [] : compressErrors(postOutput);
    const fixedCount = Math.max(0, preCount - errorsAfter.length);

    budget = accrue(budget, estimatedCost);
    stream.markdown(formatLedgerLine(budget, eTier, estimatedCost, fixedCount, errorsAfter.length));

    currentOutput = postOutput;
    if (postOutput.startsWith('✅')) break;
  }

  // ─── Exit gate ──────────────────────────────────────────────────────────────
  await runPirsigPostflight(mcpClient, workspaceRoot, stream, baseline ?? undefined);

  if (currentOutput.startsWith('✅')) {
    stream.markdown('✅ *Repair cycle complete — all tests pass.*\n\n');
  } else {
    stream.markdown(
      `⚠️ *Repair cycle exhausted (${budget.iterations} iteration${budget.iterations !== 1 ? 's' : ''}, $${budget.spentUSD.toFixed(4)} spent) — review failing tests manually.*\n\n`,
    );
  }
}

// ─── LLM patch caller ────────────────────────────────────────────────────────

/**
 * Asks the LLM to fix the failing tests and applies the returned patches.
 *
 * The LLM receives ONLY compressed errors + the contents of allowed-scope
 * files — no full codeContext dump.  This keeps the prompt small and
 * prevents accidental modifications outside the affected module boundary.
 *
 * Expected response format:
 * ```json
 * { "files": [{ "path": "...", "content": "..." }] }
 * ```
 * Wrapped in a markdown fence or raw JSON — both are accepted.
 */
async function callLlmForPatch(
  errors: CompressedError[],
  allowedScope: Set<string>,
  tier: ModelTier,
  requestModel: vscode.LanguageModelChat,
  workspaceRoot: string,
  token: vscode.CancellationToken,
  stream: vscode.ChatResponseStream,
): Promise<void> {
  // Select model by tier when possible, fall back to the request model
  let model: vscode.LanguageModelChat = requestModel;
  try {
    const candidates = await vscode.lm.selectChatModels({ family: TIER_FAMILY[tier] });
    if (candidates.length > 0) model = candidates[0];
  } catch {
    // Model selection unavailable — use request model
  }

  // Read allowed-scope files that exist in the workspace
  const fileContents: Array<{ filePath: string; content: string }> = [];
  for (const scopedPath of allowedScope) {
    const raw = await executeWorkspaceTool('read_file', { path: scopedPath }, workspaceRoot);
    if (!raw.startsWith('Error:')) {
      fileContents.push({ filePath: scopedPath, content: raw });
    }
  }

  const errorBlock = errors
    .map((e) => `- [${e.errorClass}] ${e.testName || e.file + ':' + e.line}\n  ${e.assertion}`)
    .join('\n');

  const fileBlock = fileContents.map((f) => `### ${f.filePath}\n${f.content}`).join('\n\n');

  const reasoningNote =
    tier === 'reasoning' ? 'Think step-by-step about the root cause before writing the fix. ' : '';

  const systemPrompt = [
    'You are a precise code repair agent. Fix ONLY the failing tests listed below.',
    reasoningNote,
    'Return a single JSON object with this exact shape:',
    '{"files":[{"path":"<path relative to workspace root>","content":"<complete file content>"}]}',
    'Rules:',
    '- Only emit files from the ALLOWED SCOPE section.',
    '- Emit the entire file content, not a diff or partial snippet.',
    '- Do not add explanatory text outside the JSON.',
    '- Wrap the JSON in a ```json ... ``` fence.',
  ].join('\n');

  const userPrompt = [
    `## Failing tests (${errors.length})`,
    errorBlock,
    '',
    `## Allowed scope (${allowedScope.size} file${allowedScope.size !== 1 ? 's' : ''})`,
    [...allowedScope].join('\n'),
    '',
    fileBlock.length > 0
      ? `## File contents\n\n${fileBlock}`
      : '*(no files in scope could be read)*',
  ].join('\n');

  const messages: vscode.LanguageModelChatMessage[] = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userPrompt),
  ];

  let rawResponse = '';
  try {
    const response = await model.sendRequest(messages, {}, token);
    for await (const chunk of response.text) {
      rawResponse += chunk;
    }
  } catch (err) {
    stream.markdown(
      `⚠️ *Repair: LLM request failed (${err instanceof Error ? err.message : String(err)}) — skipping iteration.*\n\n`,
    );
    return;
  }

  // Extract JSON from the response
  const parsed = extractPatchJson(rawResponse);
  if (!parsed) {
    stream.markdown('⚠️ *Repair: LLM returned an unparseable response — skipping iteration.*\n\n');
    return;
  }

  // Apply patches within scope
  const proposedPaths = parsed.files.map((f) => f.path);
  const { allowed, blocked } = validatePatch(proposedPaths, allowedScope);

  for (const file of parsed.files) {
    const normFile = file.path.replace(/\\/g, '/').replace(/^\.\//, '');
    const normAllowed = allowed.map((a) => a.replace(/\\/g, '/').replace(/^\.\//, ''));

    if (!normAllowed.includes(normFile)) continue;

    const absPath = path.resolve(workspaceRoot, file.path);
    if (absPath !== workspaceRoot && !absPath.startsWith(workspaceRoot + path.sep)) {
      // Security: reject traversal
      stream.markdown(
        `⚠️ *Repair: blocked write to \`${file.path}\` (path traversal detected).*\n\n`,
      );
      continue;
    }

    await executeWorkspaceTool(
      'write_file',
      { path: file.path, content: file.content },
      workspaceRoot,
    );
  }

  if (blocked.length > 0) {
    stream.markdown(
      `ℹ️ *Repair: ${blocked.length} file${blocked.length !== 1 ? 's' : ''} outside scope were not modified: ${blocked.slice(0, 5).join(', ')}${blocked.length > 5 ? '…' : ''}*\n\n`,
    );
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface PatchJson {
  files: Array<{ path: string; content: string }>;
}

/**
 * Extracts a `{ files: [...] }` JSON object from a raw LLM response that may
 * be wrapped in a markdown fence or contain preamble text.
 */
function extractPatchJson(raw: string): PatchJson | null {
  // 1. Try a ```json ... ``` fence
  const fenceMatch = raw.match(/```json\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  // 2. Try extracting the outermost JSON object if there's preamble text
  const jsonMatch = candidate.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1] : candidate;

  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'files' in parsed &&
      Array.isArray((parsed as PatchJson).files) &&
      (parsed as PatchJson).files.every(
        (f) => typeof f === 'object' && typeof f.path === 'string' && typeof f.content === 'string',
      )
    ) {
      return parsed as PatchJson;
    }
  } catch {
    // Fall through
  }

  return null;
}

/**
 * Conservative cost estimate for a single repair iteration.
 *
 * Input tokens  ≈ 500 (system) + errors × 100 + scopeFiles × 1 500
 * Output tokens ≈ 200 (overhead) + errors × 300 (fix per error)
 */
function roughCostEstimate(errors: CompressedError[], tier: ModelTier, scopeSize: number): number {
  const inputTokens = 500 + errors.length * 100 + scopeSize * 1_500;
  const outputTokens = 200 + errors.length * 300;
  const rates = COST_PER_1K[tier];
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000;
}
