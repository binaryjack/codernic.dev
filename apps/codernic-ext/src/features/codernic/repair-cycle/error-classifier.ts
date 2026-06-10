/**
 * @file error-classifier.ts
 * @description Classifies a set of compressed errors into the minimum model tier
 * required to address them.
 *
 * Tier escalation rule: the *worst* error in the set determines the tier.
 * This ensures we never under-invest on a hard problem just because the batch
 * also contains trivial errors.
 *
 * Tier order (ascending cost):  fast < balanced < reasoning
 *
 * Pure function — no imports, no side-effects.
 */

import type { ModelTier } from '../model-router/types/model-router.types';
import type { CompressedError, ErrorClass } from './error-compressor';

// ─── Tier ranking ─────────────────────────────────────────────────────────────

/** Numeric rank so we can take the max across a set of errors. */
const TIER_RANK: Record<ModelTier, number> = {
  fast: 1,
  balanced: 2,
  reasoning: 3,
};

const RANK_TO_TIER: Record<number, ModelTier> = {
  1: 'fast',
  2: 'balanced',
  3: 'reasoning',
};

// ─── Classification table ─────────────────────────────────────────────────────

const ERROR_CLASS_TIER: Record<ErrorClass, ModelTier> = {
  import: 'fast',
  type: 'fast',
  syntax: 'fast',
  assertion: 'balanced',
  architectural: 'reasoning',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the model tier required to address the given set of errors.
 *
 * - Empty array → `'balanced'` (default — safe middle ground when unknown)
 * - Single error → tier for that error's class
 * - Mixed set → highest tier in the set (worst error wins)
 */
export function classifyErrors(errors: CompressedError[]): ModelTier {
  if (errors.length === 0) return 'balanced';

  let maxRank = 0;

  for (const error of errors) {
    const tier = ERROR_CLASS_TIER[error.errorClass] ?? 'balanced';
    const rank = TIER_RANK[tier];
    if (rank > maxRank) maxRank = rank;
  }

  return RANK_TO_TIER[maxRank] ?? 'balanced';
}

/**
 * Returns the effective tier for a given repair iteration.
 *
 * The effective tier is the *maximum* of the loop position and the classified
 * tier — so we never downgrade below what the error analysis demands, but we
 * do escalate when the loop has exhausted lower tiers.
 *
 * @param loopTier         - Model tier for the current loop iteration
 * @param classifiedTier   - Tier derived from classifyErrors()
 */
export function effectiveTier(loopTier: ModelTier, classifiedTier: ModelTier): ModelTier {
  const rank = Math.max(TIER_RANK[loopTier], TIER_RANK[classifiedTier]);
  return RANK_TO_TIER[rank] ?? 'balanced';
}
