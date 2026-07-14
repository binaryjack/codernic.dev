/** journey-handler.ts — BA conversation logic for Journey mode.
 *
 *  Loads the journey.xml meta-prompt (bundled default or user override),
 *  reads the codebase before asking the user anything, manages phase state,
 *  and detects the [PHASE_COMPLETE: N] signal to trigger the phase-gate UI.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { WORKSPACE_TOOLS, executeWorkspaceTool } from '../../../shared/api/workspace-tools';
import { ConfigPaths } from '../../../shared/utils/config-paths';
import type { JourneyPhase, JourneyState } from './journey-state';
import {
  PHASE_DESCRIPTIONS,
  PHASE_LABELS,
  advancePhase,
  completePhase,
  loadJourneyState,
  resetJourneyState,
  saveJourneyState,
} from './journey-state';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JourneyEvent =
  | { type: 'token'; chunk: string }
  | { type: 'thinking'; phase: string; detail?: string }
  | { type: 'phase-gate'; phase: number; summary: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export type JourneyChatOptions = {
  llmId: string;
  workspaceRoot: string;
  workspaceState: Pick<vscode.ExtensionContext['workspaceState'], 'get' | 'update'>;
  /** Extension install path — used to locate bundled media/journey.xml. */
  extensionPath: string;
  history: { role: string; text: string }[];
  onEvent: (event: JourneyEvent) => void;
  onLog: (line: string) => void;
};

// ─── Phase-gate signal ────────────────────────────────────────────────────────

const PHASE_COMPLETE_PATTERN = /\[PHASE_COMPLETE:\s*(\d)\]/;

// ─── Meta-prompt loading ──────────────────────────────────────────────────────

async function loadJourneyMetaPrompt(
  workspaceRoot: string,
  extensionPath: string,
): Promise<string> {
  // User override takes priority
  const userPath = ConfigPaths.resolveFile(workspaceRoot, path.join('config', 'codernic', 'rules', 'journey.xml'));
  if (userPath) {
    try {
      return await fs.readFile(userPath, 'utf-8');
    } catch {
      // Fall back to bundled default
    }
  }

  const bundledPath = path.join(extensionPath, 'media', 'journey.xml');
  try {
    return await fs.readFile(bundledPath, 'utf-8');
  } catch {
    // Absolute fallback — should never happen in packaged extension
    return `<journeyMetaPrompt><persona>You are a BA. Guide the user through 5 phases: Discovery, Architecture, Decomposition, Wiring, Validation. Read the codebase using workspace tools before asking questions. Emit [PHASE_COMPLETE: N] when each phase is done.</persona></journeyMetaPrompt>`;
  }
}

// ─── Initial codebase scan ────────────────────────────────────────────────────

async function buildCodebaseScanPreamble(workspaceRoot: string): Promise<string> {
  const lines: string[] = [];

  // Try to load analyse artefacts if they exist
  const techPath = ConfigPaths.resolveFile(workspaceRoot, path.join('config', 'intelligence', 'tech-registry.json'));
  if (techPath) {
    try {
      const tech = await fs.readFile(techPath, 'utf-8');
      lines.push(
        `[CODEBASE INTELLIGENCE — tech-registry.json already available]\n${tech.slice(0, 3000)}`,
      );
    } catch {
      lines.push('[NOTE: No tech-registry.json found — use workspace tools to discover the stack.]');
    }
  } else {
    lines.push('[NOTE: No tech-registry.json found — use workspace tools to discover the stack.]');
  }

  const readmePath = path.join(workspaceRoot, 'README.md');
  try {
    const readme = await fs.readFile(readmePath, 'utf-8');
    lines.push(`[README.md — first 300 lines]\n${readme.slice(0, 6000)}`);
  } catch {
    // no readme — that's fine
  }

  return lines.join('\n\n');
}

// ─── Resumption preamble ──────────────────────────────────────────────────────

function buildResumptionBlock(state: JourneyState): string {
  if (state.currentPhase === 1 && Object.keys(state.phases).length === 0) {
    return ''; // fresh session
  }

  const completedPhases = Object.entries(state.phases)
    .filter(([, record]) => record.completedAt)
    .map(([phaseNum, record]) => {
      const n = Number(phaseNum) as 1 | 2 | 3 | 4 | 5;
      return `Phase ${n} (${PHASE_LABELS[n]}): ${record.conversationSummary || 'completed'}`;
    });

  const current = state.currentPhase;
  const currentLabel =
    current === 'complete'
      ? 'Journey complete'
      : `${current} — ${PHASE_LABELS[current as 1 | 2 | 3 | 4 | 5]}: ${PHASE_DESCRIPTIONS[current as 1 | 2 | 3 | 4 | 5]}`;

  return `[JOURNEY RESUMPTION]\nCompleted phases:\n${completedPhases.join('\n')}\n\nCurrent phase: ${currentLabel}\n\nContinue from where we left off.`;
}

// ─── Main chat handler ────────────────────────────────────────────────────────

export async function handleJourneyChat(opts: JourneyChatOptions): Promise<void> {
  const { llmId, workspaceRoot, workspaceState, extensionPath, history, onEvent, onLog } = opts;

  const cts = new vscode.CancellationTokenSource();

  try {
    // Load current journey state
    const state = loadJourneyState(workspaceState);
    onLog(`[journey] phase=${state.currentPhase} startedAt=${state.startedAt}`);

    // Build system prompt
    const metaPrompt = await loadJourneyMetaPrompt(workspaceRoot, extensionPath);
    const codebasePreamble = await buildCodebaseScanPreamble(workspaceRoot);
    const resumptionBlock = buildResumptionBlock(state);

    const systemPrompt = [metaPrompt, codebasePreamble, resumptionBlock]
      .filter(Boolean)
      .join('\n\n---\n\n');

    const userText = history
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
      .join('\n');

    let fullResponse = '';

    onEvent({ type: 'thinking', phase: 'thinking' });

    // ── Custom / local model path ───────────────────────────────────────────
    // vscode.lm.selectChatModels() only surfaces GitHub Copilot models.
    // Any custom: (Ollama, OpenAI-compat, MCP-managed) model must go through
    // the LlmAdapter system via callLlm.
    if (llmId.startsWith('custom:')) {
      const { callLlm } = await import('./llm-runner');
      const result = await callLlm(
        llmId,
        systemPrompt,
        userText || 'Hello, let us start the journey.',
        workspaceRoot,
        (line: string) => onLog(line),
      );
      fullResponse = result.text;
      onEvent({ type: 'token', chunk: result.text });

    // ── GitHub Copilot path ─────────────────────────────────────────────────
    } else {
      const [model] = await vscode.lm.selectChatModels({ id: llmId });
      if (!model) {
        onEvent({ type: 'error', message: `Copilot model "${llmId}" not available. Try selecting a different model in the header.` });
        return;
      }

      // Build chat messages
      const chatMessages = [
        vscode.LanguageModelChatMessage.User(systemPrompt),
        ...history.map((h) =>
          h.role === 'user'
            ? vscode.LanguageModelChatMessage.User(h.text)
            : vscode.LanguageModelChatMessage.Assistant(h.text),
        ),
      ];

      const currentMessages = chatMessages;
      let loopCount = 0;
      const MAX_LOOPS = 5;

      while (loopCount < MAX_LOOPS) {
        loopCount++;

        if (loopCount > 1) {
          onEvent({ type: 'thinking', phase: 'reasoning' });
        }

        const response = await model.sendRequest(
          currentMessages,
          { tools: WORKSPACE_TOOLS },
          cts.token,
        );

        const assistantParts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolCallPart)[] =
          [];
        const toolCalls: vscode.LanguageModelToolCallPart[] = [];

        for await (const part of response.stream) {
          if (part instanceof vscode.LanguageModelTextPart) {
            fullResponse += part.value;
            assistantParts.push(part);
            onEvent({ type: 'token', chunk: part.value });
          } else if (part instanceof vscode.LanguageModelToolCallPart) {
            toolCalls.push(part);
            assistantParts.push(part);
          }
        }

        if (toolCalls.length === 0) break;

        // Execute tool calls
        currentMessages.push(vscode.LanguageModelChatMessage.Assistant(assistantParts));
        const toolResults: vscode.LanguageModelToolResultPart[] = [];

        for (const tc of toolCalls) {
          onLog(`[journey] tool: ${tc.name}(${JSON.stringify(tc.input).slice(0, 80)})`);
          const thinkPhase = /read_file|list_dir/.test(tc.name)
            ? 'reading'
            : /find_file|grep_project|search_workspace/.test(tc.name)
              ? 'searching'
              : 'considering';
          onEvent({
            type: 'thinking',
            phase: thinkPhase,
            detail: `${tc.name}(${JSON.stringify(tc.input).slice(0, 60)})`,
          });
          const result = await executeWorkspaceTool(
            tc.name,
            tc.input as Record<string, unknown>,
            workspaceRoot,
          );
          toolResults.push(
            new vscode.LanguageModelToolResultPart(tc.callId, [
              new vscode.LanguageModelTextPart(result),
            ]),
          );
        }

        currentMessages.push(vscode.LanguageModelChatMessage.User(toolResults));
      }
    }

    // ── Check for phase-gate signal ──────────────────────────────────────────
    const phaseMatch = fullResponse.match(PHASE_COMPLETE_PATTERN);
    if (phaseMatch) {
      const completedPhaseNum = Number(phaseMatch[1]) as 1 | 2 | 3 | 4 | 5;

      // Extract summary — text before [PHASE_COMPLETE: N] (trimmed)
      const summaryText = fullResponse.slice(0, fullResponse.indexOf(phaseMatch[0])).trim();

      // Persist the completed phase record
      const updatedState = completePhase(state, completedPhaseNum, {
        completedAt: new Date().toISOString(),
        gatheredFacts: {},
        conversationSummary: summaryText.slice(0, 1000), // cap summary size
      });
      await saveJourneyState(workspaceState, updatedState);
      onLog(`[journey] phase ${completedPhaseNum} completed`);

      // Emit phase-gate event — the UI will render the confirm button
      onEvent({ type: 'phase-gate', phase: completedPhaseNum, summary: summaryText });
    }

    onEvent({ type: 'done' });
  } catch (err) {
    onEvent({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  } finally {
    cts.dispose();
  }
}

// ─── Phase gate confirmation ─────────────────────────────────────────────────

/** Called when the user clicks the confirm button on a phase gate. Advances state. */
export async function confirmPhaseGate(
  workspaceState: Pick<vscode.ExtensionContext['workspaceState'], 'get' | 'update'>,
  onLog: (line: string) => void,
): Promise<JourneyPhase> {
  const state = loadJourneyState(workspaceState);
  const advanced = advancePhase(state);
  await saveJourneyState(workspaceState, advanced);
  onLog(`[journey] advanced to phase ${advanced.currentPhase}`);
  return advanced.currentPhase;
}

// ─── Journey reset ────────────────────────────────────────────────────────────

export async function handleJourneyReset(
  workspaceState: Pick<vscode.ExtensionContext['workspaceState'], 'update'>,
  onLog: (line: string) => void,
): Promise<void> {
  await resetJourneyState(workspaceState);
  onLog('[journey] state reset');
}
