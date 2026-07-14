import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { LlmAdapter, LlmAdapterFactory } from '../../features/codernic/model/adapters';
import { LlmConfigRepository } from '../../features/codernic/model/llm-repository';
import { ConfigPaths } from '../utils/config-paths';
import type { TechEntry, TechRuleFileData } from '../../features/tech-catalog/model/tech-store';
import { readTechs } from '../../features/tech-catalog/model/tech-store';
import { WORKSPACE_TOOLS, executeWorkspaceTool } from './workspace-tools';

export type AcMsg = { type: string; payload?: unknown };

/** Cheapness tier — lower = cheaper. Used to sort models so the cheapest
 *  is first in the list and gets auto-selected by default. */
export const cheapnessRank = (name: string): number => {
  const n = name.toLowerCase();
  if (/mini|haiku|flash|nano/.test(n)) return 0;
  if (/small|lite|turbo/.test(n)) return 1;
  return 2;
};

/** Broadcast a fresh LLM list to the AC webview. Called on mount and whenever
 *  vscode.lm.onDidChangeChatModels fires. */
export const validateRouteFiles = async (
  reply: (r: AcMsg) => void,
  workspaceRoot: string,
  configuredModelIds: Set<string>,
): Promise<void> => {
  const engineConfig = ConfigPaths.getEngineConfig();
  const configDir = engineConfig.systemPaths.system_providers_dir;
  try {
    const files = await fs.readdir(configDir);
    const routeFiles = files.filter((f) => f.endsWith('.route.json') || f === 'routes.json');
    for (const file of routeFiles) {
      try {
        const content = await fs.readFile(path.join(configDir, file), 'utf-8');
        const data = JSON.parse(content);
        for (const [purpose, config] of Object.entries(data)) {
          if (config && typeof config === 'object') {
            const cfg = config as { model?: string; models?: string[]; provider?: string };
            const modelIds: string[] = [];
            if (cfg.model) modelIds.push(cfg.model);
            if (Array.isArray(cfg.models)) modelIds.push(...cfg.models);
            
            for (const modelId of modelIds) {
              if (modelId === 'unknown') continue;
              if (!configuredModelIds.has(modelId)) {
                reply({
                  type: 'codernic:system-log-batch',
                  payload: [
                    {
                      message: `[DAEMON ERROR/WARN] Validation Warning in ${file} for purpose '${purpose}': Model '${modelId}' is not configured in any provider file (or is not logged into Copilot).`,
                      timestamp: new Date().toISOString()
                    }
                  ]
                });
              }
            }
          }
        }
      } catch {
        // Skip malformed files
      }
    }
  } catch {
    // Skip
  }
};

export const broadcastRouteProfiles = async (
  reply: (r: AcMsg) => void,
  workspaceRoot?: string,
): Promise<void> => {
  try {
    const profiles: { value: string; label: string; models: string[] }[] = [];
    
    // Add GitHub Copilot as a built-in provider if available
    let copilotModels: string[] = [];
    try {
      const allModels = await vscode.lm.selectChatModels();
      copilotModels = allModels
        .filter((m) => m.vendor === 'copilot' || m.id.startsWith('copilot') || m.id.includes('copilot'))
        .map((m) => m.id);
    } catch {
      // Ignore
    }

    profiles.push({
      value: 'github_copilot',
      label: 'GitHub Copilot',
      models: copilotModels,
    });

    const providers = await LlmConfigRepository.loadAllProviders(workspaceRoot);
    for (const p of providers) {
      profiles.push({
        value: p.id,
        label: p.name,
        models: p.models.map((m) => m.id),
      });
    }
    
    // Ensure we have a default entry if not found
    if (!profiles.some(p => p.value === 'default')) {
      profiles.push({ value: 'default', label: 'Default', models: [] });
    }
    
    import('fs').then(fs => fs.appendFileSync('/tmp/llm-debug.log', `broadcastRouteProfiles sending ${profiles.length} profiles: ${JSON.stringify(profiles)}\\n`));

    reply({
      type: 'ac:route-profiles',
      payload: profiles,
    });
  } catch {
    reply({ type: 'ac:route-profiles', payload: [{ value: 'default', label: 'Default', models: [] }] });
  }
};

/** Broadcast a fresh LLM list to the AC webview. Called on mount and whenever
 *  vscode.lm.onDidChangeChatModels fires. */
export const broadcastLlms = async (
  reply: (r: AcMsg) => void,
  context?: vscode.ExtensionContext,
  workspaceRoot?: string,
): Promise<void> => {
  try {
    const allModels = await vscode.lm.selectChatModels();
    const preferLocal =
      vscode.workspace.getConfiguration('ai-agencee').get<boolean>('preferLocalModels') ?? false;
    const models = preferLocal
      ? allModels.filter((m) => m.vendor === 'copilot' || m.id.startsWith('copilot'))
      : allModels;
    const sorted = [...models].sort((a, b) => cheapnessRank(a.name) - cheapnessRank(b.name));
    
    const configuredModelIds = new Set<string>();
    
    const copilotOptions = sorted.map((m) => {
      configuredModelIds.add(m.id);
      return {
        value: m.id,
        label: m.name,
        group: 'GitHub Copilot',
      };
    });

    const customOptions: { value: string; label: string; group: string }[] = [];
    const providers = await LlmConfigRepository.loadAllProviders(workspaceRoot);
    for (const p of providers) {
      for (const m of p.models) {
        const finalId = m.id.startsWith('custom:') ? m.id : `custom:${p.id}:${m.id}`;
        customOptions.push({
          value: finalId,
          label: m.name || m.id,
          group: p.name,
        });
        configuredModelIds.add(m.id);
      }
    }

    const combinedOptions = [...copilotOptions, ...customOptions];
    const uniqueOptions = Array.from(new Map(combinedOptions.map(opt => [opt.value, opt])).values());
    import('fs').then(fs => fs.appendFileSync('/tmp/llm-debug.log', `broadcastLlms sending ${uniqueOptions.length} models: ${JSON.stringify(uniqueOptions)}\\n`));

    reply({
      type: 'ac:llms',
      payload: uniqueOptions,
    });

    if (workspaceRoot) {
      await validateRouteFiles(reply, workspaceRoot, configuredModelIds);
    }
  } catch {
    reply({ type: 'ac:llms', payload: [] });
  }
};

/** Resolve the correct LlmAdapter for a given llmId.
 *  Handles GitHub Copilot models, custom fetch providers (OpenAI-compat / Ollama),
 *  and local MCP inference models (llama.cpp / Ollama managed).
 *  Extracted from streamChat so journey-handler and other consumers can reuse it. */
export async function resolveAdapter(
  llmId: string,
  workspaceRoot: string,
  context?: vscode.ExtensionContext,
  mcpManager?: import('../mcp').McpConnectionManager,
): Promise<LlmAdapter> {
  if (llmId.startsWith('custom:')) {
    const parts = llmId.split(':');
    const providerId = parts[1];
    const modelId = parts.slice(2).join(':');
    const providers = await LlmConfigRepository.loadAllProviders(workspaceRoot);
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    if (provider.type === 'openai-compatible' || provider.type === 'local-ollama' || provider.type === 'cloud-openai' || provider.type === 'cloud-anthropic' || provider.type === 'cloud-google') {
       if (context && !provider.parameters?.apiKey && !provider.apiKey) {
          const secretKey = await context.secrets.get(`agencee.provider.${providerId}.key`);
          if (secretKey) {
              provider.parameters = { ...provider.parameters, apiKey: secretKey };
              provider.apiKey = secretKey;
          }
       }
    }
    
    return LlmAdapterFactory.createAdapter(llmId, provider.type, modelId, provider, mcpManager, workspaceRoot);
  }
  return LlmAdapterFactory.createAdapter(llmId, 'copilot', undefined, undefined, undefined, workspaceRoot);
}

/** Stream a chat request to the selected LLM with workspace tool support.
 *  If the model supports function calling, provides workspace tools for dynamic context gathering.
 *  Falls back to legacy context injection for models without tool support.
 *  Pass `tools` to override the default WORKSPACE_TOOLS (e.g. AGENT_TOOLS in agent mode).
 *  CancellationTokenSource is always disposed in finally. */
export const streamChat = async (
  msg: AcMsg,
  reply: (r: AcMsg) => void,
  workspaceRoot?: string,
  tools?: vscode.LanguageModelChatTool[],
  context?: vscode.ExtensionContext,
  channel?: vscode.OutputChannel,
  externalCts?: vscode.CancellationTokenSource,
  mcpManager?: import('../mcp').McpConnectionManager,
): Promise<void> => {
  const data = msg.payload as {
    llmId: string;
    history: { role: string; text: string }[];
    systemContext?: string;
    contextFiles?: { filePath: string; fileName: string; lines?: [number, number] }[];
  };
  if (channel) {
    channel.appendLine(`[CODERNIC INTERACTION] Initializing streamChat for intent: ${msg.type}`);
  }

  const cts = externalCts ?? new vscode.CancellationTokenSource();
  try {
    let adapter: LlmAdapter;

    // Get workspace root for tool execution
    const root = workspaceRoot ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    if (!root) {
      console.warn('[streamChat] No workspace root available - tools disabled');
    }

    // Check if it's a custom model
    if (data.llmId.startsWith('custom:')) {
      const parts = data.llmId.split(':');
      const providerId = parts[1];
      const modelId = parts.slice(2).join(':');

      const providers = await LlmConfigRepository.loadAllProviders(root);
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) throw new Error(`Provider ${providerId} not found`);

      if (provider.type === 'openai-compatible' || provider.type === 'local-ollama' || provider.type === 'cloud-openai' || provider.type === 'cloud-anthropic' || provider.type === 'cloud-google') {
         if (context && !provider.parameters?.apiKey && !provider.apiKey) {
            const secretKey = await context.secrets.get(`agencee.provider.${providerId}.key`);
            if (secretKey) {
                provider.parameters = { ...provider.parameters, apiKey: secretKey };
                provider.apiKey = secretKey;
            }
         }
      }

      adapter = LlmAdapterFactory.createAdapter(data.llmId, provider.type, modelId, provider, mcpManager, root);
    } else {
      adapter = LlmAdapterFactory.createAdapter(data.llmId, 'copilot', undefined, undefined, undefined, root);
    }

    const activeTools = tools ?? WORKSPACE_TOOLS;

    let injectedContext = '';
    if (data.contextFiles && data.contextFiles.length > 0) {
      for (const file of data.contextFiles) {
        try {
          const uri = vscode.Uri.file(file.filePath);
          const bytes = await vscode.workspace.fs.readFile(uri);
          let content = new TextDecoder().decode(bytes);

          if (file.lines) {
            const lines = content.split('\n');
            content = lines.slice(file.lines[0] - 1, file.lines[1]).join('\n');
          }

          injectedContext += `\n--- FILE: ${file.filePath} ---\n${content}\n---\n`;
        } catch (err) {
          channel?.appendLine(`[LLM-UTILS] Error reading context file ${file.filePath}: ${err}`);
        }
      }
    }

    let chatMessages = [
      ...(data.systemContext
        ? [
            {
              role: 'system',
              content:
                data.systemContext +
                (injectedContext ? `\n\nUser provided context files:\n${injectedContext}` : ''),
            },
          ]
        : []),
      ...data.history.map((h) => ({ role: h.role, content: h.text })),
    ];

    if (!data.systemContext) {
      const hasWriteTools = activeTools.some((t) => t.name === 'write_file');
      const toolList = activeTools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
      const toolPrompt = hasWriteTools
        ? `You are Codernic operating in AGENT mode. You have full read AND write access to the workspace:\n${toolList}\n\n${injectedContext ? `User provided context files:\n${injectedContext}\n\n` : ''}You MUST use write_file and create_directory to actually create files, and run_terminal to run commands. Do not just describe what to do — do it.`
        : `You are Codernic, a VS Code codebase assistant. You have access to workspace tools:\n${toolList}\n\n${injectedContext ? `User provided context files:\n${injectedContext}\n\n` : ''}Use these tools to explore the codebase before answering questions. Always verify code exists before suggesting changes.`;

      chatMessages = [{ role: 'system', content: toolPrompt }, ...chatMessages];
    }

    // Estimate tokens and broadcast telemetry to update Context Window UI
    const totalChars = chatMessages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    const maxTokens = 128000; // Default fallback
    const usagePercent = Math.min(100, Math.round((estimatedTokens / maxTokens) * 100));

    reply({
      type: 'codernic:context-window-update',
      payload: {
        currentTokens: estimatedTokens,
        maxTokens,
        usagePercent,
        costEstimate: 0,
        lastUpdated: new Date().toISOString(),
        turnCount: data.history.length / 2,
        optimizedTurnCount: data.history.length / 2,
        removedTurnsCount: 0,
        compressionRatio: 1,
        atCapacity: usagePercent > 90,
        statusMessage: usagePercent > 90 ? 'Near Capacity' : 'Healthy',
        recommendations: usagePercent > 90 ? ['Consider clearing history'] : [],
      },
    });

    reply({ type: 'codernic:thinking', payload: { phase: 'thinking' } });

    await adapter.streamChat(
      chatMessages,
      { tools: activeTools },
      (event) => {
        if (event.type === 'token') {
          reply({ type: 'ac:chat-token', payload: { chunk: event.chunk, taskId: event.taskId } });
        } else if (event.type === 'task-ready') {
          reply({ type: 'codernic:task-ready', payload: { taskId: event.taskId } });
        } else if (event.type === 'tool-call') {
          const tc = event.toolCall;
          channel?.appendLine(`[TOOL-CALL] Invoking tool: ${tc?.name}`);
          if (tc) {
            const thinkPhase = /read_file|list_dir/.test(tc.name)
              ? 'reading'
              : /find_file|grep_project|search_workspace/.test(tc.name)
                ? 'searching'
                : /write_file|create_directory/.test(tc.name)
                  ? 'writing'
                  : /run_terminal/.test(tc.name)
                    ? 'executing'
                    : 'considering';
            reply({
              type: 'codernic:thinking',
              payload: {
                phase: thinkPhase,
                detail: `${tc.name}(${JSON.stringify(tc.args).slice(0, 60)})`,
              },
            });
          }
        } else if (event.type === 'tool-executed') {
          channel?.appendLine(`[TOOL-OK] Completed execution of: ${event.toolCall?.name}`);
          reply({
            type: 'codernic:tool-executed',
            payload: { toolName: event.toolCall?.name, args: event.toolCall?.args },
          });
        } else if (event.type === 'thinking') {
          reply({
            type: 'codernic:thinking',
            payload: event.payload,
          });
        } else if (event.type === 'status') {
          reply({
            type: 'codernic:thinking',
            payload: { phase: 'thinking', detail: event.text },
          });
        } else if (event.type === 'ui-lock') {
          reply({ type: 'ac:ui-lock' });
        } else if (event.type === 'ui-unlock') {
          reply({ type: 'ac:ui-unlock' });
        } else if (event.type === 'error') {
          const errorPayload =
            typeof event.error === 'string' ? { text: event.error } : event.error;
          channel?.appendLine(`[ERROR] Stream error encountered: ${JSON.stringify(errorPayload)}`); // ◄ AJOUT
          reply({ type: 'ac:chat-error', payload: errorPayload || { text: 'Unknown error' } });
        } else if (event.type === 'done') {
          channel?.appendLine(`[STREAM-COMPLETION] generation finished`);
          reply({ type: 'ac:chat-done' });
        }
      },
      cts.token,
      async (name, args) => {
        // If MCP client is available in context, pass it
        let mcpClient;
        if (context) {
          const extension = vscode.extensions.getExtension('binaryjack.codernic-ext');
          if (extension?.exports && typeof extension.exports.getClient === 'function') {
            mcpClient = extension.exports.getClient();
          }
        }
        return await executeWorkspaceTool(name, args, root ?? '', mcpClient, cts.token);
      },
    );
  } catch (err) {
    reply({
      type: 'ac:chat-error',
      payload: { text: err instanceof Error ? err.message : String(err) },
    });
  } finally {
    if (!externalCts) {
      cts.dispose();
    }
  }
};

/** Ask the selected LLM to generate best-practice rules for a technology. */
export const generateTechRules = async (
  entry: TechEntry,
  reply: (r: AcMsg) => void,
): Promise<Record<string, TechRuleFileData>> => {
  const cts = new vscode.CancellationTokenSource();
  try {
    reply({ type: 'ac:chat-token', payload: { chunk: `\nGenerating rules for ${entry.name}…\n` } });
    const [model] = await vscode.lm.selectChatModels();
    if (!model) return {};
    const prompt = [
      `You are a software engineering expert. Generate best-practice rules for the technology: ${entry.name}.`,
      entry.description ? `Description: ${entry.description}` : '',
      entry.frameworks?.length ? `Frameworks: ${entry.frameworks.join(', ')}` : '',
      'Return ONLY a JSON object (no markdown) with this shape:',
      '{',
      '  "variables":      { "do": ["..."], "doNot": ["..."], "rationale": { "summary": "...", "reasoning": ["..."], "references": ["..."] } },',
      '  "functions":      { "do": ["..."], "doNot": ["..."], "rationale": { "summary": "...", "reasoning": ["..."], "references": ["..."] } },',
      '  "errorHandling":  { "do": ["..."], "doNot": ["..."], "rationale": { "summary": "...", "reasoning": ["..."], "references": ["..."] } }',
      '}',
    ]
      .filter(Boolean)
      .join('\n');
    const response = await model.sendRequest(
      [vscode.LanguageModelChatMessage.User(prompt)],
      {},
      cts.token,
    );
    let raw = '';
    for await (const chunk of response.text) {
      raw += chunk;
      reply({ type: 'ac:chat-token', payload: { chunk } });
    }
    reply({ type: 'ac:chat-done' });
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, TechRuleFileData>;
  } catch {
    return {};
  } finally {
    cts.dispose();
  }
};

/** Broadcast the technology list to a webview. */
export const broadcastTechs = async (
  techsDir: string,
  reply: (r: AcMsg) => void,
): Promise<void> => {
  try {
    const techs = await readTechs(techsDir);
    reply({
      type: 'ac:techs',
      payload: techs.map((t) => ({ value: t.id, label: t.name })),
    });
  } catch {
    reply({ type: 'ac:techs', payload: [] });
  }
};
