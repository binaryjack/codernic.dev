/** Command execution via MCP agent-dag tool. */

import { callMcpTool, type McpClientInstance, type McpTextContent } from '../../../shared/mcp';
import type { CodernicIntent } from './intent-detector';

/** Execute detected intent via MCP tools. Returns formatted result text. */
export const executeCommand = async function (
  mcpClient: McpClientInstance | null,
  intent: CodernicIntent,
  projectRoot: string,
  channel: { appendLine: (msg: string) => void },
): Promise<string> {
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
          dagFile = '.agencee/config/agents/dag.json';
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
        return `📋 **Agent Management**\n\nAgents are stored in \`.agencee/config/agents/\` directory.\n\n**To view agents:**\n- Open VS Code Explorer → \`.agencee/config/agents/\` folder\n- Each \`.agent.json\` file is an agent\n\n**To create an agent:**\n- Use: "create an agent for [purpose]"\n- Or: \`/create-agent [purpose]\``;
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

    return `❌ **Command execution failed**\n\n\`\`\`\n${errorMsg}\n\`\`\`\n\n**Troubleshooting:**\n1. Check MCP server is running (View → Output → AI Agencee)\n2. Verify workspace has \`.agencee/\` directory\n3. Try reloading VS Code window`;
  }
};
