/**
 * @file repair-budget.ts
 * @description Immutable cost ledger for the Precision Repair Cycle.
 *
 * All functions are pure — they return new objects rather than mutating in
 * place.  This makes them trivially testable and prevents accidental shared
 * state across concurrent repair cycles.
 *
 * Budget defaults:
 *   maxIterations = 3   (one attempt per model tier)
 *   maxCostUSD    = 0.05
 */

import type { ModelTier } from '../model-router/types/model-router.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepairBudget {
  /** Maximum number of LLM repair attempts. */
  readonly maxIterations: number;
  /** Absolute cost ceiling in USD. */
  readonly maxCostUSD: number;
  /** Cumulative USD spent so far. */
  readonly spentUSD: number;
  /** Number of iterations consumed so far. */
  readonly iterations: number;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a fresh budget with sensible defaults.
 */
export function createBudget(maxIterations: number = 3, maxCostUSD: number = 0.05): RepairBudget {
  return { maxIterations, maxCostUSD, spentUSD: 0, iterations: 0 };
}

/**
 * Returns `true` if adding `estimatedCost` would exceed either the iteration
 * ceiling or the dollar ceiling.
 */
export function wouldExceed(budget: RepairBudget, estimatedCost: number): boolean {
  if (budget.iterations >= budget.maxIterations) return true;
  if (budget.spentUSD + estimatedCost > budget.maxCostUSD) return true;
  return false;
}

/**
 * Returns a new budget with one iteration consumed and the given cost accrued.
 * Does NOT enforce limits — call `wouldExceed` first.
 */
export function accrue(budget: RepairBudget, costUSD: number): RepairBudget {
  return {
    ...budget,
    spentUSD: budget.spentUSD + costUSD,
    iterations: budget.iterations + 1,
  };
}

/**
 * Formats a one-line stream emission showing the current repair cycle state.
 *
 * Example:
 *   🔁 *Iteration 2/3  ·  +$0.004  ·  ✅ 4 fixed  ·  ❌ 2 remaining  ·  budget: $0.012/$0.05*
 */
export function formatLedgerLine(
  budget: RepairBudget,
  tier: ModelTier,
  lastIterationCost: number,
  fixedCount: number,
  remainingCount: number,
): string {
  const iterNum = budget.iterations;
  const iterMax = budget.maxIterations;
  const spent = budget.spentUSD.toFixed(4);
  const ceiling = budget.maxCostUSD.toFixed(2);
  const delta = `+$${lastIterationCost.toFixed(4)}`;
  const tierIcon: Record<ModelTier, string> = { fast: '⚡', balanced: '⚖️', reasoning: '🧠' };

  return `🔁 *Iteration ${iterNum}/${iterMax} · ${tier} ${tierIcon[tier]} · ${delta} · ✅ ${fixedCount} fixed · ❌ ${remainingCount} remaining · budget: $${spent}/$${ceiling}*\n\n`;
}

/**
 * Formats the terminal stop line when the budget ceiling is hit before
 * all tests pass.
 */
export function formatBudgetExhaustedLine(budget: RepairBudget): string {
  return `🛑 *Repair cycle stopped — budget ceiling reached (${budget.iterations} iteration${budget.iterations !== 1 ? 's' : ''}, $${budget.spentUSD.toFixed(4)} spent). Review failing tests manually.*\n\n`;
}

/**
 * Formats the terminal stop line when the same failing tests recur across
 * two consecutive iterations (cycling detected).
 */
export function formatCycleDetectedLine(failingCount: number): string {
  return `🛑 *Repair cycle stopped — same ${failingCount} failure${failingCount !== 1 ? 's' : ''} after 2 attempts. This likely requires an architectural fix — review manually.*\n\n`;
}
