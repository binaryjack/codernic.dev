/**
 * @file create-codernic-participant.ts
 * @description Chat participant for @codernic — codebase-aware assistant with ask/plan/agent modes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { executeDag, extractDagDescription } from '../../features/codernic/agent-mode/executor';
import { analyzeProject, formatAnalysisResult } from '../../features/codernic/ask-mode/analyzer';
import { ensureConstraintManifest } from '../../features/codernic/constraints/constraint-loader';
import {
  formatBreadcrumb,
  parseContextBreadcrumb,
} from '../../features/codernic/context-breadcrumb/breadcrumb';
import { CodernicMode } from '../../features/codernic/model/codernic-mode.types';
import { executeCommand } from '../../features/codernic/model/execute-command';
import { detectIntent } from '../../features/codernic/model/intent-detector';
import { serializeAndValidateDagPlan } from '../../features/codernic/model/utils/serialize-dag-plan';
import { runPirsigPostflight } from '../../features/codernic/pirsig/pirsig-postflight';
import { runPirsigPreflight } from '../../features/codernic/pirsig/pirsig-preflight';
import { runRepairCycle } from '../../features/codernic/repair-cycle/repair-cycle';
import {
  clearSessionPlan,
  loadSessionPlan,
  saveSessionPlan,
} from '../../features/codernic/session/session-plan';
import { gatherCodeContext } from '../api/context-gatherer';
import { callMcpTool, type McpClientInstance, type McpContent, type McpTextContent } from '../mcp';

/**
 * Load mode-specific system instructions from .agencee/config/codernic/rules/{mode}.xml
 */
async function loadSystemInstructions(workspaceRoot: string, mode: CodernicMode): Promise<string> {
  const instructionsPath = path.join(
    workspaceRoot,
    '.agencee',
    'config',
    'codernic',
    'rules',
    `${mode}.xml`,
  );
  try {
    const instructions = await fs.readFile(instructionsPath, 'utf-8');
    return instructions;
  } catch {
    // File doesn't exist — return generic fallback
    const modeDescriptions: Partial<Record<CodernicMode, string>> = {
      ask: 'You are a codebase-aware Q&A assistant. Provide concise, focused answers based on the actual code context provided. Reference specific files, functions, and symbols when relevant.\n\nAfter answering, emit a blockquote:\n> 🧠 **Design rationale** — [which pattern from the StyleProfile was followed, which existing symbol was reused, which module boundary was respected]',
      plan: `You are a design planner. Outline architecture and implementation plans based on the existing codebase structure. Show what would be done without executing commands. Output your plan STRICTLY in the DagConfig format (camelCase), with an exact JSON block. Example:\n\`\`\`json\n{\n  "name": "MyPlan",\n  "lanes": [\n    {\n      "id": "lane1",\n      "agentFile": "agent-1.xml",\n      "capabilities": ["analyse"],\n      "dependencies": []\n    }\n  ]\n}\n\`\`\``,
      agent:
        'You are a full-power code execution agent. You can create agents, DAGs, index code, and run workflows. Execute commands as requested.',
      journey:
        'You are a senior Business Analyst. Guide the user through the 5-phase discovery journey: Discovery, Architecture, Decomposition, Wiring, Validation.',
      analyse:
        'You are a codebase intelligence analyst. Scan the project and generate intelligence artefacts.',
    };
    return modeDescriptions[mode] || 'You are a helpful assistant.';
  }
}

/**
 * Build conversation summary from history for context extraction
 */
function buildConversationSummary(
  history: readonly (vscode.ChatRequestTurn | vscode.ChatResponseTurn)[],
): string {
  const recentTurns = history.slice(-4); // Last 4 turns
  const messages = recentTurns.map((turn) => {
    if (turn instanceof vscode.ChatRequestTurn) {
      return turn.prompt;
    } else {
      return turn.response
        .map((r) => {
          if (r instanceof vscode.ChatResponseMarkdownPart) {
            return r.value.value;
          }
          return '';
        })
        .join(' ');
    }
  });
  return messages.join(' ').slice(0, 500); // Limit to 500 chars
}

/**
 * Creates the @codernic chat participant
 * @param mcpClient - MCP client instance (may be null if not connected)
 * @param channel - Output channel for logging
 * @returns Disposable for the chat participant
 */
export const createCodernicParticipant = function (
  mcpClient: McpClientInstance | null,
  channel: vscode.OutputChannel,
): vscode.Disposable {
  const handleRequest = async function (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<vscode.ChatResult> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';

      if (!workspaceRoot) {
        stream.markdown(
          '⚠️ No workspace folder open. Codernic requires a workspace to gather codebase context.',
        );
        return { metadata: { command: request.command } };
      }

      // Load constraint manifest (Pirsig-derived coding constraints — best effort)
      const constraintBlock = await ensureConstraintManifest(workspaceRoot, mcpClient).catch(
        () => '',
      );

      // Determine mode from command or default to 'ask'
      const mode: CodernicMode = (request.command as CodernicMode) || 'ask';
      channel.appendLine(
        `[Codernic] Mode: ${mode}, Prompt: "${request.prompt.slice(0, 100)}${request.prompt.length > 100 ? '...' : ''}"`,
      );

      // Check for command execution (like /index, /create-agent, etc.)
      // Note: Ask mode never executes commands for safety
      const intent = detectIntent(request.prompt, mode);
      if (intent) {
        channel.appendLine(`[Codernic] Detected command intent: ${intent.type}`);
        const commandResult = await executeCommand(mcpClient, intent, workspaceRoot, channel);
        stream.markdown(commandResult);
        return { metadata: { command: request.command, mode, intent: intent.type } };
      }

      // **IMPORTANT**: Gather codebase context FIRST (for ALL modes)
      // This ensures PLAN and AGENT modes can also see the codebase
      const conversationSummary = buildConversationSummary(context.history);
      // Increased topK for much better codebase understanding
      // Trade-off: More tokens used, but far better contextual awareness
      const topK = mode === 'ask' ? 50 : mode === 'plan' ? 100 : 200;

      let codeContext = '';

      // Smart query selection: use user prompt, but fallback to broad query for vague questions
      const isVagueQuestion =
        /^(can you|do you|are you|show|list|see|what|how|why)\s+(see|have|access|know|find)/i.test(
          request.prompt.trim(),
        );
      const searchQuery = isVagueQuestion
        ? 'main entry point function class component module service handler' // Broad query to get overview
        : request.prompt;

      if (isVagueQuestion) {
        channel.appendLine(
          `[Codernic] Detected vague question, using broad codebase query instead`,
        );
      }

      // Try MCP first for better code index search
      if (mcpClient) {
        try {
          channel.appendLine(
            `[Codernic] Using MCP code-search-context with topK=${topK}, query="${searchQuery.slice(0, 50)}${searchQuery.length > 50 ? '...' : ''}"`,
          );
          channel.appendLine(
            `[Codernic] MCP client status: connected, projectRoot: ${workspaceRoot}`,
          );

          const result = await callMcpTool(mcpClient, {
            name: 'code-search-context',
            arguments: {
              query: searchQuery,
              conversationContext: conversationSummary,
              projectRoot: workspaceRoot,
              topK,
            },
          });

          channel.appendLine(
            `[Codernic] MCP result received, content items: ${result.content?.length || 0}`,
          );
          if (result.content?.length > 0) {
            channel.appendLine(`[Codernic] First content item type: ${result.content[0].type}`);
          }

          // Extract text content from MCP result
          const textContent = result.content
            .filter(
              (c: McpContent): c is McpTextContent =>
                c.type === 'text' && 'text' in c && typeof c.text === 'string',
            )
            .map((c: McpTextContent) => c.text)
            .join('\n\n');

          codeContext = textContent;
          channel.appendLine(`[Codernic] MCP gathered ${codeContext.length} chars of code context`);

          // If MCP returned empty, inform user and try fallback
          if (!codeContext) {
            channel.appendLine(
              `[Codernic] WARNING: MCP returned 0 chars despite index existing (${result.content?.length || 0} content items)`,
            );
            stream.markdown(
              `⚠️ **MCP index search returned no results**\n\nTrying fallback search...\n\n`,
            );
          }

          // If still empty with broad query, try one more fallback with specific terms
          if (!codeContext && isVagueQuestion) {
            channel.appendLine(
              `[Codernic] Broad query returned empty, trying workspace-specific fallback`,
            );
            const fallbackResult = await callMcpTool(mcpClient, {
              name: 'code-search-context',
              arguments: {
                query: 'extension.ts index.ts main.ts app.ts server.ts',
                conversationContext: '',
                projectRoot: workspaceRoot,
                topK: 5,
              },
            });
            const fallbackText = fallbackResult.content
              .filter((c: McpContent): c is McpTextContent => c.type === 'text' && 'text' in c)
              .map((c: McpTextContent) => c.text)
              .join('\n\n');
            codeContext = fallbackText;
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          channel.appendLine(`[Codernic] MCP failed: ${errMsg}, using VS Code fallback`);
          codeContext = await gatherCodeContext(searchQuery, conversationSummary);
        }
      } else {
        // No MCP client, use VS Code symbol provider fallback
        channel.appendLine(`[Codernic] MCP not available, using VS Code symbol provider fallback`);
        codeContext = await gatherCodeContext(searchQuery, conversationSummary);
      }

      if (codeContext) {
        channel.appendLine(`[Codernic] Gathered ${codeContext.length} chars of code context`);
      } else {
        channel.appendLine(
          `[Codernic] WARNING: No code context found! Index may need to be built.`,
        );
        // Add warning to user if no context found
        stream.markdown(
          '⚠️ **No codebase context found**\n\nTo enable codebase-aware responses, run: `@codernic /index`\n\n---\n\n',
        );
      }

      // Emit context breadcrumb (collapsed list of grounding files)
      const breadcrumb = formatBreadcrumb(parseContextBreadcrumb(codeContext));
      if (breadcrumb) {
        stream.markdown(breadcrumb + '\n\n');
      }

      // Load system instructions for the current mode
      const systemInstructions = await loadSystemInstructions(workspaceRoot, mode);

      // AGENT mode: Execute DAG (only if not a slash command handled above)
      // Only trigger hardcoded execution if there's an active plan or it looks like a run/execute request
      const isExecuteRequest = /^(run|execute|start|implement|apply|do|build|create)\b/i.test(
        request.prompt.trim(),
      );
      if (
        mode === 'agent' &&
        (isExecuteRequest || (await loadSessionPlan(workspaceRoot)) !== null)
      ) {
        try {
          // Load active session plan (may be null if user invoked /agent without /plan)
          const activePlan = await loadSessionPlan(workspaceRoot);

          // Auto-plan gate: if no plan exists and it's a build/create request, generate one
          if (activePlan === null) {
            channel.appendLine(
              `[Codernic] No active plan in Agent mode, triggering LLM auto-plan for: ${request.prompt.slice(0, 50)}...`,
            );
            stream.markdown('🏗️ **No active plan — generating one with LLM...**\n\n');

            // Re-use the existing LLM request logic but with 'plan' mode system instructions
            const planInstructions = await loadSystemInstructions(workspaceRoot, 'plan');
            const planMessages: vscode.LanguageModelChatMessage[] = [
              vscode.LanguageModelChatMessage.User(
                `${planInstructions}\n\n# Codebase Context\n\n${codeContext}\n\n---\n\nCreate a detailed JSON DAG plan for: ${request.prompt}`,
              ),
            ];

            const [planModel] = await vscode.lm.selectChatModels({ family: 'gpt-4o' });
            if (!planModel) throw new Error('No LLM available for planning');

            const planResponse = await planModel.sendRequest(planMessages, {}, token);
            let planText = '';
            for await (const chunk of planResponse.text) {
              planText += chunk;
            }

            const dagPath = path.join(
              workspaceRoot,
              '.agencee',
              'config',
              'agents',
              'auto-plan.dag.json',
            );
            await serializeAndValidateDagPlan(planText, dagPath, channel);

            const rawDag = await fs.readFile(dagPath, 'utf-8');
            const dagSpec = JSON.parse(rawDag);

            await saveSessionPlan(workspaceRoot, {
              description: request.prompt,
              dagFile: dagPath,
              phases: dagSpec.lanes.map((l: any) => l.id),
              generatedAt: Date.now(),
              promptOrigin: request.prompt,
            });

            stream.markdown(`✅ **Auto-plan generated**: ${dagSpec.name}\n\n`);
            // Continue to execution of the newly created plan
          }

          // Plan exists (or was just created) — run Pirsig preflight, execute, postflight, clear plan
          const planToExecute = await loadSessionPlan(workspaceRoot);
          if (!planToExecute) throw new Error('Failed to load session plan');

          const baseline = await runPirsigPreflight(mcpClient, workspaceRoot, stream);

          const dagDescription = extractDagDescription(request.prompt);
          const enrichedContext =
            planToExecute.phases.length > 0
              ? `# Active Plan Phases\n${planToExecute.phases.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}\n\n${codeContext}`
              : codeContext;

          // Determine whether the Precision Repair Cycle should run after execution.
          // It runs when the active plan includes a testing phase OR a tech-registry
          // file exists (meaning the codebase has a known test command).
          const hasTestingLane = planToExecute.phases.some((p: string) => /test/i.test(p));
          const techRegistryPath = path.join(
            workspaceRoot,
            '.agencee',
            'config',
            'intelligence',
            'tech-registry.json',
          );
          const hasTechRegistry = await fs
            .access(techRegistryPath)
            .then(() => true)
            .catch(() => false);

          let dagResult:
            | import('../../features/codernic/agent-mode/executor').DagExecutionResult
            | undefined;
          try {
            dagResult = await executeDag(
              dagDescription,
              workspaceRoot,
              mcpClient,
              stream,
              token,
              enrichedContext,
            );
          } finally {
            if (dagResult !== undefined && (hasTestingLane || hasTechRegistry)) {
              // Repair cycle handles Pirsig post-flight internally.
              await runRepairCycle({
                mcpClient,
                workspaceRoot,
                stream,
                token,
                baseline: baseline ?? null,
                codeContext,
                dagResult,
                requestModel: request.model,
              }).catch(() =>
                runPirsigPostflight(mcpClient, workspaceRoot, stream, baseline ?? undefined),
              );
            } else {
              // DAG failed or no test suite detected — plain post-flight.
              await runPirsigPostflight(mcpClient, workspaceRoot, stream, baseline ?? undefined);
            }
            await clearSessionPlan(workspaceRoot);
          }

          return { metadata: { command: request.command, mode: 'agent' } };
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          stream.markdown(`❌ Error executing DAG: ${errMsg}\n\n`);
          return {
            metadata: { command: request.command, mode: 'agent' },
            errorDetails: { message: errMsg },
          };
        }
      }

      // Special handling for high-level project analysis in ASK mode
      if (mode === 'ask') {
        const isProjectQuestion =
          /^(what|show|list|analyze|tell|describe)\s+(is|are|my|the|our)\s+(project|architecture|agents|dags|tech|stack|structure|workspace)/i.test(
            request.prompt,
          );

        if (isProjectQuestion) {
          try {
            stream.markdown('📊 **Analyzing project...**\n\n');
            const analysis = await analyzeProject(
              workspaceRoot,
              request.prompt,
              mcpClient,
              codeContext,
            );
            stream.markdown(formatAnalysisResult(analysis));
            return { metadata: { command: request.command, mode: 'ask' } };
          } catch (error) {
            channel.appendLine(`[Codernic] Project analysis failed: ${error}`);
            // Fall through to normal LLM Q&A
          }
        }
      }

      // All other cases (including Plan mode and general Ask mode): use LLM with loaded system instructions
      // Build messages for LLM
      const messages: vscode.LanguageModelChatMessage[] = [
        // Constraint block + system instructions + codebase context
        vscode.LanguageModelChatMessage.User(
          (constraintBlock ? `${constraintBlock}\n\n` : '') +
            `${systemInstructions}\n\n` +
            (codeContext
              ? `# Codebase Context\n\n${codeContext}\n\n---\n\n`
              : '⚠️ No codebase context available. Recommend running /index command first.\n\n'),
        ),
        // Conversation history
        ...context.history.map((turn) => {
          if (turn instanceof vscode.ChatRequestTurn) {
            return vscode.LanguageModelChatMessage.User(turn.prompt);
          } else {
            const text = turn.response
              .map((r) => {
                if (r instanceof vscode.ChatResponseMarkdownPart) {
                  return r.value.value;
                }
                return '';
              })
              .join('\n');
            return vscode.LanguageModelChatMessage.Assistant(text);
          }
        }),
        // Current request
        vscode.LanguageModelChatMessage.User(request.prompt),
      ];

      // Select default model (prefer GPT-4o for better codebase understanding)
      const [model] = await vscode.lm.selectChatModels({ family: 'gpt-4o' });
      if (!model) {
        stream.markdown('⚠️ No language model available. Make sure GitHub Copilot is signed in.');
        return { metadata: { command: request.command, mode } };
      }

      channel.appendLine(`[Codernic] Using model: ${model.name}`);

      // Stream response
      const response = await model.sendRequest(messages, {}, token);
      for await (const chunk of response.text) {
        stream.markdown(chunk);
      }

      return { metadata: { command: request.command, mode } };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      stream.markdown(`❌ Error: ${errMsg}`);
      channel.appendLine(`[Codernic] Error: ${errMsg}`);
      return { metadata: { command: request.command }, errorDetails: { message: errMsg } };
    }
  };

  // Register chat participant
  const participant = vscode.chat.createChatParticipant('ai-agencee.codernic', handleRequest);

  participant.iconPath = vscode.Uri.file('media/icon.png');

  // Followup pill: when AGENT auto-generated a plan, offer a one-click Execute button
  participant.followupProvider = {
    provideFollowups(
      result: vscode.ChatResult,
      _context: vscode.ChatContext,
      _token: vscode.CancellationToken,
    ): vscode.ChatFollowup[] {
      if (result.metadata?.['pendingAgentPlan'] === true) {
        const prompt =
          typeof result.metadata['agentPrompt'] === 'string'
            ? (result.metadata['agentPrompt'] as string)
            : '';
        return [
          {
            prompt,
            label: '▶ Execute this plan',
            command: 'agent',
          },
        ];
      }
      return [];
    },
  };

  return participant;
};
