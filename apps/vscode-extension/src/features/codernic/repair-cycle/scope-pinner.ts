/**
 * @file scope-pinner.ts
 * @description Builds and enforces the allowed-modification scope for each
 * repair cycle iteration.
 *
 * The allowed scope is the union of:
 *   1. Files present in the MCP code-search-context breadcrumb (files the LLM
 *      used as grounding during the original AGENT mode request)
 *   2. Files mentioned in the failing test assertions (error.file fields)
 *   3. Files already modified by the DAG execution (DagExecutionResult.modifiedFiles)
 *
 * Any file outside this set is blocked — the LLM cannot modify it without
 * explicit user approval.  This prevents the "fix one test, break five others"
 * failure mode common in brute-force loops.
 *
 * Pure function — reuses `parseContextBreadcrumb` from the existing breadcrumb
 * module (no extra dependencies).
 */

import { parseContextBreadcrumb } from '../context-breadcrumb/breadcrumb';
import type { CompressedError } from './error-compressor';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Builds the allowed modification scope as a `Set<string>` of relative file
 * paths.
 *
 * @param codeContext      Raw MCP code-search-context text (breadcrumb source)
 * @param errors           Compressed errors from the most recent test run
 * @param dagModifiedFiles Files reported as modified by DagExecutionResult
 */
export function buildAllowedScope(
  codeContext: string,
  errors: CompressedError[],
  dagModifiedFiles: readonly string[],
): Set<string> {
  const scope = new Set<string>();

  // 1. Breadcrumb files (grounding context used by the LLM)
  for (const p of parseContextBreadcrumb(codeContext)) {
    if (p) scope.add(normalise(p));
  }

  // 2. Files directly mentioned in failing assertions
  for (const err of errors) {
    if (err.file) scope.add(normalise(err.file));
  }

  // 3. Files the DAG execution already touched
  for (const f of dagModifiedFiles) {
    if (f) scope.add(normalise(f));
  }

  return scope;
}

/**
 * Splits a list of proposed file paths into those within scope (allowed) and
 * those outside scope (blocked).
 *
 * @param proposedFiles  File paths the LLM patch intends to modify
 * @param allowedScope   Set produced by `buildAllowedScope`
 */
export function validatePatch(
  proposedFiles: readonly string[],
  allowedScope: Set<string>,
): { allowed: string[]; blocked: string[] } {
  const allowed: string[] = [];
  const blocked: string[] = [];

  for (const f of proposedFiles) {
    if (allowedScope.has(normalise(f))) {
      allowed.push(f);
    } else {
      blocked.push(f);
    }
  }

  return { allowed, blocked };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Normalises a file path for consistent comparison:
 * - Converts backslashes to forward slashes (Windows compatibility)
 * - Strips a leading "./" if present
 */
function normalise(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}
