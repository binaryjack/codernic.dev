/**
 * Unit tests — test-runner-detector.ts
 * @group unit
 *
 * Uses a real temp directory to test file-system resolution.
 * Pattern mirrors session-plan.test.ts (real fs, OS temp dir).
 */

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { detectTestCommand } from '../test-runner-detector';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function mkTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'repair-cycle-test-'));
}

async function writeJson(dir: string, relPath: string, content: unknown): Promise<void> {
  const abs = path.join(dir, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, JSON.stringify(content), 'utf-8');
}

// Clean up temp dirs after each test
const dirsToCleanup: string[] = [];
afterEach(async () => {
  for (const d of dirsToCleanup) {
    await fs.rm(d, { recursive: true, force: true }).catch(() => undefined);
  }
  dirsToCleanup.length = 0;
});

// ─── Tech registry detection ──────────────────────────────────────────────────

describe('detectTestCommand — tech-registry.json', () => {
  it('returns the testRunner field from tech-registry.json when present', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await writeJson(dir, '.agencee/config/intelligence/tech-registry.json', {
      testRunner: 'vitest run --reporter=verbose',
      packageManager: 'pnpm',
    });

    expect(await detectTestCommand(dir)).toBe('vitest run --reporter=verbose');
  });

  it('falls through to package.json when testRunner is missing from registry', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await writeJson(dir, '.agencee/config/intelligence/tech-registry.json', {
      packageManager: 'pnpm',
      // no testRunner field
    });
    await writeJson(dir, 'package.json', { scripts: { test: 'jest' }, devDependencies: {} });
    // pnpm lockfile
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), '', 'utf-8');

    const result = await detectTestCommand(dir);
    expect(result).toBe('pnpm test');
  });

  it('falls through to package.json when tech-registry.json is missing', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await writeJson(dir, 'package.json', { scripts: { test: 'jest' } });
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), '', 'utf-8');

    const result = await detectTestCommand(dir);
    expect(result).toBe('pnpm test');
  });

  it('handles a malformed tech-registry.json without throwing', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    const registryPath = path.join(dir, '.agencee/config/intelligence/tech-registry.json');
    await fs.mkdir(path.dirname(registryPath), { recursive: true });
    await fs.writeFile(registryPath, '{invalid json', 'utf-8');

    // Should NOT throw — should fall through to next strategy
    await expect(detectTestCommand(dir)).resolves.not.toThrow();
  });
});

// ─── package.json detection ───────────────────────────────────────────────────

describe('detectTestCommand — package.json scripts.test', () => {
  it('wraps a bare test script with the detected package manager', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await writeJson(dir, 'package.json', { scripts: { test: 'jest --ci' } });
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), '', 'utf-8');

    const result = await detectTestCommand(dir);
    expect(result).toBe('pnpm test');
  });

  it('passes through a scripts.test that already starts with "pnpm"', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await writeJson(dir, 'package.json', { scripts: { test: 'pnpm run jest' } });

    const result = await detectTestCommand(dir);
    expect(result).toBe('pnpm run jest');
  });

  it('passes through a scripts.test that already starts with "npx"', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await writeJson(dir, 'package.json', { scripts: { test: 'npx jest' } });

    const result = await detectTestCommand(dir);
    expect(result).toBe('npx jest');
  });
});

// ─── Lockfile-based detection ─────────────────────────────────────────────────

describe('detectTestCommand — lockfile detection', () => {
  it('returns "pnpm test" when pnpm-lock.yaml is present', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), '', 'utf-8');
    await writeJson(dir, 'package.json', { scripts: {} });

    const result = await detectTestCommand(dir);
    expect(result).toBe('pnpm test');
  });

  it('returns "yarn test" when yarn.lock is present (no pnpm lock)', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await fs.writeFile(path.join(dir, 'yarn.lock'), '', 'utf-8');
    await writeJson(dir, 'package.json', { scripts: {} });

    const result = await detectTestCommand(dir);
    expect(result).toBe('yarn test');
  });

  it('returns "npm test" when package-lock.json is present (no pnpm/yarn)', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await fs.writeFile(path.join(dir, 'package-lock.json'), '', 'utf-8');
    await writeJson(dir, 'package.json', { scripts: {} });

    const result = await detectTestCommand(dir);
    expect(result).toBe('npm test');
  });
});

// ─── Ultimate fallback ────────────────────────────────────────────────────────

describe('detectTestCommand — ultimate fallback', () => {
  it('returns "pnpm test" for an empty directory (no config files)', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    const result = await detectTestCommand(dir);
    expect(result).toBe('pnpm test');
  });

  it('never throws regardless of workspace content', async () => {
    const dir = await mkTempDir();
    dirsToCleanup.push(dir);

    await expect(detectTestCommand(dir)).resolves.toBeDefined();
  });
});
