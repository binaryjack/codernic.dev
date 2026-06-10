import * as vscode from 'vscode';
import * as net from 'net';
import * as readline from 'readline';
import * as os from 'os';
import type { LlmAdapter, StreamEvent } from '../llm-adapter.interface';
import { queryDaemonStatus } from '../../../../../shared/workspace-setup';

export class IpcEngineAdapter implements LlmAdapter {
  public readonly id: string;
  private readonly workspaceRoot: string;
  private readonly modelName?: string;
  private readonly modelInfo?: any;

  constructor(id: string, workspaceRoot: string, modelName?: string, modelInfo?: any) {
    this.id = id;
    this.workspaceRoot = workspaceRoot;
    this.modelName = modelName;
    this.modelInfo = modelInfo;
  }

  async streamChat(
    messages: { role: string; content: string }[],
    _options: { tools?: vscode.LanguageModelChatTool[] },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
    _executeTool?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<void> {
    try {
      const status = await queryDaemonStatus();
      if (status && status.Status && status.Status.is_indexing) {
        onEvent({ type: 'status', text: 'indexing' });
        onEvent({
          type: 'token',
          chunk: '⚠️ L\'indexation de votre codebase est en cours en arrière-plan. Veuillez patienter avant d\'interroger le modèle.'
        });
        onEvent({ type: 'done' });
        return;
      }
    } catch (e) {
      // Ignore status query errors
    }

    const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\ai_agencee' : '/tmp/ai_agencee.sock';

    return new Promise((resolve, reject) => {
      onEvent({ type: 'ui-lock' });

      const socket = net.createConnection(ipcPath);
      let isDone = false;
      const taskId = 'task_' + Date.now();

      let timeoutId: NodeJS.Timeout | null = null;
      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          console.error('[IpcEngineAdapter] Timeout: aucune réponse du démon après 120s');
          onEvent({ type: 'error', error: 'Timeout de génération (120s)' });
          cleanup();
          socket.destroy();
        }, 120000);
      };

      const cleanup = () => {
        if (!isDone) {
          isDone = true;
          if (timeoutId) clearTimeout(timeoutId);
          onEvent({ type: 'ui-unlock' });
          onEvent({ type: 'done' });
          resolve();
        }
      };

      socket.on('error', (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        onEvent({ type: 'error', error: `IPC Socket Error: ${err.message}` });
        cleanup();
      });

      socket.on('close', () => {
        if (timeoutId) clearTimeout(timeoutId);
        cleanup();
      });

      socket.on('connect', () => {
        resetTimeout();
        
        const temperature = this.modelInfo?.parameters?.temperature ?? 0.0;
        
        const targetModel = this.modelInfo?.models?.find((m: any) => m.id === this.modelName || m.id === this.id);
        const weightsPaths = targetModel?.modelPath ? [targetModel.modelPath] : [];
        const contextWindow = targetModel?.contextSize || this.modelInfo?.contextSize || 8192;
        
        const payload = {
          ExecuteAsk: {
            task_id: taskId,
            model_def: {
              model_id: this.modelName || 'local-model',
              weights_paths: weightsPaths,
              config_path: '',
              tokenizer_path: '',
              context_window: contextWindow
            },
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            params: {
              temperature,
              top_p: 0.95,
              max_tokens: 4096,
              json_schema: null,
              gbnf_grammar: null,
              stop_sequences: this.modelInfo?.parameters?.stop_sequences || ['</action>'],
              chat_template: this.modelInfo?.parameters?.chat_template || null
            },
            use_rag: true,
            route_profile: null,
            project_root: this.workspaceRoot
          }
        };

        socket.write(JSON.stringify(payload) + '\n');
        onEvent({ type: 'task-ready', taskId });
      });

      const rl = readline.createInterface({ input: socket, terminal: false });

      rl.on('line', (line) => {
        resetTimeout();
        try {
          const response = JSON.parse(line);
          
          if (response.Inference && response.Inference.Token) {
            onEvent({ type: 'token', chunk: response.Inference.Token, taskId });
          } else if (response.Inference && response.Inference.Error) {
             onEvent({ type: 'error', error: response.Inference.Error });
          } else if (response.Error) {
             onEvent({ type: 'error', error: response.Error });
          } else if (response.Status) {
             onEvent({ type: 'status', text: 'Chargement ou préparation du modèle en cours...' });
          } else if (response.type === 'Status') {
             onEvent({ type: 'status', text: response.payload || 'Chargement en cours...' });
          } else if (response === 'Done') {
            cleanup();
            socket.end();
          }
        } catch (err) {
          console.error('[IpcEngineAdapter] Ligne NDJSON corrompue ignorée :', err);
        }
      });

      cancellationToken.onCancellationRequested(() => {
        if (timeoutId) clearTimeout(timeoutId);
        socket.destroy();
        reject(new Error('Cancelled by user'));
      });
    });
  }
}
