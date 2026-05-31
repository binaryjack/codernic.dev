/**
 * Unit tests — scope-pinner.ts
 * @group unit
 *
 * Pure functions — no I/O, no mocks required.
 * `buildAllowedScope` depends on `parseContextBreadcrumb` which is already
 * tested independently in context-breadcrumb/__tests__/breadcrumb.test.ts.
 */

import type { CompressedError } from '../error-compressor';
import { buildAllowedScope, validatePatch } from '../scope-pinner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(file: string): CompressedError {
  return {
    testName: 'suite › test',
    file,
    line: 1,
    assertion: 'Expected: true  Received: false',
    errorClass: 'assertion',
  };
}

/** Build a MCP code-search-context string with the given paths in headers. */
function makeCodeContext(...paths: string[]): string {
  return paths.map((p) => `#### ${p}:1 - function \`example\`\nsome content`).join('\n\n');
}

// ─── buildAllowedScope ───────────────────────────────────────────────────────

describe('buildAllowedScope', () => {
  it('returns an empty Set when all inputs are empty', () => {
    const scope = buildAllowedScope('', [], []);
    expect(scope.size).toBe(0);
  });

  it('includes paths from the code-search-context breadcrumb', () => {
    const codeContext = makeCodeContext('src/auth/handler.ts', 'src/core/engine.ts');
    const scope = buildAllowedScope(codeContext, [], []);
    expect(scope.has('src/auth/handler.ts')).toBe(true);
    expect(scope.has('src/core/engine.ts')).toBe(true);
  });

  it('includes file paths from CompressedError entries', () => {
    const errors = [makeError('src/utils/helpers.ts'), makeError('src/api/router.ts')];
    const scope = buildAllowedScope('', errors, []);
    expect(scope.has('src/utils/helpers.ts')).toBe(true);
    expect(scope.has('src/api/router.ts')).toBe(true);
  });

  it('includes files from dagModifiedFiles', () => {
    const scope = buildAllowedScope('', [], ['src/gen/module.ts', 'src/gen/types.ts']);
    expect(scope.has('src/gen/module.ts')).toBe(true);
    expect(scope.has('src/gen/types.ts')).toBe(true);
  });

  it('produces the union of all three sources', () => {
    const codeContext = makeCodeContext('src/a.ts');
    const errors = [makeError('src/b.ts')];
    const dagFiles = ['src/c.ts'];
    const scope = buildAllowedScope(codeContext, errors, dagFiles);
    expect(scope.has('src/a.ts')).toBe(true);
    expect(scope.has('src/b.ts')).toBe(true);
    expect(scope.has('src/c.ts')).toBe(true);
  });

  it('does not include empty file strings from errors', () => {
    const errors = [makeError('')];
    const scope = buildAllowedScope('', errors, []);
    expect(scope.has('')).toBe(false);
  });

  it('de-duplicates across all three sources', () => {
    const codeContext = makeCodeContext('src/shared.ts');
    const errors = [makeError('src/shared.ts')];
    const dagFiles = ['src/shared.ts'];
    const scope = buildAllowedScope(codeContext, errors, dagFiles);
    expect(scope.size).toBe(1);
  });

  it('normalises Windows backslash paths to forward slashes', () => {
    const scope = buildAllowedScope('', [], ['src\\windows\\module.ts']);
    expect(scope.has('src/windows/module.ts')).toBe(true);
  });

  it('strips leading ./ from paths', () => {
    const scope = buildAllowedScope('', [makeError('./src/relative.ts')], []);
    expect(scope.has('src/relative.ts')).toBe(true);
    expect(scope.has('./src/relative.ts')).toBe(false);
  });
});

// ─── validatePatch ───────────────────────────────────────────────────────────

describe('validatePatch', () => {
  const scope = new Set(['src/auth/handler.ts', 'src/core/engine.ts']);

  it('returns all allowed when every file is in scope', () => {
    const { allowed, blocked } = validatePatch(
      ['src/auth/handler.ts', 'src/core/engine.ts'],
      scope,
    );
    expect(allowed).toHaveLength(2);
    expect(blocked).toHaveLength(0);
  });

  it('returns all blocked when no file is in scope', () => {
    const { allowed, blocked } = validatePatch(['src/other/module.ts'], scope);
    expect(allowed).toHaveLength(0);
    expect(blocked).toHaveLength(1);
    expect(blocked[0]).toBe('src/other/module.ts');
  });

  it('splits a mixed list correctly', () => {
    const { allowed, blocked } = validatePatch(
      ['src/auth/handler.ts', 'src/out-of-scope.ts'],
      scope,
    );
    expect(allowed).toContain('src/auth/handler.ts');
    expect(blocked).toContain('src/out-of-scope.ts');
  });

  it('handles an empty proposed list', () => {
    const { allowed, blocked } = validatePatch([], scope);
    expect(allowed).toHaveLength(0);
    expect(blocked).toHaveLength(0);
  });

  it('normalises backslashes before checking scope', () => {
    const scopeWithForwardSlash = new Set(['src/auth/handler.ts']);
    const { allowed, blocked } = validatePatch(['src\\auth\\handler.ts'], scopeWithForwardSlash);
    expect(allowed).toHaveLength(1);
    expect(blocked).toHaveLength(0);
  });

  it('returns the original path string (not the normalised form) in the result', () => {
    const { allowed } = validatePatch(['src/auth/handler.ts'], scope);
    expect(allowed[0]).toBe('src/auth/handler.ts');
  });
});
