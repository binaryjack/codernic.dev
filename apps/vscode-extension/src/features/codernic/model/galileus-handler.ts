import { callMcpTool, type McpTextContent } from '../../../shared/mcp';
import type { CodernicMsg } from '../api/codernic-webview-provider';

/** Parse MCP tool response text safely. Returns the parsed value, or an error object. */
export function safeParseText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

/** Format Galileus WorkspaceSnapshot for display in Codernic chat. */
function formatGalileusWorkspaceState(data: unknown): string {
  try {
    const snap = data as { sessions?: unknown[]; queue?: unknown[]; generated_at?: number };
    if (!snap?.sessions) return '⊙ **Galileus** — no data returned.';
    if (snap.sessions.length === 0 && (snap.queue ?? []).length === 0) {
      return '⊙ **Galileus** — no active sessions.';
    }
    const lines: string[] = ['⊙ **Galileus — Workspace State**\n'];
    for (const s of snap.sessions as Array<{
      id: string;
      label: string;
      agent_type: string;
      state: string;
      claimed_files_count: number;
      waiter_count: number;
      intents?: unknown[];
    }>) {
      const intentCount = (s.intents ?? []).length;
      lines.push(`**Session:** \`${s.id}\` (${s.agent_type}) · state: \`${s.state}\``);
      lines.push(
        `  ${intentCount} intent(s) · ${s.claimed_files_count} file claim(s) · ${s.waiter_count} waiter(s)`,
      );
    }
    const queue = (snap.queue ?? []) as Array<{
      intent_id: string;
      priority: number;
      position: number;
    }>;
    if (queue.length > 0) {
      lines.push(`\n**Queue (${queue.length}):**`);
      for (const q of queue) {
        lines.push(`  [${q.position}] \`${q.intent_id}\` (priority ${q.priority})`);
      }
    }
    return lines.join('\n');
  } catch {
    return '⊙ **Galileus** — error parsing state.';
  }
}

/** Handle /galileus slash commands by calling Galileus MCP tools. */
export async function handleGalileusCommand(
  spec: string,
  mcpInstance: import('../../../shared/mcp').McpClientInstance,
  reply: (r: CodernicMsg) => void,
  channel: { appendLine: (msg: string) => void },
): Promise<void> {
  const parts = spec.trim().split(/\s+/);
  const subCommand = parts[0]?.toLowerCase() ?? '';

  try {
    if (subCommand === 'resolve' && parts[1]) {
      const sessionId = parts[1];
      const result = await callMcpTool(mcpInstance, {
        name: 'galileus_resolve_session',
        arguments: { session_id: sessionId },
      });
      const firstItem = result.content?.[0] as McpTextContent | undefined;
      const text = firstItem ? firstItem.text : JSON.stringify(result);
      const parsed = safeParseText(text) as { error?: string; unblocked_intent_ids?: string[] };
      if (parsed?.error) {
        throw new Error(parsed.error);
      }
      const unblocked: string[] = parsed.unblocked_intent_ids ?? [];
      reply({
        type: 'codernic:stream-chunk',
        payload: {
          chunk: `⊙ **Galileus** — Session \`${sessionId}\` resolved.\n\nNewly ALLOWED intents: ${unblocked.length > 0 ? unblocked.map((id: string) => `\`${id}\``).join(', ') : 'none'}`,
          done: true,
        },
      });
      return;
    }

    if (subCommand === 'declare' && parts[1]) {
      // /galileus declare <session_id> [file:type ...]
      const sessionId = parts[1];
      const claimed_files = parts.slice(2).map((token) => {
        const [filePath, claimType = 'write'] = token.split(':');
        return { path: filePath, type: claimType as 'read' | 'write' | 'exclusive' };
      });
      const result = await callMcpTool(mcpInstance, {
        name: 'galileus_declare_intent',
        arguments: { session_id: sessionId, label: sessionId, claimed_files },
      });
      const firstItem = result.content?.[0] as McpTextContent | undefined;
      const text = firstItem ? firstItem.text : JSON.stringify(result);
      const parsed = safeParseText(text) as { error?: string; intent_id?: string; state?: string };
      if (parsed?.error) {
        throw new Error(parsed.error);
      }
      reply({
        type: 'codernic:stream-chunk',
        payload: {
          chunk:
            '⊙ **Galileus** — Intent declared for session `' +
            sessionId +
            '`.\n\n**Intent:** `' +
            parsed.intent_id +
            '`\n**State:** `' +
            parsed.state +
            '`',
          done: true,
        },
      });
      return;
    }

    // Default: get workspace state
    const result = await callMcpTool(mcpInstance, { name: 'galileus_get_workspace_state' });
    const firstItem = result.content?.[0] as McpTextContent | undefined;
    const text = firstItem ? firstItem.text : JSON.stringify(result);
    const parsed = safeParseText(text) as { error?: string };
    if (parsed?.error) {
      throw new Error(parsed.error);
    }
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: formatGalileusWorkspaceState(parsed), done: true },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    channel.appendLine(`[Codernic] Galileus error: ${errMsg}`);
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: `⊙ **Galileus** — error: ${errMsg}`, done: true },
    });
  }
}

// Global reference to the current galileus session ID if adopted
export let globalGalileusSessionId: string | null = null;

export function setGlobalGalileusSessionId(id: string | null): void {
  globalGalileusSessionId = id;
}
