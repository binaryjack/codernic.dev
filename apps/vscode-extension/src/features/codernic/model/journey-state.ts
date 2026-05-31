/** Journey state — tracks the 5-phase BA discovery conversation.
 *  Persisted via vscode.ExtensionContext.workspaceState so it survives panel reopens.
 */

import type * as vscode from 'vscode';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JourneyPhase = 1 | 2 | 3 | 4 | 5 | 'complete';

export type PhaseRecord = {
  /** ISO timestamp when the phase was confirmed by the user. */
  completedAt?: string;
  /** Key facts gathered by the BA agent during this phase. */
  gatheredFacts: Record<string, unknown>;
  /** The BA's own summary of what was learned in this phase (used to resume cleanly). */
  conversationSummary: string;
};

export type JourneyState = {
  schemaVersion: 1;
  startedAt: string;
  currentPhase: JourneyPhase;
  phases: Partial<Record<1 | 2 | 3 | 4 | 5, PhaseRecord>>;
  outputPaths: {
    techRegistryPath?: string;
    agents: string[];
    dagPath?: string;
    conventionsPath?: string;
  };
};

// ─── Storage key ─────────────────────────────────────────────────────────────

const JOURNEY_KEY = 'codernic.journey';

// ─── Default factory ─────────────────────────────────────────────────────────

function blankJourneyState(): JourneyState {
  return {
    schemaVersion: 1,
    startedAt: new Date().toISOString(),
    currentPhase: 1,
    phases: {},
    outputPaths: { agents: [] },
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

/** Load the in-progress journey from workspaceState. Returns a fresh state if none exists. */
export function loadJourneyState(
  workspaceState: Pick<vscode.ExtensionContext['workspaceState'], 'get'>,
): JourneyState {
  return workspaceState.get<JourneyState>(JOURNEY_KEY) ?? blankJourneyState();
}

/** Persist the journey state to workspaceState. */
export async function saveJourneyState(
  workspaceState: Pick<vscode.ExtensionContext['workspaceState'], 'update'>,
  state: JourneyState,
): Promise<void> {
  await workspaceState.update(JOURNEY_KEY, state);
}

/** Wipe the journey state (used by /journey reset). */
export async function resetJourneyState(
  workspaceState: Pick<vscode.ExtensionContext['workspaceState'], 'update'>,
): Promise<void> {
  await workspaceState.update(JOURNEY_KEY, undefined);
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

/** Advance to the next phase (called when user clicks the confirm gate). */
export function advancePhase(state: JourneyState): JourneyState {
  const current = state.currentPhase;
  if (current === 'complete') return state;
  const next: JourneyPhase = current < 5 ? ((current + 1) as 1 | 2 | 3 | 4 | 5) : 'complete';
  return { ...state, currentPhase: next };
}

/** Record the BA summary + facts for the current phase and mark it complete. */
export function completePhase(
  state: JourneyState,
  phase: 1 | 2 | 3 | 4 | 5,
  record: PhaseRecord,
): JourneyState {
  return {
    ...state,
    phases: {
      ...state.phases,
      [phase]: { ...record, completedAt: record.completedAt ?? new Date().toISOString() },
    },
  };
}

// ─── Phase labels (UI use) ────────────────────────────────────────────────────

export const PHASE_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Discovery',
  2: 'Architecture',
  3: 'Decomposition',
  4: 'Wiring',
  5: 'Validation',
};

export const PHASE_DESCRIPTIONS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Understand the project — goals, constraints, stakeholders',
  2: 'Map the technical landscape — stack, patterns, integrations',
  3: 'Break work into stories, lanes, and agent responsibilities',
  4: 'Connect agents, define DAG topology and data flows',
  5: 'Review the plan, identify risks, confirm readiness',
};
