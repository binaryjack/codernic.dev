/**
 * Unit tests — breadcrumb.ts
 * @group unit
 *
 * Pure functions with no external dependencies — no mocks required.
 */

import { formatBreadcrumb, parseContextBreadcrumb } from '../breadcrumb';

// ─── parseContextBreadcrumb ──────────────────────────────────────────────────

describe('parseContextBreadcrumb', () => {
  it('returns [] on empty string', () => {
    expect(parseContextBreadcrumb('')).toEqual([]);
  });

  it('returns [] when contextText has no markdown headers', () => {
    const text = 'some regular paragraph\nno headers here\n';
    expect(parseContextBreadcrumb(text)).toEqual([]);
  });

  it('extracts a single path from a single header', () => {
    const text = '#### src/auth/handler.ts:42 - function `parseToken`\nsome content\n';
    expect(parseContextBreadcrumb(text)).toEqual(['src/auth/handler.ts']);
  });

  it('extracts multiple distinct paths preserving insertion order', () => {
    const text = [
      '#### src/auth/handler.ts:1 - function `parseToken`',
      'some content under first header',
      '#### src/core/engine.ts:99 - class `Engine`',
      'content under second header',
      '#### src/utils/helpers.ts:10 - function `noop`',
    ].join('\n');
    expect(parseContextBreadcrumb(text)).toEqual([
      'src/auth/handler.ts',
      'src/core/engine.ts',
      'src/utils/helpers.ts',
    ]);
  });

  it('de-duplicates the same path appearing in multiple headers', () => {
    const text = [
      '#### src/auth/handler.ts:1 - function `getUser`',
      '#### src/auth/handler.ts:20 - function `setUser`',
      '#### src/auth/handler.ts:55 - function `deleteUser`',
    ].join('\n');
    expect(parseContextBreadcrumb(text)).toEqual(['src/auth/handler.ts']);
  });

  it('de-duplicates across different contexts, including non-adjacent occurrences', () => {
    const text = [
      '#### src/a.ts:1 - function `alpha`',
      '#### src/b.ts:2 - function `beta`',
      '#### src/a.ts:99 - function `gamma`',
    ].join('\n');
    expect(parseContextBreadcrumb(text)).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('ignores lines with fewer than 4 leading # characters', () => {
    const text = [
      '### heading-three',
      '## heading-two',
      '# heading-one',
      '#### src/valid.ts:5 - function `ok`',
    ].join('\n');
    expect(parseContextBreadcrumb(text)).toEqual(['src/valid.ts']);
  });

  it('ignores lines that look like headers but have no line-number suffix', () => {
    // Regex requires :\d+ immediately after the path
    const text = '#### src/auth/handler.ts something else without line number\n';
    expect(parseContextBreadcrumb(text)).toEqual([]);
  });

  it('handles deeply nested paths', () => {
    const text =
      '#### src/features/codernic/pirsig/pirsig-preflight.ts:7 - interface `PirsigBaseline`\n';
    expect(parseContextBreadcrumb(text)).toEqual([
      'src/features/codernic/pirsig/pirsig-preflight.ts',
    ]);
  });

  it('handles a large number of distinct files (battle test: 20 files)', () => {
    const files = Array.from({ length: 20 }, (_, i) => `src/module-${i}/index.ts`);
    const text = files.map((f, i) => `#### ${f}:${i + 1} - function \`fn${i}\``).join('\n');
    const result = parseContextBreadcrumb(text);
    expect(result).toHaveLength(20);
    expect(result).toEqual(files);
  });

  it('returns only unique files from a large repetitive text (battle test: 100 hits, 3 files)', () => {
    const files = ['src/a.ts', 'src/b.ts', 'src/c.ts'];
    const text = Array.from({ length: 100 }, (_, i) => {
      const f = files[i % 3];
      return `#### ${f}:${i + 1} - function \`fn${i}\``;
    }).join('\n');
    const result = parseContextBreadcrumb(text);
    expect(result).toHaveLength(3);
    expect(result).toEqual(files);
  });
});

// ─── formatBreadcrumb ────────────────────────────────────────────────────────

describe('formatBreadcrumb', () => {
  it('returns empty string for an empty array', () => {
    expect(formatBreadcrumb([])).toBe('');
  });

  it('renders a single path showing only the basename', () => {
    expect(formatBreadcrumb(['src/auth/handler.ts'])).toBe('📎 *Context: handler.ts*');
  });

  it('strips directory prefix and shows basename only', () => {
    expect(formatBreadcrumb(['a/b/c/deep-file.ts'])).toBe('📎 *Context: deep-file.ts*');
  });

  it('handles a path with no directory separator (root file)', () => {
    expect(formatBreadcrumb(['index.ts'])).toBe('📎 *Context: index.ts*');
  });

  it('renders exactly 2 paths with · separator', () => {
    const paths = ['src/a.ts', 'src/b.ts'];
    expect(formatBreadcrumb(paths)).toBe('📎 *Context: a.ts · b.ts*');
  });

  it('renders exactly 3 paths without overflow suffix', () => {
    const paths = ['src/a.ts', 'src/b.ts', 'src/c.ts'];
    expect(formatBreadcrumb(paths)).toBe('📎 *Context: a.ts · b.ts · c.ts*');
  });

  it('renders 4 paths with +1 more suffix', () => {
    const paths = ['p/a.ts', 'p/b.ts', 'p/c.ts', 'p/d.ts'];
    expect(formatBreadcrumb(paths)).toBe('📎 *Context: a.ts · b.ts · c.ts · +1 more*');
  });

  it('renders 5 paths with +2 more suffix', () => {
    const paths = ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts'];
    expect(formatBreadcrumb(paths)).toBe('📎 *Context: a.ts · b.ts · c.ts · +2 more*');
  });

  it('renders 10 paths with +7 more suffix (battle test)', () => {
    const paths = Array.from({ length: 10 }, (_, i) => `src/module-${i}.ts`);
    const result = formatBreadcrumb(paths);
    expect(result).toContain('+7 more');
    expect(result).toContain('module-0.ts');
    expect(result).toContain('module-2.ts');
    // module-3 through module-9 are hidden
    expect(result).not.toContain('module-3.ts');
  });

  it('normalises Windows-style backslash paths when extracting basename', () => {
    expect(formatBreadcrumb(['src\\auth\\handler.ts'])).toBe('📎 *Context: handler.ts*');
  });

  it('always starts with the breadcrumb emoji prefix', () => {
    expect(formatBreadcrumb(['src/x.ts'])).toMatch(/^📎/);
  });

  it('wraps label in italic markdown syntax', () => {
    const result = formatBreadcrumb(['src/x.ts']);
    expect(result).toMatch(/\*Context:.*\*$/);
  });
});
