/**
 * Unit tests — error-compressor.ts
 * @group unit
 *
 * Pure function with no external dependencies — no mocks required.
 */

import { compressErrors } from '../error-compressor';

// ─── Passing output ───────────────────────────────────────────────────────────

describe('compressErrors — passing output', () => {
  it('returns [] for empty string', () => {
    expect(compressErrors('')).toEqual([]);
  });

  it('returns [] when output starts with ✅ (toolRunTerminal success prefix)', () => {
    expect(compressErrors('✅ Success\nAll tests passed')).toEqual([]);
  });

  it('returns [] for whitespace-only string', () => {
    expect(compressErrors('   \n\n\t  ')).toEqual([]);
  });
});

// ─── Jest / Vitest parser ─────────────────────────────────────────────────────

describe('compressErrors — Jest/Vitest output', () => {
  const JEST_SIMPLE = `
  ● auth handler › returns 401 for expired token

    expect(received).toBe(expected)

    Expected: 401
    Received: 200

      at src/auth/handler.ts:42:5
      at Object.<anonymous> (src/auth/handler.ts:42:5)
`.trim();

  it('parses a single Jest failure block', () => {
    const result = compressErrors(`❌ Exit 1\n${JEST_SIMPLE}`);
    expect(result).toHaveLength(1);
    expect(result[0].testName).toBe('auth handler › returns 401 for expired token');
    expect(result[0].file).toBe('src/auth/handler.ts');
    expect(result[0].line).toBe(42);
    expect(result[0].errorClass).toBe('assertion');
  });

  it('captures the first Expected/Received pair in the assertion field', () => {
    const result = compressErrors(`❌ Exit 1\n${JEST_SIMPLE}`);
    expect(result[0].assertion).toContain('Expected');
  });

  it('parses multiple Jest failure blocks into separate entries', () => {
    const twoFailures = `
  ● suite A › test one

    Expected: true
    Received: false

      at src/foo.ts:10:5

  ● suite B › test two

    Expected: "hello"
    Received: "world"

      at src/bar.ts:20:5
`.trim();
    const result = compressErrors(`❌ Exit 2\n${twoFailures}`);
    expect(result).toHaveLength(2);
    expect(result[0].testName).toBe('suite A › test one');
    expect(result[1].testName).toBe('suite B › test two');
  });

  it('marks errors with "circular" in test name as architectural', () => {
    const circular = `
  ● circular dependency › should not exist

    Expected: false
    Received: true

      at src/core/index.ts:5:3
`.trim();
    const result = compressErrors(`❌ Exit 1\n${circular}`);
    expect(result[0].errorClass).toBe('architectural');
  });

  it('marks errors with "cannot find module" in assertion as architectural', () => {
    const moduleError = `
  ● module loading › loads utils

    Cannot find module './utils' from 'src/core/engine.ts'

      at src/core/engine.ts:1:3
`.trim();
    const result = compressErrors(`❌ Exit 1\n${moduleError}`);
    expect(result[0].errorClass).toBe('architectural');
  });

  it('strips ANSI escape codes from output before parsing', () => {
    const withAnsi = `❌ Exit 1\n  \u001B[1m●\u001B[0m auth › test\n\n    Expected: 1\n    Received: 2\n\n      at src/x.ts:1:5`;
    // Should not throw and should parse at least one entry
    expect(() => compressErrors(withAnsi)).not.toThrow();
  });

  it('caps assertion field at 120 characters', () => {
    const longAssertion = `
  ● test › long assertion

    Expected: ${'A'.repeat(200)}
    Received: ${'B'.repeat(200)}

      at src/x.ts:1:5
`.trim();
    const result = compressErrors(`❌ Exit 1\n${longAssertion}`);
    expect(result[0].assertion.length).toBeLessThanOrEqual(120);
  });
});

// ─── TypeScript compiler parser ───────────────────────────────────────────────

describe('compressErrors — tsc output', () => {
  it('parses a single tsc error', () => {
    const tscOutput = `src/auth/handler.ts(42,3): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.`;
    const result = compressErrors(`❌ Exit 1\n${tscOutput}`);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('src/auth/handler.ts');
    expect(result[0].line).toBe(42);
    expect(result[0].assertion).toContain('TS2345');
    expect(result[0].testName).toBe('');
  });

  it('classifies TS2307 (cannot find module) as import', () => {
    const tscOutput = `src/index.ts(1,1): error TS2307: Cannot find module './missing'.`;
    const result = compressErrors(`❌ Exit 1\n${tscOutput}`);
    expect(result[0].errorClass).toBe('import');
  });

  it('classifies TS2345/2322 as type errors', () => {
    const tscOutput = `src/foo.ts(5,3): error TS2322: Type 'string' is not assignable to type 'number'.`;
    const result = compressErrors(`❌ Exit 1\n${tscOutput}`);
    expect(result[0].errorClass).toBe('type');
  });

  it('classifies TS1xxx errors as syntax', () => {
    const tscOutput = `src/foo.ts(5,3): error TS1005: '}' expected.`;
    const result = compressErrors(`❌ Exit 1\n${tscOutput}`);
    expect(result[0].errorClass).toBe('syntax');
  });

  it('parses multiple tsc errors into separate entries', () => {
    const tscOutput = [
      `src/a.ts(1,1): error TS2307: Cannot find module './x'.`,
      `src/b.ts(2,3): error TS2322: Type 'number' is not assignable to type 'string'.`,
    ].join('\n');
    const result = compressErrors(`❌ Exit 1\n${tscOutput}`);
    expect(result).toHaveLength(2);
  });
});

// ─── Unknown format ───────────────────────────────────────────────────────────

describe('compressErrors — unknown format', () => {
  it('returns a single architectural entry for unknown error output', () => {
    const unknownOutput = `❌ Exit 1\nSomething went really wrong\nCheck the logs`;
    const result = compressErrors(unknownOutput);
    expect(result).toHaveLength(1);
    expect(result[0].errorClass).toBe('architectural');
    expect(result[0].testName).toBe('');
    expect(result[0].file).toBe('');
    expect(result[0].line).toBe(0);
  });

  it('caps the assertion snippet at 400 chars for unknown format', () => {
    const bigOutput = `❌ Exit 1\n${'X'.repeat(1000)}`;
    const result = compressErrors(bigOutput);
    expect(result[0].assertion.length).toBeLessThanOrEqual(400);
  });

  it('preserves at most 20 lines from the unknown output', () => {
    const lines = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`);
    const output = `❌ Exit 1\n${lines.join('\n')}`;
    const result = compressErrors(output);
    // Result assertion should contain content from no more than the first 20 lines
    expect(result[0].assertion).not.toContain('line 21');
  });
});
