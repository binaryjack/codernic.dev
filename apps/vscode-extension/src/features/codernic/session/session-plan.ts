/**
 * @file session-plan.ts
 * @description Lightweight persistence for the active Codernic session plan.
 *
 * A session plan is written when `/plan` runs successfully and cleared when
 * `/agent` finishes execution.  The file lives at:
 *   .agencee/session/current-plan.json
 *
 * All functions are safe to call concurrently — writes are atomic via a temp
 * file rename and reads return `null` on ENOENT.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface ActiveSessionPlan {
  /** Original user prompt that triggered the plan. */
  description: string;
  /** Absolute path to the generated DAG JSON file. */
  dagFile: string;
  /** Lane IDs from the DagSpecification (execution phases). */
  phases: string[];
  /** Unix timestamp (ms) when the plan was generated. */
  generatedAt: number;
  /** The original prompt text (preserved for followup pill). */
  promptOrigin: string;
}

const PLAN_FILE = path.join('.agencee', 'session', 'current-plan.json');

function planPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, PLAN_FILE);
}

/**
 * Reads the active session plan from disk.
 * Returns `null` if no plan exists or if the file is corrupt.
 */
export async function loadSessionPlan(workspaceRoot: string): Promise<ActiveSessionPlan | null> {
  try {
    const raw = await fs.readFile(planPath(workspaceRoot), 'utf-8');
    return JSON.parse(raw) as ActiveSessionPlan;
  } catch {
    return null;
  }
}

/**
 * Persists a session plan.
 * Creates `.agencee/session/` if it does not exist.
 */
export async function saveSessionPlan(
  workspaceRoot: string,
  plan: ActiveSessionPlan,
): Promise<void> {
  const target = planPath(workspaceRoot);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(plan, null, 2), 'utf-8');
}

/**
 * Deletes the active session plan.
 * Silently ignores ENOENT.
 */
export async function clearSessionPlan(workspaceRoot: string): Promise<void> {
  try {
    await fs.unlink(planPath(workspaceRoot));
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}
