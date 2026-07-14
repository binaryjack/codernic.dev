import * as fs from 'fs/promises';
import * as vscode from 'vscode';
import { callMcpTool } from '../../../../shared/mcp';
import { resolveDagFile, runDagStream } from '../../agent-mode/dag-runner';
import type { CodernicMode } from '../codernic-mode.types';
import { globalGalileusSessionId } from '../galileus-handler';
import type { CodernicIntent } from '../intent-detector';
import type { DagConfig } from '../types/dag-config.types';
import type { IntentHandler } from '../types/intent-handler.types';
import type { MessageContext } from '../types/message-context.types';
import { DagValidator } from '../validators/dag-validator';

export const RunDagIntent = function (this: IntentHandler): void {};

RunDagIntent.prototype.handle = async function (
  this: IntentHandler,
  intent: CodernicIntent,
  mode: CodernicMode,
  context: MessageContext,
  history?: { role: string; text: string }[],
  token?: vscode.CancellationToken,
): Promise<boolean> {
  const { workspaceRoot, reply, channel, extensionPath, mcpManager } = context;

  if (mode === 'plan') {
    const planText = `📋 **Plan Mode — Command Preview**\n\n**Detected command:** \`run-dag\`\n**Specification:** ${intent.spec || '(none)'}\n\n**What would happen in Agent mode:**\n1. Load DAG configuration from: ${intent.spec || 'Config folder/dag.json'}\n2. Execute multi-agent workflow\n3. Stream progress updates and results\n\n💡 **Switch to Agent mode** to execute commands.`;
    reply({ type: 'codernic:stream-chunk', payload: { chunk: planText, done: true } });
    return true;
  }

  const dagFile = await resolveDagFile(intent.spec, workspaceRoot);
  if (!dagFile) {
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: `❌ DAG file not found: ${intent.spec || '(unspecified)'}\n\nTry: \`/run-dag <name>\` where name matches a file in \`Config folder/\``,
        done: true,
      },
    });
    return true;
  }

  const enhancedHistory: { role: string; content: string }[] = history
    ? (history as unknown as { role: string; content: string }[])
    : [];

  try {
    const dagContentRaw = await fs.readFile(dagFile, 'utf8');
    const validator = new (DagValidator as any)();
    const dagContent = validator.validate(dagContentRaw) as DagConfig;

    if (dagContent.lanes && dagContent.lanes.length > 0) {
      const stepContexts = dagContent.lanes
        .map(
          (lane) => `
[STRICT PARADIGM ENFORCEMENT - Step: ${lane.id}]
Tu es l'exécutant machine de cette étape spécifique. Interdiction stricte de dévier de cette feuille de route :
- Agent: ${lane.agentFile}
- Capacités: ${JSON.stringify(lane.capabilities || [])}
- Dépendances : ${JSON.stringify(lane.dependsOn || [])}
- Invariants : Pas de .unwrap() or .expect(), intégration stricte des signatures définies.
`,
        )
        .join('\n');

      const ledgerPrompt = `
[STRUCTURED ARTIFACT LEDGER OBLIGATOIRE]
Dès que tes modifications de fichiers sont validées avec succès par le Kernel Rust, tu DOIS obligatoirement émettre un bloc markdown structuré au format exact suivant pour l'utilisateur :

### 📊 Bilan d'Exécution de la Lane
- **Statut** : Succès (Validé par Kernel Rust)
- **Fichiers Créés / Modifiés** :
  - \`[chemin/du/fichier_1]\` : [Description concise de l'implémentation réelle]
  - \`[chemin/du/fichier_2]\` : [Description concise de l'implémentation réelle]
- **Vérification** : [Statut des contraintes de compilation / signatures d'API]
`;

      enhancedHistory.push({
        role: 'system',
        content: stepContexts + '\n' + ledgerPrompt,
      });
    }
  } catch (err) {
    channel.appendLine(`[Codernic] Warning: Failed strict context injection: ${String(err)}`);
  }

  channel.appendLine(`[Codernic] Agent run-dag: ${dagFile}`);
  let runStarted = false;
  const cachedProgressForGalileus: unknown[] = [];

  const mcpClientInstance = mcpManager?.getClient() || undefined;

  await runDagStream(
    dagFile,
    workspaceRoot,
    extensionPath || '',
    async (event) => {
      if (event.type === 'run-start') {
        runStarted = true;

        // Force UI to switch to agent mode for visual DAG rendering
        reply({
          type: 'codernic:last-mode',
          payload: { mode: 'agent' },
        });

        reply({
          type: 'codernic:agent-run-started',
          payload: {
            dagName: event.dagName,
            runId: event.runId,
            lanes: (event as { laneIds: string[] }).laneIds.map((id: string) => ({
              id,
              status: 'pending',
              checkpoints: [],
              cost: 0,
            })),
            runningCostUSD: 0,
            startedAt: Date.now(),
            status: 'running',
          },
        });
      } else if (event.type === 'run-end') {
        reply({
          type: 'codernic:agent-run-complete',
          payload: {
            status: (event as { status: string }).status,
            durationMs: (event as { durationMs: number }).durationMs,
            totalCostUSD: (event as { totalCostUSD: number }).totalCostUSD,
          },
        });
      } else if (event.type === 'error') {
        reply({
          type: 'codernic:error',
          payload: { message: `DAG error: ${event.message}` },
        });
      } else if ((event as Record<string, unknown>).type === 'galileus:reset-state') {
        reply({
          type: 'galileus:state',
          payload: { sessions: [], queue: [], generated_at: Date.now() },
        } as any);
      } else if (event.type === 'agent_message') {
        reply({
          type: 'codernic:stream-chunk',
          payload: { chunk: (event as { content: string }).content, done: false },
        });
      } else if (event.type === 'tool-call') {
        reply({
          type: 'codernic:tool-call',
          payload: (event as { toolCall: unknown }).toolCall,
        });
      } else if (event.type === 'tool-executed') {
        reply({
          type: 'codernic:tool-executed',
          payload: (event as { toolCall: unknown }).toolCall,
        });
      } else if (event.type === 'codernic:await-approval') {
        reply({
          type: 'codernic:await-approval',
          payload: {
            id: (event as Record<string, unknown>).id,
            prompt: (event as Record<string, unknown>).prompt,
          },
        });
      } else {
        if (
          [
            'dag_initialized',
            'step_start',
            'step_retry',
            'step_success',
            'step_failed',
            'dag_mutation',
            'task_completed',
          ].includes(event.type)
        ) {
          reply({
            type: 'kernel_state_update',
            payload: event,
          });
        }

        reply({ type: 'codernic:agent-event', payload: event });
        cachedProgressForGalileus.push(event);
      }

      if (globalGalileusSessionId && mcpManager) {
        try {
          const mcpInstance = mcpManager.getClient();
          if (mcpInstance) {
            await callMcpTool(mcpInstance, {
              name: 'galileus_sync_telemetry',
              arguments: {
                session_id: globalGalileusSessionId,
                progress_json: JSON.stringify(cachedProgressForGalileus),
              },
            });
          }
        } catch {
          /* Ignore */
        }
      }
    },
    mcpClientInstance,
    {
      history: enhancedHistory as any,
      token,
      routeProfile: context.workspaceState?.get<string>('agencee.routeProfile')
    },
    channel,
  );

  if (!runStarted) {
    reply({
      type: 'codernic:error',
      payload: {
        message: 'DAG run failed to start. Check that the CLI is configured correctly.',
      },
    });
  }
  return true;
};
