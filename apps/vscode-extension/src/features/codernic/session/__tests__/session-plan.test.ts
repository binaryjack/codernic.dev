/**
 * Unit tests — session-plan.ts
 * @group unit
 *
 * Uses real fs with a temporary directory.  No mocks required.
 */

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  clearSessionPlan,
  loadSessionPlan,
  saveSessionPlan,
  type ActiveSessionPlan,
} from '../session-plan';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_SUBPATH = path.join('.agencee', 'session', 'current-plan.json');

function makePlan(overrides: Partial<ActiveSessionPlan> = {}): ActiveSessionPlan {
  return {
    description: 'Add auth layer',
    dagFile: '/tmp/dag-abc123.json',
    phases: ['backend', 'frontend'],
    generatedAt: 1_700_000_000_000,
    promptOrigin: 'add authentication to the app',
    ...overrides,
  };
}

async function planExists(tmpDir: string): Promise<boolean> {
  return fs
    .access(path.join(tmpDir, PLAN_SUBPATH))
    .then(() => true)
    .catch(() => false);
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('session-plan', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codernic-plan-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ─── loadSessionPlan ──────────────────────────────────────────────────────

  describe('loadSessionPlan', () => {
    it('returns null when .agencee/session/ directory does not exist', async () => {
      const result = await loadSessionPlan(tmpDir);
      expect(result).toBeNull();
    });

    it('returns null when plan file is absent but directory exists', async () => {
      await fs.mkdir(path.join(tmpDir, '.agencee', 'session'), { recursive: true });
      const result = await loadSessionPlan(tmpDir);
      expect(result).toBeNull();
    });

    it('returns null when file contains completely invalid JSON', async () => {
      const planPath = path.join(tmpDir, PLAN_SUBPATH);
      await fs.mkdir(path.dirname(planPath), { recursive: true });
      await fs.writeFile(planPath, 'THIS IS NOT JSON', 'utf-8');
      const result = await loadSessionPlan(tmpDir);
      expect(result).toBeNull();
    });

    it('returns null when file contains truncated / partial JSON', async () => {
      const planPath = path.join(tmpDir, PLAN_SUBPATH);
      await fs.mkdir(path.dirname(planPath), { recursive: true });
      await fs.writeFile(planPath, '{"description": "incomplete"', 'utf-8');
      const result = await loadSessionPlan(tmpDir);
      expect(result).toBeNull();
    });

    it('returns null when file is empty', async () => {
      const planPath = path.join(tmpDir, PLAN_SUBPATH);
      await fs.mkdir(path.dirname(planPath), { recursive: true });
      await fs.writeFile(planPath, '', 'utf-8');
      const result = await loadSessionPlan(tmpDir);
      expect(result).toBeNull();
    });

    it('returns the plan when the file contains valid JSON', async () => {
      const plan = makePlan();
      const planPath = path.join(tmpDir, PLAN_SUBPATH);
      await fs.mkdir(path.dirname(planPath), { recursive: true });
      await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf-8');
      const result = await loadSessionPlan(tmpDir);
      expect(result).toEqual(plan);
    });

    it('preserves all fields exactly, including arrays and timestamps', async () => {
      const plan = makePlan({
        phases: ['alpha', 'beta', 'gamma', 'delta'],
        generatedAt: 9_999_999_999_999,
        dagFile: '/absolute/path/to/dag.json',
      });
      const planPath = path.join(tmpDir, PLAN_SUBPATH);
      await fs.mkdir(path.dirname(planPath), { recursive: true });
      await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf-8');
      const result = await loadSessionPlan(tmpDir);
      expect(result?.phases).toEqual(['alpha', 'beta', 'gamma', 'delta']);
      expect(result?.generatedAt).toBe(9_999_999_999_999);
      expect(result?.dagFile).toBe('/absolute/path/to/dag.json');
    });
  });

  // ─── saveSessionPlan ──────────────────────────────────────────────────────

  describe('saveSessionPlan', () => {
    it('creates the full .agencee/session/ directory tree when missing', async () => {
      const plan = makePlan();
      await saveSessionPlan(tmpDir, plan);
      expect(await planExists(tmpDir)).toBe(true);
    });

    it('writes valid JSON that round-trips back to the original plan', async () => {
      const plan = makePlan();
      await saveSessionPlan(tmpDir, plan);
      const loaded = await loadSessionPlan(tmpDir);
      expect(loaded).toEqual(plan);
    });

    it('overwrites an existing plan with new data', async () => {
      await saveSessionPlan(tmpDir, makePlan({ description: 'first plan' }));
      await saveSessionPlan(tmpDir, makePlan({ description: 'second plan' }));
      const loaded = await loadSessionPlan(tmpDir);
      expect(loaded?.description).toBe('second plan');
    });

    it('preserves all array fields exactly', async () => {
      const plan = makePlan({ phases: ['p1', 'p2', 'p3'] });
      await saveSessionPlan(tmpDir, plan);
      const loaded = await loadSessionPlan(tmpDir);
      expect(loaded?.phases).toEqual(['p1', 'p2', 'p3']);
    });

    it('preserves large timestamp values without precision loss', async () => {
      const plan = makePlan({ generatedAt: 1_700_123_456_789 });
      await saveSessionPlan(tmpDir, plan);
      const loaded = await loadSessionPlan(tmpDir);
      expect(loaded?.generatedAt).toBe(1_700_123_456_789);
    });

    it('is idempotent — calling twice with same plan produces one file', async () => {
      const plan = makePlan();
      await saveSessionPlan(tmpDir, plan);
      await saveSessionPlan(tmpDir, plan);
      const loaded = await loadSessionPlan(tmpDir);
      expect(loaded).toEqual(plan);
    });

    it('succeeds even when directory already exists', async () => {
      await fs.mkdir(path.join(tmpDir, '.agencee', 'session'), { recursive: true });
      await expect(saveSessionPlan(tmpDir, makePlan())).resolves.toBeUndefined();
    });

    it('writes pretty-printed JSON (human-readable)', async () => {
      await saveSessionPlan(tmpDir, makePlan());
      const raw = await fs.readFile(path.join(tmpDir, PLAN_SUBPATH), 'utf-8');
      // Must contain at least one newline (not minified)
      expect(raw).toContain('\n');
    });
  });

  // ─── clearSessionPlan ─────────────────────────────────────────────────────

  describe('clearSessionPlan', () => {
    it('resolves without throwing when plan file does not exist', async () => {
      await expect(clearSessionPlan(tmpDir)).resolves.toBeUndefined();
    });

    it('resolves without throwing when directory does not exist at all', async () => {
      const nonExistentDir = path.join(tmpDir, 'does-not-exist');
      await expect(clearSessionPlan(nonExistentDir)).resolves.toBeUndefined();
    });

    it('deletes an existing plan file', async () => {
      await saveSessionPlan(tmpDir, makePlan());
      await clearSessionPlan(tmpDir);
      expect(await planExists(tmpDir)).toBe(false);
    });

    it('loadSessionPlan returns null after clear', async () => {
      await saveSessionPlan(tmpDir, makePlan());
      await clearSessionPlan(tmpDir);
      const result = await loadSessionPlan(tmpDir);
      expect(result).toBeNull();
    });

    it('does not throw on a second consecutive clear (ENOENT is swallowed)', async () => {
      await saveSessionPlan(tmpDir, makePlan());
      await clearSessionPlan(tmpDir);
      await expect(clearSessionPlan(tmpDir)).resolves.toBeUndefined();
    });

    it('leaves the parent directory intact after clearing', async () => {
      await saveSessionPlan(tmpDir, makePlan());
      await clearSessionPlan(tmpDir);
      const dirExists = await fs
        .access(path.join(tmpDir, '.agencee', 'session'))
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });
  });

  // ─── Round-trip battle test ───────────────────────────────────────────────

  describe('save → load → clear round-trip (battle test)', () => {
    it('handles 20 sequential save/load/overwrite cycles correctly', async () => {
      for (let i = 0; i < 20; i++) {
        const plan = makePlan({ description: `plan-iteration-${i}`, generatedAt: Date.now() + i });
        await saveSessionPlan(tmpDir, plan);
        const loaded = await loadSessionPlan(tmpDir);
        expect(loaded?.description).toBe(`plan-iteration-${i}`);
      }
      await clearSessionPlan(tmpDir);
      expect(await loadSessionPlan(tmpDir)).toBeNull();
    });
  });
});
