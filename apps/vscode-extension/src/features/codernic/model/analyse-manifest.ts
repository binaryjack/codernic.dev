/** Analyse manifest — tracks which steps have been completed and which source files were scanned.
 *  Enables incremental re-analysis: only re-run steps whose source files have changed.
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalyseStep = 'tech-identification' | 'convention-mining' | 'agent-generation';

export type AnalyseProfile = 'starter' | 'standard' | 'enterprise';

export type StepRecord = {
  completedAt: string;
  profile: AnalyseProfile;
  /** SHA-256 hashes of each source file that contributed to this step output. */
  sourceHashes: Record<string, string>;
};

export type AnalyseManifest = {
  schemaVersion: 1;
  generatedAt: string;
  profile: AnalyseProfile;
  steps: Partial<Record<AnalyseStep, StepRecord>>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INTELLIGENCE_DIR = path.join('.agencee', 'config', 'intelligence');
const MANIFEST_FILE = 'manifest.json';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Compute SHA-256 hex digest of a file. Returns null if the file cannot be read. */
export async function hashFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

/** Compute SHA-256 hashes for a list of file paths. Missing files are skipped. */
export async function hashFiles(filePaths: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  await Promise.all(
    filePaths.map(async (fp) => {
      const h = await hashFile(fp);
      if (h !== null) result[fp] = h;
    }),
  );
  return result;
}

// ─── Manifest IO ─────────────────────────────────────────────────────────────

/** Load the manifest from disk. Returns a blank manifest if the file does not exist. */
export async function loadManifest(workspaceRoot: string): Promise<AnalyseManifest> {
  const manifestPath = path.join(workspaceRoot, INTELLIGENCE_DIR, MANIFEST_FILE);
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(raw) as AnalyseManifest;
  } catch {
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      profile: 'standard',
      steps: {},
    };
  }
}

/** Persist the manifest to disk. Creates the directory if it does not exist. */
export async function saveManifest(
  workspaceRoot: string,
  manifest: AnalyseManifest,
): Promise<void> {
  const dir = path.join(workspaceRoot, INTELLIGENCE_DIR);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, MANIFEST_FILE),
    JSON.stringify({ ...manifest, generatedAt: new Date().toISOString() }, null, 2),
    'utf-8',
  );
}

// ─── Staleness check ─────────────────────────────────────────────────────────

/**
 * Returns true if the step needs to be re-run because:
 * - it has never been completed, OR
 * - the profile has changed, OR
 * - any source file hash no longer matches
 */
export async function stepIsStale(
  manifest: AnalyseManifest,
  step: AnalyseStep,
  profile: AnalyseProfile,
  currentSourceFiles: string[],
): Promise<boolean> {
  const record = manifest.steps[step];
  if (!record) return true;
  if (record.profile !== profile) return true;

  const currentHashes = await hashFiles(currentSourceFiles);
  // If any tracked file has changed or disappeared, step is stale
  for (const [filePath, oldHash] of Object.entries(record.sourceHashes)) {
    if (currentHashes[filePath] !== oldHash) return true;
  }
  return false;
}

/** Mark a step as complete in the manifest (does not save to disk — caller must call saveManifest). */
export function markStepComplete(
  manifest: AnalyseManifest,
  step: AnalyseStep,
  profile: AnalyseProfile,
  sourceHashes: Record<string, string>,
): AnalyseManifest {
  return {
    ...manifest,
    steps: {
      ...manifest.steps,
      [step]: {
        completedAt: new Date().toISOString(),
        profile,
        sourceHashes,
      },
    },
  };
}

/** Clear one or more steps from the manifest (used by --force flags). */
export function clearSteps(
  manifest: AnalyseManifest,
  steps: AnalyseStep[] | 'all',
): AnalyseManifest {
  if (steps === 'all') {
    return { ...manifest, steps: {} };
  }
  const updated = { ...manifest.steps };
  for (const step of steps) {
    delete updated[step];
  }
  return { ...manifest, steps: updated };
}
