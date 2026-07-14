import * as path from 'path';
import { executeWorkspaceTool } from '../../../shared/api/workspace-tools';
import { callMcpTool, type McpClientInstance, type McpTextContent } from '../../../shared/mcp';
import { ConfigPaths } from '../../../shared/utils/config-paths';
import type { CodernicIntent } from './intent-detector';

/** Execute detected intent via MCP tools or local tools. Returns formatted result text. */
export const executeCommand = async function (
  mcpClient: McpClientInstance | null,
  intent: CodernicIntent,
  projectRoot: string,
  channel: { appendLine: (msg: string) => void },
): Promise<string> {
  // Handle project memory commands before requiring MCP connection
  if (intent.type === 'read-project-memory') {
    return await executeWorkspaceTool('read_project_memory', {}, projectRoot);
  }

  if (intent.type === 'write-project-memory') {
    const spec = intent.spec.trim();
    if (!spec) {
      return `❌ **Missing memory content**\n\nPlease specify category and content. Examples:\n- \`/write-project-memory decision Added rate limiting\`\n- \`/write-project-memory convention Use kebab-case filenames\``;
    }

    const spaceIdx = spec.indexOf(' ');
    let category = 'action';
    let content = spec;
    if (spaceIdx !== -1) {
      const firstWord = spec.slice(0, spaceIdx).toLowerCase();
      const allowed = ['decision', 'action', 'convention', 'open'];
      if (allowed.includes(firstWord)) {
        category = firstWord;
        content = spec.slice(spaceIdx + 1).trim();
      }
    }

    return await executeWorkspaceTool('write_project_memory', { category, content }, projectRoot);
  }

  if (!mcpClient) {
    return `❌ **MCP server not connected**\n\nCannot execute commands without MCP server. Please ensure:\n1. Workspace is open\n2. MCP binary exists in workspace\n3. Extension has been reloaded`;
  }

  channel.appendLine(`[Codernic] Executing command: ${intent.type} — ${intent.spec}`);

  try {
    switch (intent.type) {
      case 'create-agent': {
        // Parse agent name and description from spec
        const spec = intent.spec.trim();
        if (!spec) {
          return `❌ **Missing agent description**\n\nPlease specify what the agent should do. Examples:\n- "create an agent for testing"\n- "/create-agent security audits"`;
        }

        // Extract potential agent name from spec (e.g., "testing" from "testing code")
        const words = spec.split(/\s+/);
        const agentName = words[0].toLowerCase().replace(/[^a-z0-9-]/g, '');

        const result = await callMcpTool(mcpClient, {
          name: 'create-agent',
          arguments: {
            name: agentName,
            description: spec,
            role: words.length > 1 ? words.slice(1).join(' ') : spec,
            projectRoot,
          },
        });

        // Extract text content from MCP result
        const textContent = result.content
          .filter((c): c is McpTextContent => c.type === 'text')
          .map((c: McpTextContent) => c.text)
          .join('\n\n');

        return `✅ **Agent created**\n\n${textContent}`;
      }

      case 'create-dag': {
        const spec = intent.spec.trim();
        if (!spec) {
          return `❌ **Missing DAG description**\n\nPlease specify what the workflow should do. Examples:\n- "create a DAG for code review"\n- "/create-dag feature implementation"`;
        }

        // Extract DAG name from spec
        const dagName = spec
          .split(/\s+/)
          .slice(0, 2)
          .join('-')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '');

        const result = await callMcpTool(mcpClient, {
          name: 'create-dag',
          arguments: {
            dagName,
            description: spec,
            lanes: [], // Empty lanes — user needs to add agents manually
            projectRoot,
          },
        });

        const textContent = result.content
          .filter((c): c is McpTextContent => c.type === 'text')
          .map((c: McpTextContent) => c.text)
          .join('\n\n');

        return `✅ **DAG workflow created**\n\n${textContent}\n\n💡 **Next steps:**\n1. Open the DAG file\n2. Add agents to lanes array\n3. Run with \`/run-dag\``;
      }

      case 'run-dag': {
        let dagFile = intent.spec.trim();
        if (!dagFile) {
          // Default to standard DAG location
          const resolved = ConfigPaths.resolveFile(projectRoot, 'dags/dag.json');
          if (resolved) {
             dagFile = resolved;
          } else {
             dagFile = path.join(ConfigPaths.getPrimaryWritePath(projectRoot), 'dags/dag.json');
          }
        }

        channel.appendLine(`[Codernic] Running DAG: ${dagFile}`);

        const result = await callMcpTool(mcpClient, {
          name: 'agent-dag',
          arguments: {
            dagFile,
            projectRoot,
            verbose: true,
          },
        });

        const textContent = result.content
          .filter((c): c is McpTextContent => c.type === 'text')
          .map((c: McpTextContent) => c.text)
          .join('\n\n');

        return result.isError
          ? `❌ **DAG execution failed**\n\n${textContent}`
          : `✅ **DAG execution complete**\n\n${textContent}`;
      }

      case 'list-agents': {
        // Note: There's no explicit list-agents MCP tool, so we'll provide guidance
        return `📋 **Agent Management**\n\nAgents are stored in the project's agents directory (e.g. \`.codernic/agents/\`).\n\n**To view agents:**\n- Open VS Code Explorer → Config folder\n- Each \`.agent.json\` file is an agent\n\n**To create an agent:**\n- Use: "create an agent for [purpose]"\n- Or: \`/create-agent [purpose]\``;
      }

      case 'help': {
        // This is handled by intent-detector's getCommandHelp
        return `ℹ️ Use the mode dropdown to see available commands for each mode.`;
      }

      default:
        return `❌ **Unknown command type**\n\nDetected: ${intent.type}\n\nThis shouldn't happen — please report as a bug.`;
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    channel.appendLine(`[Codernic] Command execution error: ${errorMsg}`);

    return `❌ **Command execution failed**\n\n\`\`\`\n${errorMsg}\n\`\`\`\n\n**Troubleshooting:**\n1. Check MCP server is running (View → Output → AI Agencee)\n2. Verify workspace has a Codernic config directory\n3. Try reloading VS Code window`;
  }
};
