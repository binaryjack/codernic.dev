/**
 * @file create-chat-participant.ts
 * @description Chat participant for @ai-kit in Copilot Chat
 */

import * as vscode from 'vscode';
import {
  callMcpTool,
  type McpClientInstance,
  type McpContent,
  type McpTextContent,
} from '../../shared/mcp';

/**
 * Command handler for @ai-kit chat participant
 */
interface CommandHandler {
  readonly handler: (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ) => Promise<void>;
}

/**
 * Creates the @ai-kit chat participant
 * @param mcpClient - MCP client instance (may be null if not connected)
 * @param channel - Output channel for logging
 * @returns Disposable for the chat participant
 */
export const createChatParticipant = function (
  mcpClient: McpClientInstance | null,
  channel: vscode.OutputChannel,
): vscode.Disposable {
  // Command handlers
  const handlers: Record<string, CommandHandler> = {
    'create-agent': {
      handler: async (request, _context, stream, _token) => {
        stream.markdown('Creating a new agent...\n\n');

        // Use MCP agent-dag tool with create-agent action
        if (!mcpClient) {
          stream.markdown('⚠️ MCP client not connected. Cannot create agent.\n');
          return;
        }

        try {
          const result = await callMcpTool(mcpClient, {
            name: 'agent-dag',
            arguments: {
              action: 'scaffold-agent',
              prompt: request.prompt,
            },
          });

          const textContent = result.content
            .filter(
              (c: McpContent): c is McpTextContent => c.type === 'text' && 'text' in c && !!c.text,
            )
            .map((c: McpTextContent) => c.text)
            .join('\n\n');

          stream.markdown(textContent || '✅ Agent template created');
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          stream.markdown(`❌ Failed to create agent: ${errMsg}`);
          channel.appendLine(`create-agent error: ${errMsg}`);
        }
      },
    },

    'create-dag': {
      handler: async (request, _context, stream, _token) => {
        stream.markdown('Creating a new DAG...\n\n');

        if (!mcpClient) {
          stream.markdown('⚠️ MCP client not connected. Cannot create DAG.\n');
          return;
        }

        try {
          const result = await callMcpTool(mcpClient, {
            name: 'agent-dag',
            arguments: {
              action: 'scaffold-dag',
              prompt: request.prompt,
            },
          });

          const textContent = result.content
            .filter(
              (c: McpContent): c is McpTextContent => c.type === 'text' && 'text' in c && !!c.text,
            )
            .map((c: McpTextContent) => c.text)
            .join('\n\n');

          stream.markdown(textContent || '✅ DAG template created');
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          stream.markdown(`❌ Failed to create DAG: ${errMsg}`);
          channel.appendLine(`create-dag error: ${errMsg}`);
        }
      },
    },

    'create-rule': {
      handler: async (request, _context, stream, _token) => {
        stream.markdown('Adding/updating rule in .ai/rules.md...\n\n');

        if (!mcpClient) {
          stream.markdown('⚠️ MCP client not connected. Cannot manage rules.\n');
          return;
        }

        try {
          const result = await callMcpTool(mcpClient, {
            name: 'agent-dag',
            arguments: {
              action: 'add-rule',
              rule: request.prompt,
            },
          });

          const textContent = result.content
            .filter(
              (c: McpContent): c is McpTextContent => c.type === 'text' && 'text' in c && !!c.text,
            )
            .map((c: McpTextContent) => c.text)
            .join('\n\n');

          stream.markdown(textContent || '✅ Rule added/updated');
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          stream.markdown(`❌ Failed to manage rule: ${errMsg}`);
          channel.appendLine(`create-rule error: ${errMsg}`);
        }
      },
    },

    index: {
      handler: async (_request, _context, stream, _token) => {
        stream.markdown('Starting code indexing...\n\n');

        try {
          await vscode.commands.executeCommand('ai-agencee.code.index');
          stream.markdown('✅ Indexing started. Check the status bar for progress.');
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          stream.markdown(`❌ Failed to start indexing: ${errMsg}`);
          channel.appendLine(`index command error: ${errMsg}`);
        }
      },
    },

    run: {
      handler: async (request, _context, stream, _token) => {
        stream.markdown(`Executing command: \`${request.prompt}\`\n\n`);

        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
          stream.markdown('⚠️ No workspace folder open\n');
          return;
        }

        try {
          // Execute ai-kit CLI command in terminal
          const terminal = vscode.window.createTerminal({
            name: 'AI Agencee',
            cwd: workspaceRoot,
          });
          terminal.show(true); // preserveFocus — do not steal focus from chat
          terminal.sendText(`ai-kit ${request.prompt}`);

          stream.markdown('✅ Command sent to terminal');
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          stream.markdown(`❌ Failed to execute command: ${errMsg}`);
          channel.appendLine(`run error: ${errMsg}`);
        }
      },
    },

    dag: {
      handler: async (request, _context, stream, _token) => {
        stream.markdown('Running DAG orchestrator...\n\n');

        if (!mcpClient) {
          stream.markdown('⚠️ MCP client not connected. Cannot run DAG.\n');
          return;
        }

        try {
          const result = await callMcpTool(mcpClient, {
            name: 'agent-dag',
            arguments: {
              action: 'run',
              prompt: request.prompt,
            },
          });

          const textContent = result.content
            .filter(
              (c: McpContent): c is McpTextContent => c.type === 'text' && 'text' in c && !!c.text,
            )
            .map((c: McpTextContent) => c.text)
            .join('\n\n');

          stream.markdown(textContent);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          stream.markdown(`❌ DAG execution failed: ${errMsg}`);
          channel.appendLine(`dag error: ${errMsg}`);
        }
      },
    },
  };

  // Main request handler
  const handleRequest = async function (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<vscode.ChatResult> {
    try {
      // Check if a command was specified
      const command = request.command;

      if (command && handlers[command]) {
        await handlers[command].handler(request, context, stream, token);
      } else {
        // Default: provide guidance
        stream.markdown(`# AI Agencee (@ai-kit)

Available commands:
- \`/create-agent\` - Scaffold a new agent JSON
- \`/create-dag\` - Scaffold a new DAG JSON  
- \`/create-rule\` - Add/update a rule in .ai/rules.md
- \`/index\` - Index the codebase for intelligent search
- \`/run\` - Execute an ai-kit CLI command
- \`/dag\` - Run the DAG orchestrator

Example: \`@ai-kit /create-agent Create a code review agent\`
`);
      }

      return { metadata: { command: request.command } };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      stream.markdown(`❌ Error: ${errMsg}`);
      channel.appendLine(`Chat participant error: ${errMsg}`);
      return { metadata: { command: request.command }, errorDetails: { message: errMsg } };
    }
  };

  // Register chat participant
  const participant = vscode.chat.createChatParticipant('ai-agencee.kit', handleRequest);

  participant.iconPath = vscode.Uri.file('media/icon.png');

  return participant;
};
