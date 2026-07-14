/**
 * Unit tests — constraint-loader.ts
 * @group unit
 *
 * - `generateConstraintManifestFromProfile` — pure function, no mocks
 * - `loadConstraintManifest` — real fs via temp dir
 * - `ensureConstraintManifest` — real fs + mocked `callMcpTool`
 */

// Must be hoisted before any imports that pull in the module under test
jest.mock('../../../../shared/mcp', () => ({
  callMcpTool: jest.fn(),
}));

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import type { McpClientInstance } from '../../../../shared/mcp';
import { callMcpTool } from '../../../../shared/mcp';
import {
  ensureConstraintManifest,
  generateConstraintManifestFromProfile,
  loadConstraintManifest,
} from '../constraint-loader';

const mockCallMcpTool = callMcpTool as jest.MockedFunction<typeof callMcpTool>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONSTRAINTS_SUBPATH = path.join('.codernic', 'constraints.md');

// Fake MCP client — never called directly since callMcpTool is mocked
const FAKE_CLIENT = {} as McpClientInstance;

function makeMcpTextResult(obj: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(obj) }],
    isError: false,
  };
}

// ─── generateConstraintManifestFromProfile ───────────────────────────────────

describe('generateConstraintManifestFromProfile', () => {
  it('produces a string with opening <HARD_CONSTRAINTS> tag', () => {
    expect(generateConstraintManifestFromProfile({})).toContain('<HARD_CONSTRAINTS>');
  });

  it('produces a string with closing </HARD_CONSTRAINTS> tag', () => {
    expect(generateConstraintManifestFromProfile({})).toContain('</HARD_CONSTRAINTS>');
  });

  it('does not emit Naming section when naming is absent', () => {
    const result = generateConstraintManifestFromProfile({
      structure: { prefersNamedExports: true },
    });
    expect(result).not.toContain('### Naming');
  });

  it('emits all naming fields when all are present', () => {
    const result = generateConstraintManifestFromProfile({
      naming: {
        functions: 'camelCase',
        classes: 'PascalCase',
        interfaces: 'PascalCase',
        files: 'kebab-case',
        hooks: 'use',
      },
    });
    expect(result).toContain('Functions: **camelCase**');
    expect(result).toContain('Classes: **PascalCase**');
    expect(result).toContain('Interfaces: **PascalCase**');
    expect(result).toContain('Files: **kebab-case**');
    expect(result).toContain('Hooks: **use** prefix');
  });

  it('omits a naming field when it is falsy / absent', () => {
    const result = generateConstraintManifestFromProfile({ naming: { functions: 'camelCase' } });
    expect(result).toContain('camelCase');
    expect(result).not.toContain('Classes:');
    expect(result).not.toContain('Files:');
  });

  it('emits "Named exports required" when prefersNamedExports is true', () => {
    const result = generateConstraintManifestFromProfile({
      structure: { prefersNamedExports: true },
    });
    expect(result).toContain('Named exports required');
  });

  it('omits "Named exports required" when prefersNamedExports is false', () => {
    const result = generateConstraintManifestFromProfile({
      structure: { prefersNamedExports: false },
    });
    expect(result).not.toContain('Named exports required');
  });

  it('emits "Functional components" when componentPattern is "functional"', () => {
    const result = generateConstraintManifestFromProfile({
      structure: { componentPattern: 'functional' },
    });
    expect(result).toContain('Functional components');
  });

  it('omits "Functional components" for non-functional componentPattern', () => {
    const result = generateConstraintManifestFromProfile({
      structure: { componentPattern: 'class' },
    });
    expect(result).not.toContain('Functional components');
  });

  it('emits all structure flags when all are true', () => {
    const result = generateConstraintManifestFromProfile({
      structure: {
        prefersNamedExports: true,
        usesBarrelIndex: true,
        prefersFactoryFunctions: true,
        prefersReadonly: true,
        prefersTypeOverInterface: true,
        componentPattern: 'functional',
      },
    });
    expect(result).toContain('Named exports required');
    expect(result).toContain('Barrel index');
    expect(result).toContain('Factory functions');
    expect(result).toContain('Immutability');
    expect(result).toContain('Types over interfaces');
    expect(result).toContain('Functional components');
  });

  it('emits import constraints when all import flags are true', () => {
    const result = generateConstraintManifestFromProfile({
      imports: {
        prefersAbsoluteImports: true,
        usesPathAliases: true,
        importsHaveJsExtension: true,
      },
    });
    expect(result).toContain('Absolute imports');
    expect(result).toContain('Path aliases');
    expect(result).toContain('`.js` extension');
  });

  it('omits ImportS section when no import entries are set', () => {
    const result = generateConstraintManifestFromProfile({
      imports: {
        prefersAbsoluteImports: false,
        usesPathAliases: false,
        importsHaveJsExtension: false,
      },
    });
    // Section header still emitted but no bullet lines
    expect(result).not.toContain('Absolute imports');
    expect(result).not.toContain('Path aliases');
  });

  it('emits all testing fields when all are present and truthy', () => {
    const result = generateConstraintManifestFromProfile({
      testing: {
        framework: 'jest',
        fileNamingPattern: '*.test.ts',
        prefersCoLocation: true,
      },
    });
    expect(result).toContain('Framework: **jest**');
    expect(result).toContain('Test file pattern: ***.test.ts**');
    expect(result).toContain('Co-located tests');
  });

  it('omits co-location line when prefersCoLocation is false', () => {
    const result = generateConstraintManifestFromProfile({
      testing: { prefersCoLocation: false },
    });
    expect(result).not.toContain('Co-located tests');
  });

  it('produces a valid string for a totally empty profile', () => {
    const result = generateConstraintManifestFromProfile({});
    expect(typeof result).toBe('string');
    expect(result.trim().endsWith('</HARD_CONSTRAINTS>')).toBe(true);
  });

  it('battle test — full profile produces all expected sections', () => {
    const result = generateConstraintManifestFromProfile({
      naming: {
        functions: 'camelCase',
        classes: 'PascalCase',
        files: 'kebab-case',
        hooks: 'use',
        interfaces: 'IPascal',
      },
      structure: {
        prefersNamedExports: true,
        usesBarrelIndex: true,
        componentPattern: 'functional',
      },
      imports: {
        prefersAbsoluteImports: true,
        usesPathAliases: false,
        importsHaveJsExtension: false,
      },
      testing: { framework: 'vitest', fileNamingPattern: '*.spec.ts', prefersCoLocation: true },
    });
    expect(result).toContain('camelCase');
    expect(result).toContain('PascalCase');
    expect(result).toContain('Named exports required');
    expect(result).toContain('Barrel index');
    expect(result).toContain('Functional components');
    expect(result).toContain('Absolute imports');
    expect(result).toContain('Framework: **vitest**');
    expect(result).toContain('Co-located tests');
  });
});

// ─── loadConstraintManifest ──────────────────────────────────────────────────

describe('loadConstraintManifest', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'constraint-load-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns null when .agencee/constraints.md does not exist', async () => {
    const result = await loadConstraintManifest(tmpDir);
    expect(result).toBeNull();
  });

  it('returns null when .agencee/ directory does not exist', async () => {
    // No setup — directory tree is absent
    const result = await loadConstraintManifest(tmpDir);
    expect(result).toBeNull();
  });

  it('returns the file content when the file exists', async () => {
    const constraintsPath = path.join(tmpDir, CONSTRAINTS_SUBPATH);
    await fs.mkdir(path.dirname(constraintsPath), { recursive: true });
    await fs.writeFile(constraintsPath, '<HARD_CONSTRAINTS>\nfoo\n</HARD_CONSTRAINTS>', 'utf-8');
    const result = await loadConstraintManifest(tmpDir);
    expect(result).toBe('<HARD_CONSTRAINTS>\nfoo\n</HARD_CONSTRAINTS>');
  });

  it('returns the exact raw content (no trimming or transformation)', async () => {
    const raw = '  leading spaces\nand trailing newlines\n\n';
    const constraintsPath = path.join(tmpDir, CONSTRAINTS_SUBPATH);
    await fs.mkdir(path.dirname(constraintsPath), { recursive: true });
    await fs.writeFile(constraintsPath, raw, 'utf-8');
    const result = await loadConstraintManifest(tmpDir);
    expect(result).toBe(raw);
  });
});

// ─── ensureConstraintManifest ────────────────────────────────────────────────

describe('ensureConstraintManifest', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'constraint-ensure-test-'));
    mockCallMcpTool.mockReset();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty string immediately when mcpClient is null', async () => {
    const result = await ensureConstraintManifest(tmpDir, null);
    expect(result).toBe('');
  });

  it('does not call MCP when mcpClient is null', async () => {
    await ensureConstraintManifest(tmpDir, null);
    expect(mockCallMcpTool).not.toHaveBeenCalled();
  });

  it('returns cached file content without calling MCP when constraints.md exists', async () => {
    const constraintsPath = path.join(tmpDir, CONSTRAINTS_SUBPATH);
    await fs.mkdir(path.dirname(constraintsPath), { recursive: true });
    await fs.writeFile(constraintsPath, 'CACHED_BLOCK', 'utf-8');
    const result = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(result).toBe('CACHED_BLOCK');
    expect(mockCallMcpTool).not.toHaveBeenCalled();
  });

  it('calls pirsig-profile MCP tool on cache miss', async () => {
    mockCallMcpTool.mockResolvedValueOnce(
      makeMcpTextResult({ naming: { functions: 'camelCase' } }),
    );
    await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(mockCallMcpTool).toHaveBeenCalledWith(
      FAKE_CLIENT,
      expect.objectContaining({ name: 'pirsig-profile' }),
    );
  });

  it('generates a <HARD_CONSTRAINTS> block from the MCP profile response', async () => {
    const profile = { naming: { functions: 'camelCase', classes: 'PascalCase' } };
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(profile));
    const result = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(result).toContain('<HARD_CONSTRAINTS>');
    expect(result).toContain('camelCase');
    expect(result).toContain('PascalCase');
  });

  it('writes the generated manifest to .agencee/constraints.md', async () => {
    const profile = { naming: { functions: 'camelCase' } };
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(profile));
    const returned = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    const onDisk = await loadConstraintManifest(tmpDir);
    expect(onDisk).toBe(returned);
  });

  it('returns the manifest (same value as written to disk)', async () => {
    const profile = { structure: { prefersNamedExports: true } };
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(profile));
    const result = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(result).toContain('Named exports required');
  });

  it('returns empty string when MCP content array is empty', async () => {
    mockCallMcpTool.mockResolvedValueOnce({ content: [], isError: false });
    const result = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(result).toBe('');
  });

  it('returns empty string when MCP content has only non-text entries', async () => {
    mockCallMcpTool.mockResolvedValueOnce({
      content: [{ type: 'image', data: 'abc', mimeType: 'image/png' }],
      isError: false,
    });
    const result = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(result).toBe('');
  });

  it('returns empty string when MCP throws an error', async () => {
    mockCallMcpTool.mockRejectedValueOnce(new Error('MCP server offline'));
    const result = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(result).toBe('');
  });

  it('returns empty string when MCP returns invalid JSON text', async () => {
    mockCallMcpTool.mockResolvedValueOnce({
      content: [{ type: 'text' as const, text: 'NOT VALID JSON {{{' }],
      isError: false,
    });
    const result = await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(result).toBe('');
  });

  it('does not write constraints.md to disk when MCP fails', async () => {
    mockCallMcpTool.mockRejectedValueOnce(new Error('connection refused'));
    await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    const onDisk = await loadConstraintManifest(tmpDir);
    expect(onDisk).toBeNull();
  });

  it('subsequent call after MCP-generated write serves from cache (no second MCP call)', async () => {
    const profile = { naming: { functions: 'camelCase' } };
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(profile));
    // First call generates
    await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    // Second call should read cache
    await ensureConstraintManifest(tmpDir, FAKE_CLIENT);
    expect(mockCallMcpTool).toHaveBeenCalledTimes(1);
  });
});
