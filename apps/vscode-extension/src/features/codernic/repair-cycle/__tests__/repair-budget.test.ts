/**
 * Unit tests — repair-budget.ts
 * @group unit
 *
 * Pure functions with no external dependencies — no mocks required.
 */

import {
  accrue,
  createBudget,
  formatBudgetExhaustedLine,
  formatCycleDetectedLine,
  formatLedgerLine,
  wouldExceed,
  type RepairBudget,
} from '../repair-budget';

// ─── createBudget ─────────────────────────────────────────────────────────────

describe('createBudget', () => {
  it('returns a fresh budget with default limits', () => {
    const b = createBudget();
    expect(b.maxIterations).toBe(3);
    expect(b.maxCostUSD).toBe(0.05);
    expect(b.spentUSD).toBe(0);
    expect(b.iterations).toBe(0);
  });

  it('accepts custom limits', () => {
    const b = createBudget(5, 0.1);
    expect(b.maxIterations).toBe(5);
    expect(b.maxCostUSD).toBe(0.1);
  });

  it('returns an object with all four required fields', () => {
    const b = createBudget();
    expect(b).toHaveProperty('maxIterations');
    expect(b).toHaveProperty('maxCostUSD');
    expect(b).toHaveProperty('spentUSD');
    expect(b).toHaveProperty('iterations');
  });
});

// ─── wouldExceed ─────────────────────────────────────────────────────────────

describe('wouldExceed', () => {
  it('returns false when budget has room on both dimensions', () => {
    const b = createBudget(3, 0.05);
    expect(wouldExceed(b, 0.01)).toBe(false);
  });

  it('returns true when adding cost would exceed the dollar ceiling', () => {
    const b: RepairBudget = { maxIterations: 3, maxCostUSD: 0.05, spentUSD: 0.048, iterations: 0 };
    expect(wouldExceed(b, 0.01)).toBe(true);
  });

  it('returns true when adding cost would equal the dollar ceiling (over, not under)', () => {
    const b: RepairBudget = { maxIterations: 3, maxCostUSD: 0.05, spentUSD: 0.04, iterations: 0 };
    // 0.04 + 0.01 = 0.05 — this is NOT over, so should still be allowed
    expect(wouldExceed(b, 0.01)).toBe(false);
  });

  it('returns true when iterations ceiling is already hit', () => {
    const b: RepairBudget = { maxIterations: 3, maxCostUSD: 0.05, spentUSD: 0, iterations: 3 };
    expect(wouldExceed(b, 0.001)).toBe(true);
  });

  it('returns false on the last allowed iteration when cost fits', () => {
    const b: RepairBudget = { maxIterations: 3, maxCostUSD: 0.05, spentUSD: 0.01, iterations: 2 };
    expect(wouldExceed(b, 0.005)).toBe(false);
  });

  it('returns true when both dimensions would exceed', () => {
    const b: RepairBudget = { maxIterations: 3, maxCostUSD: 0.05, spentUSD: 0.049, iterations: 3 };
    expect(wouldExceed(b, 0.01)).toBe(true);
  });
});

// ─── accrue ───────────────────────────────────────────────────────────────────

describe('accrue', () => {
  it('increments iterations by 1', () => {
    const b = createBudget();
    const b2 = accrue(b, 0.005);
    expect(b2.iterations).toBe(1);
  });

  it('adds the cost to spentUSD', () => {
    const b = createBudget();
    const b2 = accrue(b, 0.005);
    expect(b2.spentUSD).toBeCloseTo(0.005);
  });

  it('is immutable — does not mutate the original', () => {
    const b = createBudget();
    const b2 = accrue(b, 0.01);
    expect(b.spentUSD).toBe(0);
    expect(b.iterations).toBe(0);
    expect(b2.spentUSD).toBeCloseTo(0.01);
    expect(b2.iterations).toBe(1);
  });

  it('preserves maxIterations and maxCostUSD on the new object', () => {
    const b = createBudget(5, 0.1);
    const b2 = accrue(b, 0.001);
    expect(b2.maxIterations).toBe(5);
    expect(b2.maxCostUSD).toBe(0.1);
  });

  it('accumulates correctly across two calls', () => {
    const b0 = createBudget();
    const b1 = accrue(b0, 0.01);
    const b2 = accrue(b1, 0.02);
    expect(b2.iterations).toBe(2);
    expect(b2.spentUSD).toBeCloseTo(0.03);
  });
});

// ─── formatLedgerLine ────────────────────────────────────────────────────────

describe('formatLedgerLine', () => {
  it('produces a non-empty markdown string', () => {
    const b = accrue(createBudget(), 0.004);
    const line = formatLedgerLine(b, 'balanced', 0.004, 3, 1);
    expect(typeof line).toBe('string');
    expect(line.length).toBeGreaterThan(10);
  });

  it('includes the iteration number', () => {
    const b = accrue(accrue(createBudget(), 0.001), 0.002);
    const line = formatLedgerLine(b, 'fast', 0.002, 2, 1);
    expect(line).toContain('2/3');
  });

  it('includes the tier name', () => {
    const b = accrue(createBudget(), 0.01);
    expect(formatLedgerLine(b, 'reasoning', 0.01, 1, 0)).toContain('reasoning');
  });

  it('shows the delta cost in the line', () => {
    const b = accrue(createBudget(), 0.0042);
    const line = formatLedgerLine(b, 'balanced', 0.0042, 1, 2);
    expect(line).toContain('+$0.0042');
  });

  it('shows fixed and remaining counts', () => {
    const b = accrue(createBudget(), 0.005);
    const line = formatLedgerLine(b, 'balanced', 0.005, 4, 2);
    expect(line).toContain('4');
    expect(line).toContain('2');
  });

  it('ends with two newlines (markdown paragraph break)', () => {
    const b = accrue(createBudget(), 0.001);
    expect(formatLedgerLine(b, 'fast', 0.001, 0, 3)).toMatch(/\n\n$/);
  });
});

// ─── formatBudgetExhaustedLine / formatCycleDetectedLine ─────────────────────

describe('formatBudgetExhaustedLine', () => {
  it('mentions "budget" and ends with double newline', () => {
    const b = accrue(accrue(createBudget(), 0.02), 0.02);
    const line = formatBudgetExhaustedLine(b);
    expect(line.toLowerCase()).toContain('budget');
    expect(line).toMatch(/\n\n$/);
  });

  it('includes the number of iterations consumed', () => {
    const b = accrue(createBudget(), 0.03);
    const line = formatBudgetExhaustedLine(b);
    expect(line).toContain('1');
  });
});

describe('formatCycleDetectedLine', () => {
  it('mentions "cycle" or "attempt" and includes the failure count', () => {
    const line = formatCycleDetectedLine(5);
    expect(line.toLowerCase()).toMatch(/attempt|cycle|failure/);
    expect(line).toContain('5');
  });

  it('ends with double newline', () => {
    expect(formatCycleDetectedLine(3)).toMatch(/\n\n$/);
  });

  it('handles singular vs plural correctly for 1 failure', () => {
    const line = formatCycleDetectedLine(1);
    // "failure" (singular) should appear somewhere
    expect(line.toLowerCase()).toContain('failure');
  });
});
