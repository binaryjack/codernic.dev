/**
 * Unit tests — error-classifier.ts
 * @group unit
 *
 * Pure functions with no external dependencies — no mocks required.
 */

import { classifyErrors, effectiveTier } from '../error-classifier';
import type { CompressedError } from '../error-compressor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(errorClass: CompressedError['errorClass']): CompressedError {
  return {
    testName: 'test suite › test name',
    file: 'src/foo.ts',
    line: 1,
    assertion: 'Expected: true  Received: false',
    errorClass,
  };
}

// ─── classifyErrors ───────────────────────────────────────────────────────────

describe('classifyErrors', () => {
  it('returns "balanced" for an empty array (safe default)', () => {
    expect(classifyErrors([])).toBe('balanced');
  });

  it('returns "fast" for a single import error', () => {
    expect(classifyErrors([makeError('import')])).toBe('fast');
  });

  it('returns "fast" for a single type error', () => {
    expect(classifyErrors([makeError('type')])).toBe('fast');
  });

  it('returns "fast" for a single syntax error', () => {
    expect(classifyErrors([makeError('syntax')])).toBe('fast');
  });

  it('returns "balanced" for a single assertion error', () => {
    expect(classifyErrors([makeError('assertion')])).toBe('balanced');
  });

  it('returns "reasoning" for a single architectural error', () => {
    expect(classifyErrors([makeError('architectural')])).toBe('reasoning');
  });

  // Worst-error-wins rule
  it('escalates to "balanced" when mix contains one assertion error', () => {
    const errors: CompressedError[] = [
      makeError('import'),
      makeError('syntax'),
      makeError('assertion'),
    ];
    expect(classifyErrors(errors)).toBe('balanced');
  });

  it('escalates to "reasoning" when mix contains one architectural error', () => {
    const errors: CompressedError[] = [
      makeError('import'),
      makeError('type'),
      makeError('assertion'),
      makeError('architectural'),
    ];
    expect(classifyErrors(errors)).toBe('reasoning');
  });

  it('returns "fast" for a homogeneous set of syntax errors', () => {
    const errors: CompressedError[] = [
      makeError('syntax'),
      makeError('syntax'),
      makeError('syntax'),
    ];
    expect(classifyErrors(errors)).toBe('fast');
  });

  it('returns "reasoning" for a homogeneous set of architectural errors', () => {
    const errors: CompressedError[] = [makeError('architectural'), makeError('architectural')];
    expect(classifyErrors(errors)).toBe('reasoning');
  });

  it('is deterministic across multiple calls with the same input', () => {
    const errors = [makeError('assertion'), makeError('import')];
    expect(classifyErrors(errors)).toBe(classifyErrors(errors));
  });
});

// ─── effectiveTier ────────────────────────────────────────────────────────────

describe('effectiveTier', () => {
  it('returns the loop tier when loop rank >= classified rank', () => {
    // loop: reasoning (3), classified: fast (1) → reasoning
    expect(effectiveTier('reasoning', 'fast')).toBe('reasoning');
  });

  it('escalates to classified tier when classified > loop tier', () => {
    // loop: fast (1), classified: reasoning (3) → reasoning
    expect(effectiveTier('fast', 'reasoning')).toBe('reasoning');
  });

  it('returns the same tier when both are equal', () => {
    expect(effectiveTier('balanced', 'balanced')).toBe('balanced');
    expect(effectiveTier('fast', 'fast')).toBe('fast');
    expect(effectiveTier('reasoning', 'reasoning')).toBe('reasoning');
  });

  it('never returns a tier lower than the loop tier', () => {
    expect(effectiveTier('balanced', 'fast')).toBe('balanced');
    expect(effectiveTier('reasoning', 'balanced')).toBe('reasoning');
  });

  it('never returns a tier lower than the classified tier', () => {
    expect(effectiveTier('fast', 'balanced')).toBe('balanced');
    expect(effectiveTier('fast', 'reasoning')).toBe('reasoning');
    expect(effectiveTier('balanced', 'reasoning')).toBe('reasoning');
  });

  it('covers all 9 tier×tier combinations without throwing', () => {
    const tiers = ['fast', 'balanced', 'reasoning'] as const;
    for (const a of tiers) {
      for (const b of tiers) {
        expect(() => effectiveTier(a, b)).not.toThrow();
      }
    }
  });
});
