/**
 * workspace-tools.test.ts
 *
 * Targeted tests for security and correctness properties of executeWorkspaceTool.
 * Written BEFORE the fixes are applied — these tests must be RED until Phase 1–2
 * fixes land, then GREEN.
 *
 * Coverage intent:
 *   - Path traversal bypass via startsWith (critical — steps 1 & 6)
 *   - ReDoS via unguarded RegExp construction (critical — step 2)
 *   - toolWriteFile ensures parent directory exists (step 6)
 *   - toolReadProjectMemory + toolWriteProjectMemory regression
 */

import * as path from 'path';
import { executeWorkspaceTool } from '../shared/api/workspace-tools';

// Pull in the vscode mock so we can control workspace.fs behaviour.
// Use require() (not jest.requireMock) so we get the SAME instance that
// workspace-tools.ts uses at runtime (moduleNameMapper routes both to the mock).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vscode = require('vscode') as typeof import('vscode') & {
  workspace: {
    fs: {
      readFile: jest.MockedFunction<() => Promise<Uint8Array>>;
      writeFile: jest.MockedFunction<() => Promise<void>>;
      createDirectory: jest.MockedFunction<() => Promise<void>>;
      readDirectory: jest.MockedFunction<() => Promise<[string, number][]>>;
    };
    findFiles: jest.MockedFunction<() => Promise<{ fsPath: string }[]>>;
    applyEdit: jest.MockedFunction<() => Promise<boolean>>;
  };
};

// Build an absolute path that works on both Windows (C:\...) and Unix (/...).
// path.normalize('/foo') on Windows produces a drive-relative path which fails
// path.resolve comparisons once a drive letter is added by path.resolve().
const ROOT = path.join(path.parse(process.cwd()).root, 'workspace', 'my-project');

beforeEach(() => {
  jest.resetAllMocks();
  // re-apply WorkspaceEdit constructor implementation after reset
  (vscode.WorkspaceEdit as jest.Mock).mockImplementation(() => ({
    createFile: jest.fn(),
    deleteFile: jest.fn(),
    insert: jest.fn(),
    replace: jest.fn(),
    delete: jest.fn(),
  }));
  // Default: applyEdit succeeds
  vscode.workspace.applyEdit.mockResolvedValue(true);
  // Default: no files found
  vscode.workspace.findFiles.mockResolvedValue([]);
  // Default: fs reads throw "not found"
  vscode.workspace.fs.readFile.mockRejectedValue({ code: 'FileNotFound' });
  vscode.workspace.fs.createDirectory.mockResolvedValue(undefined);
  vscode.workspace.fs.writeFile.mockResolvedValue(undefined);
  vscode.workspace.fs.readDirectory.mockResolvedValue([]);
});

// ─── Path Traversal — read_file ───────────────────────────────────────────────

describe('read_file — path traversal', () => {
  it('rejects ../../../etc/passwd', async () => {
    const result = await executeWorkspaceTool('read_file', { path: '../../../etc/passwd' }, ROOT);
    expect(result).toMatch(/security violation/);
  });

  it('rejects sibling-project path that shares root prefix (suffix bypass)', async () => {
    // ROOT = /workspace/my-project
    // This path resolves to /workspace/my-project-evil/file
    // With .startsWith(ROOT) only: '/workspace/my-project-evil'.startsWith('/workspace/my-project') → TRUE (bypass!)
    // With path.sep guard: FALSE (correct rejection)
    const siblingPath = path.join('..', 'my-project-evil', 'secret.ts');
    const result = await executeWorkspaceTool('read_file', { path: siblingPath }, ROOT);
    expect(result).toMatch(/security violation/);
  });

  it('allows a valid path inside root', async () => {
    vscode.workspace.fs.readFile.mockResolvedValue(Buffer.from('console.log("ok")'));
    const result = await executeWorkspaceTool('read_file', { path: 'src/index.ts' }, ROOT);
    expect(result).not.toMatch(/security violation/);
    expect(result).toContain('console.log');
  });
});

// ─── Path Traversal — write_file ─────────────────────────────────────────────

describe('write_file — path traversal', () => {
  it('rejects ../../../tmp/evil.ts', async () => {
    const result = await executeWorkspaceTool(
      'write_file',
      { path: '../../../tmp/evil.ts', content: 'evil' },
      ROOT,
    );
    expect(result).toMatch(/security violation/);
    expect(vscode.workspace.applyEdit).not.toHaveBeenCalled();
  });

  it('rejects sibling-project path (suffix bypass)', async () => {
    const siblingPath = path.join('..', 'my-project-evil', 'inject.ts');
    const result = await executeWorkspaceTool(
      'write_file',
      { path: siblingPath, content: 'bad' },
      ROOT,
    );
    expect(result).toMatch(/security violation/);
  });

  it('ensures parent directory exists before writing', async () => {
    const result = await executeWorkspaceTool(
      'write_file',
      { path: 'src/new-dir/file.ts', content: 'export {}' },
      ROOT,
    );
    expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
    expect(result).not.toMatch(/security violation/);
  });
});

// ─── Path Traversal — create_directory ───────────────────────────────────────

describe('create_directory — path traversal', () => {
  it('rejects path outside root', async () => {
    const result = await executeWorkspaceTool('create_directory', { path: '../../outside' }, ROOT);
    expect(result).toMatch(/security violation/);
    expect(vscode.workspace.fs.createDirectory).not.toHaveBeenCalled();
  });

  it('rejects sibling-project path (suffix bypass)', async () => {
    const siblingPath = path.join('..', 'my-project-evil');
    const result = await executeWorkspaceTool('create_directory', { path: siblingPath }, ROOT);
    expect(result).toMatch(/security violation/);
  });
});

// ─── Path Traversal — run_terminal cwd ───────────────────────────────────────

describe('run_terminal — cwd traversal', () => {
  it('rejects cwd outside workspace', async () => {
    const result = await executeWorkspaceTool(
      'run_terminal',
      { command: 'ls', cwd: '../../etc' },
      ROOT,
    );
    expect(result).toMatch(/security violation/);
  });

  it('rejects cwd with sibling-project suffix bypass', async () => {
    const siblingCwd = path.join('..', 'my-project-evil');
    const result = await executeWorkspaceTool(
      'run_terminal',
      { command: 'ls', cwd: siblingCwd },
      ROOT,
    );
    expect(result).toMatch(/security violation/);
  });
});

// ─── Regex error handling ─────────────────────────────────────────────────────

describe('grep_project — regex handling', () => {
  it('handles valid-but-dangerous quantifier pattern without hanging', async () => {
    // (a+)+$ is syntactically valid — no SyntaxError — returns promptly with no file matches.
    // This is a regression test: the function must return a string (not hang or throw).
    const result = await executeWorkspaceTool('grep_project', { pattern: '(a+)+$' }, ROOT);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/No matches found/);
  });

  it('[RED] returns user-friendly message for syntactically invalid regex', async () => {
    // [invalid is a SyntaxError — unterminated character class.
    // Before fix: "Error searching project: Invalid regular expression: ..."
    // After fix:  "Invalid regex pattern: [invalid"
    const result = await executeWorkspaceTool('grep_project', { pattern: '[invalid' }, ROOT);
    expect(result).toMatch(/Invalid regex pattern/i);
  });

  it('returns no-matches string for valid regex when no files exist', async () => {
    const result = await executeWorkspaceTool('grep_project', { pattern: 'hello' }, ROOT);
    expect(result).toMatch(/No matches found/);
    expect(result).not.toMatch(/Invalid regex/);
  });
});

// ─── read_project_memory — regression ────────────────────────────────────────

describe('read_project_memory', () => {
  it('returns no-memory message when all intelligence files are absent', async () => {
    vscode.workspace.fs.readFile.mockRejectedValue({ code: 'FileNotFound' });
    vscode.workspace.fs.readDirectory.mockRejectedValue({ code: 'FileNotFound' });
    const result = await executeWorkspaceTool('read_project_memory', {}, ROOT);
    expect(result).toMatch(/No project memory found/);
  });

  it('returns formatted sections when project-memory.md exists', async () => {
    (vscode.workspace.fs.readFile as jest.Mock).mockImplementation((uri: { fsPath: string }) => {
      if (uri.fsPath.endsWith('project-memory.md')) {
        return Promise.resolve(Buffer.from('## [2026-01-01] [decision]\n\nUsed kebab-case.\n'));
      }
      return Promise.reject({ code: 'FileNotFound' });
    });
    vscode.workspace.fs.readDirectory.mockRejectedValue({ code: 'FileNotFound' });
    const result = await executeWorkspaceTool('read_project_memory', {}, ROOT);
    expect(result).toContain('project-memory.md');
    expect(result).toContain('kebab-case');
  });
});

// ─── write_project_memory — regression ───────────────────────────────────────

describe('write_project_memory', () => {
  it('calls createDirectory and writeFile with correct arguments', async () => {
    const result = await executeWorkspaceTool(
      'write_project_memory',
      { content: 'Used prototype pattern', category: 'convention' },
      ROOT,
    );
    expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
    expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
    expect(result).toMatch(/Memory recorded/);
    expect(result).toContain('convention');
  });

  it('returns error string when writeFile fails — does not throw', async () => {
    vscode.workspace.fs.writeFile.mockRejectedValue(new Error('disk full'));
    const result = await executeWorkspaceTool(
      'write_project_memory',
      { content: 'some content' },
      ROOT,
    );
    expect(result).toMatch(/Error writing memory/);
  });

  it('returns error when content is empty', async () => {
    const result = await executeWorkspaceTool('write_project_memory', { content: '' }, ROOT);
    expect(result).toMatch(/content is required/);
  });
});
