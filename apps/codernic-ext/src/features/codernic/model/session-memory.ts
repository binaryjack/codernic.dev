import type * as vscode from 'vscode';
import type { CodernicMode } from './codernic-mode.types';

export type SessionEntry = {
  timestamp: number;
  summary: string;
  mode: CodernicMode;
};

const SESSION_KEY = 'codernic.sessions';
const MAX_SESSIONS = 10;

/** Load the most recent session entries from globalState. */
export function loadRecentSessions(
  context: Pick<vscode.ExtensionContext, 'globalState'>,
  max = 3,
): SessionEntry[] {
  const all = context.globalState.get<SessionEntry[]>(SESSION_KEY) ?? [];
  return [...all].sort((a, b) => b.timestamp - a.timestamp).slice(0, max);
}

/** Save a new session entry to globalState (ring buffer capped at MAX_SESSIONS). */
export async function saveSession(
  context: Pick<vscode.ExtensionContext, 'globalState'>,
  entry: SessionEntry,
): Promise<void> {
  const all = context.globalState.get<SessionEntry[]>(SESSION_KEY) ?? [];
  all.unshift(entry);
  if (all.length > MAX_SESSIONS) {
    all.length = MAX_SESSIONS;
  }
  await context.globalState.update(SESSION_KEY, all);
}
