import * as vscode from 'vscode';
import type { McpClientInstance } from '../mcp';

export * from './workspace-tools.schema';
import * as Impl from './workspace-tools.impl';

/**
 * Execute a workspace tool call from the LLM.
 * Returns formatted string result or error message.
 */
export async function executeWorkspaceTool(
  toolName: string,
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: McpClientInstance,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _token?: vscode.CancellationToken,
): Promise<string> {
  try {
    // ── Permission Enforcement ──
    const mutatingTools = [
      'write_file',
      'create_directory',
      'run_terminal',
      'apply_patch',
      'write_project_memory',
    ];
    if (mutatingTools.includes(toolName)) {
      const config = vscode.workspace.getConfiguration('ai-agencee');
      const approvalConfig = config.get<string>('toolApprovals') ?? 'ask';

      if (approvalConfig === 'ask') {
        const choice = await vscode.window.showWarningMessage(
          `Codernic wants to execute ${toolName}: ${JSON.stringify(input).slice(0, 120)}...`,
          'Allow',
          'Always Allow',
          'Reject',
        );
        if (choice === 'Always Allow') {
          await config.update('toolApprovals', 'always', vscode.ConfigurationTarget.Global);
        } else if (choice !== 'Allow') {
          return `Error: User rejected execution of tool "${toolName}"`;
        }
      }
    }

    switch (toolName) {
      case 'read_file':
        return await Impl.toolReadFile(input, workspaceRoot, mcpClient);
      case 'ragtime_semantic_search':
        return await Impl.toolRagtimeSemanticSearch(input, mcpClient);
      case 'list_directory':
        return await Impl.toolListDirectory(input, workspaceRoot, mcpClient);
      case 'search_workspace_symbols':
        return await Impl.toolSearchWorkspaceSymbols(input, mcpClient);
      case 'find_files':
        return await Impl.toolFindFiles(input, mcpClient);
      case 'grep_project':
        return await Impl.toolGrepProject(input, workspaceRoot, mcpClient);
      case 'write_file':
        return await Impl.toolWriteFile(input, workspaceRoot, mcpClient);
      case 'create_directory':
        return await Impl.toolCreateDirectory(input, workspaceRoot, mcpClient);
      case 'run_terminal':
        return await Impl.toolRunTerminal(input, workspaceRoot, mcpClient, _token);
      case 'apply_patch':
        return await Impl.toolApplyPatch(input, workspaceRoot, mcpClient);
      case 'read_project_memory':
        return await Impl.toolReadProjectMemory(workspaceRoot);
      case 'write_project_memory':
        return await Impl.toolWriteProjectMemory(input, workspaceRoot);
      default:
        return `Error: Unknown tool "${toolName}"`;
    }
  } catch (err) {
    return `Error executing ${toolName}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
