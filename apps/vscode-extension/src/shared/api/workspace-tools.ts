/**
 * workspace-tools.ts — VS Code workspace tool definitions for LLM function calling.
 *
 * Read-only tools (WORKSPACE_TOOLS — all modes):
 *   read_file               Read a workspace file (max 8 KB)
 *   list_directory          List files and folders in a directory
 *   search_workspace_symbols Search for functions, classes, variables by name
 *   find_files              Search for files by glob pattern
 *   grep_project            Search code with regex pattern
 *
 * Write/execute tools (AGENT_TOOLS — AGENT mode only):
 *   write_file              Create or overwrite a file
 *   create_directory        Create a directory tree
 *   run_terminal            Execute a shell command inside the workspace
 *
 * Usage (in streamChat):
 *   const response = await model.sendRequest(messages, {
 *     tools: WORKSPACE_TOOLS,          // or AGENT_TOOLS in agent mode
 *     toolMode: vscode.LanguageModelChatToolMode.Auto
 *   }, token)
 */

import { Buffer } from 'buffer';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { callMcpTool, type McpTextContent } from '../mcp';

// ─── Tool Schema Definitions ──────────────────────────────────────────────────

export const WORKSPACE_TOOLS: vscode.LanguageModelChatTool[] = [
  {
    name: 'ragtime_semantic_search',
    description:
      'Perform a high-performance semantic search using the Ragtime Rust engine. Returns relevant code snippets based on meaning, not just keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The natural language query (e.g., "how is LLM routing handled?", "find code related to authentication")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of snippets to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_file',
    description:
      'Read the contents of a file in the workspace. Returns up to 8 KB of text. Use this to examine code before making suggestions.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Path relative to workspace root (e.g., "src/index.ts", "_private/.staging/.env")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_directory',
    description:
      'List the files and sub-directories inside a directory. Returns file names with "/" suffix for folders.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Path relative to workspace root (default: workspace root). Examples: "packages", "_private/.staging"',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_workspace_symbols',
    description:
      'Search for code symbols (functions, classes, variables, types) by name across the entire workspace. Returns locations and previews.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Symbol name to search for (e.g., "executeAgent", "ModelRouter", "CodernicHandler")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20, max: 50)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_files',
    description:
      'Search for files by glob pattern. Use this to find all files of a certain type or in a certain location.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description:
            'Glob pattern (e.g., "**/*.ts", "packages/**/*.json", "_private/.staging/*"). Use ** for recursive search.',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 100, max: 200)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep_project',
    description:
      'Search for a text pattern across all files in the workspace using regex. Returns file paths, line numbers, and matching lines.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description:
            'Text or regex pattern to search for (e.g., "TODO", "executeAgent", "class.*Provider")',
        },
        path: {
          type: 'string',
          description:
            'Limit search to this path (e.g., "packages/", "_private/"). Leave empty to search entire workspace.',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of matches to return (default: 30, max: 100)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'read_project_memory',
    description:
      'Read all project intelligence from .agencee/config/intelligence/ — tech registry, conventions, agent-hints, and persistent memory log. Call this at the start of every conversation to orient yourself before answering.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'write_project_memory',
    description:
      'Append a timestamped entry to .agencee/config/intelligence/project-memory.md. Call this after completing significant work, making architectural decisions, or discovering important project conventions.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description:
            'What to record — decision made, action taken, pattern discovered, or open question',
        },
        category: {
          type: 'string',
          enum: ['decision', 'action', 'convention', 'open'],
          description: 'Category of the entry (default: action)',
        },
      },
      required: ['content'],
    },
  },
];

/** Agent-mode write/execute tools (only provided in AGENT mode). */
export const AGENT_WRITE_TOOLS: vscode.LanguageModelChatTool[] = [
  {
    name: 'write_file',
    description:
      'Create or overwrite a file in the workspace with the given content. Use this to scaffold new files, configurations, and source code.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            "Chemin relatif strict depuis la racine du projet (doit commencer par './'). Les chemins absolus déclencheront une erreur de sécurité.",
        },
        content: {
          type: 'string',
          description: 'Full UTF-8 content to write to the file.',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'create_directory',
    description: 'Create a directory (and any missing parent directories) inside the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Directory path relative to workspace root (e.g., "apps/web", "packages/shared")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_terminal',
    description:
      'Execute a shell command inside the workspace. Use this to run package manager commands, initialise projects, and invoke build tools. Output (stdout + stderr) is returned.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description:
            'Shell command to run (e.g., "pnpm init", "cargo init", "pnpm add -D typescript")',
        },
        cwd: {
          type: 'string',
          description: 'Working directory relative to workspace root. Defaults to workspace root.',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'apply_patch',
    description:
      'Apply a search-and-replace patch to a file. Use this for targeted edits. Returns "success" or error message.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path relative to workspace root (e.g., "src/index.ts")',
        },
        old_text: {
          type: 'string',
          description: 'The exact block of text to replace. MUST be unique in the file.',
        },
        new_text: {
          type: 'string',
          description: 'The new text to insert instead of old_text.',
        },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
];

/** Combined tool set for AGENT mode: read-only tools + write/execute tools. */
export const AGENT_TOOLS: vscode.LanguageModelChatTool[] = [
  ...WORKSPACE_TOOLS,
  ...AGENT_WRITE_TOOLS,
];

// ─── Tool Execution ───────────────────────────────────────────────────────────

const MAX_READ_BYTES = 8 * 1024; // 8 KB

/**
 * Execute a workspace tool call from the LLM.
 * Returns formatted string result or error message.
 */
export async function executeWorkspaceTool(
  toolName: string,
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
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
        return await toolReadFile(input, workspaceRoot, mcpClient);
      case 'ragtime_semantic_search':
        return await toolRagtimeSemanticSearch(input, mcpClient);
      case 'list_directory':
        return await toolListDirectory(input, workspaceRoot, mcpClient);
      case 'search_workspace_symbols':
        return await toolSearchWorkspaceSymbols(input, mcpClient);
      case 'find_files':
        return await toolFindFiles(input, mcpClient);
      case 'grep_project':
        return await toolGrepProject(input, workspaceRoot, mcpClient);
      case 'write_file':
        return await toolWriteFile(input, workspaceRoot, mcpClient);
      case 'create_directory':
        return await toolCreateDirectory(input, workspaceRoot, mcpClient);
      case 'run_terminal':
        return await toolRunTerminal(input, workspaceRoot, mcpClient);
      case 'apply_patch':
        return await toolApplyPatch(input, workspaceRoot, mcpClient);
      case 'read_project_memory':
        return await toolReadProjectMemory(workspaceRoot);
      case 'write_project_memory':
        return await toolWriteProjectMemory(input, workspaceRoot);
      default:
        return `Error: Unknown tool "${toolName}"`;
    }
  } catch (err) {
    return `Error executing ${toolName}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Individual Tool Implementations ──────────────────────────────────────────

async function toolReadFile(
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const rel = String(input['path'] ?? '').trim();
  if (!rel) return 'Error: path parameter is required';

  // If MCP client is available, route to ragtime_read_file
  if (mcpClient) {
    try {
      const result = await callMcpTool(mcpClient, {
        name: 'ragtime_read_file',
        arguments: { path: rel },
      });
      const content = result.content as McpTextContent[];
      if (content && content.length > 0 && content[0].type === 'text') {
        return content[0].text;
      }
    } catch (err) {
      console.warn(`[workspace-tools] MCP read_file failed, falling back:`, err);
    }
  }

  // Resolve path and validate it's within workspace
  const abs = path.resolve(workspaceRoot, rel);
  if (abs !== workspaceRoot && !abs.startsWith(workspaceRoot + path.sep)) {
    return 'Error: path escapes workspace root (security violation)';
  }

  try {
    const uri = vscode.Uri.file(abs);
    const fileData = await vscode.workspace.fs.readFile(uri);

    // Read up to MAX_READ_BYTES
    const bytesToRead = Math.min(fileData.byteLength, MAX_READ_BYTES);
    const content = Buffer.from(fileData.slice(0, bytesToRead)).toString('utf-8');

    const truncated =
      fileData.byteLength > MAX_READ_BYTES ? '\n\n[...truncated at 8 KB - file is larger]' : '';

    return `### File: ${rel}\n\`\`\`\n${content}${truncated}\n\`\`\``;
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'FileNotFound') {
      return `Error: File not found: ${rel}`;
    }
    return `Error reading file ${rel}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function toolListDirectory(
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const rel = String(input['path'] ?? '').trim() || '.';

  // If MCP client is available, route to list_directory
  if (mcpClient) {
    try {
      const result = await mcpClient.client.callTool({
        name: 'list_directory',
        arguments: { path: rel === '.' ? workspaceRoot : path.resolve(workspaceRoot, rel) },
      });
      const content = result.content as { type: string; text?: string }[];
      if (content && content.length > 0 && content[0].type === 'text' && content[0].text) {
        const files = JSON.parse(content[0].text) as { name: string; type: string }[];
        const lines = files.map((f) => `  - ${f.name}${f.type === 'dir' ? '/' : ''}`);
        return `### Directory: ${rel === '.' ? 'workspace root' : rel}\n${lines.join('\n')}`;
      }
      return `Error reading directory via MCP: Invalid response`;
    } catch (err) {
      return `Error reading directory via MCP: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // Resolve path and validate
  const abs = path.resolve(workspaceRoot, rel);
  if (abs !== workspaceRoot && !abs.startsWith(workspaceRoot + path.sep)) {
    return 'Error: path escapes workspace root (security violation)';
  }

  try {
    const uri = vscode.Uri.file(abs);
    const entries = await vscode.workspace.fs.readDirectory(uri);

    if (entries.length === 0) {
      return `### Directory: ${rel}\n(empty directory)`;
    }

    // Sort: directories first, then files, alphabetically
    const sorted = entries.sort((a, b) => {
      const aIsDir = a[1] === vscode.FileType.Directory;
      const bIsDir = b[1] === vscode.FileType.Directory;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a[0].localeCompare(b[0]);
    });

    const lines = sorted.map(([name, type]) => {
      const suffix = type === vscode.FileType.Directory ? '/' : '';
      return `  - ${name}${suffix}`;
    });

    const displayPath = rel === '.' ? 'workspace root' : rel;
    return `### Directory: ${displayPath}\n${lines.join('\n')}`;
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'FileNotFound') {
      return `Error: Directory not found: ${rel}`;
    }
    return `Error listing directory ${rel}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function toolRagtimeSemanticSearch(
  input: Record<string, unknown>,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const query = String(input['query'] ?? '').trim();
  if (!query) return 'Error: query parameter is required';
  const limit = Number(input['limit'] ?? 5);

  if (!mcpClient) {
    return 'Error: Ragtime Rust Engine is not connected. Semantic search is unavailable.';
  }

  try {
    const result = await callMcpTool(mcpClient, {
      name: 'ragtime_semantic_search',
      arguments: { query, limit },
    });

    const content = result.content as any[];
    if (content && content.length > 0 && content[0].type === 'text') {
      return `### Ragtime Semantic Search Results\n\n${content[0].text}`;
    }
    return `### Ragtime Semantic Search Results\n\n(No results found or invalid response format)`;
  } catch (err) {
    return `Error executing semantic search via MCP: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function toolSearchWorkspaceSymbols(
  input: Record<string, unknown>,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const query = String(input['query'] ?? '').trim();
  if (!query) return 'Error: query parameter is required';

  const maxResults = Math.min(Number(input['maxResults'] ?? 20), 50);

  // If MCP client is available, route to search_symbols
  if (mcpClient) {
    try {
      const result = await callMcpTool(mcpClient, {
        name: 'search_symbols',
        arguments: { query, max_tokens: 4000 },
      });
      const content = result.content as McpTextContent[];
      if (content && content.length > 0 && content[0].type === 'text') {
        const symbols = JSON.parse(content[0].text);
        if (symbols.length === 0) return `No symbols found matching "${query}"`;

        const lines: string[] = [
          `### Symbols matching "${query}" (${Math.min(symbols.length, maxResults)} of ${symbols.length} shown)`,
        ];
        for (const symbol of symbols.slice(0, maxResults)) {
          lines.push(`\n**${symbol.name}** (${symbol.kind})`);
          lines.push(`  Location: ${symbol.file_path}:${symbol.line}`);
        }
        return lines.join('\n');
      }
    } catch (err) {
      console.warn(`[workspace-tools] MCP search_symbols failed, falling back:`, err);
    }
  }

  try {
    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
      'vscode.executeWorkspaceSymbolProvider',
      query,
    );

    if (!symbols || symbols.length === 0) {
      return `No symbols found matching "${query}"`;
    }

    const lines: string[] = [
      `### Symbols matching "${query}" (${Math.min(symbols.length, maxResults)} of ${symbols.length} shown)`,
    ];

    for (const symbol of symbols.slice(0, maxResults)) {
      const location = symbol.location;
      const relPath = vscode.workspace.asRelativePath(location.uri);
      const line = location.range.start.line + 1;
      const kind = vscode.SymbolKind[symbol.kind];

      lines.push(`\n**${symbol.name}** (${kind})`);
      lines.push(`  Location: ${relPath}:${line}`);

      // Try to get a preview of the symbol
      try {
        const doc = await vscode.workspace.openTextDocument(location.uri);
        const previewLine = doc.lineAt(location.range.start.line).text.trim();
        if (previewLine) {
          lines.push(
            `  Preview: ${previewLine.slice(0, 80)}${previewLine.length > 80 ? '...' : ''}`,
          );
        }
      } catch {
        // Skip preview if we can't read the document
      }
    }

    return lines.join('\n');
  } catch (err) {
    return `Error searching symbols: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function toolFindFiles(
  input: Record<string, unknown>,
  _mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const pattern = String(input['pattern'] ?? '').trim();
  if (!pattern) return 'Error: pattern parameter is required';

  const maxResults = Math.min(Number(input['maxResults'] ?? 100), 200);

  // If MCP client is available, could route to a specialized find file, but simple globs
  // work fine using the VS Code api natively. We'll stick to the native implementation for this one
  // since `list_files` in MCP returns *all* files which could be huge.

  try {
    // Exclude common folders to speed up search
    const excludePattern = '{**/node_modules/**,**/dist/**,**/.git/**,**/build/**,**/.next/**}';
    const files = await vscode.workspace.findFiles(pattern, excludePattern, maxResults);

    if (files.length === 0) {
      return `No files found matching pattern "${pattern}"`;
    }

    // Group by directory for cleaner output
    const byDir = new Map<string, string[]>();
    for (const file of files) {
      const relativePath = vscode.workspace.asRelativePath(file);
      const dir = path.dirname(relativePath);
      const fileName = path.basename(relativePath);

      if (!byDir.has(dir)) byDir.set(dir, []);
      byDir.get(dir)!.push(fileName);
    }

    const lines: string[] = [`### Files matching "${pattern}" (${files.length} found)`];

    // Show up to 30 directories
    const dirs = Array.from(byDir.entries()).slice(0, 30);
    for (const [dir, fileNames] of dirs) {
      const displayDir = dir === '.' ? 'workspace root' : dir;
      lines.push(`\n**${displayDir}/**`);

      // Show up to 15 files per directory
      for (const name of fileNames.slice(0, 15)) {
        lines.push(`  - ${name}`);
      }
      if (fileNames.length > 15) {
        lines.push(`  - ... (${fileNames.length - 15} more files)`);
      }
    }

    if (byDir.size > 30) {
      lines.push(`\n... (${byDir.size - 30} more directories not shown)`);
    }

    return lines.join('\n');
  } catch (err) {
    return `Error finding files: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function toolGrepProject(
  input: Record<string, unknown>,
  _workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const pattern = String(input['pattern'] ?? '').trim();
  if (!pattern) return 'Error: pattern parameter is required';

  const searchPath = String(input['path'] ?? '').trim();
  const maxResults = Math.min(Number(input['maxResults'] ?? 30), 100);

  // Use MCP semantic search if searching globally, else fallback to glob/regex
  if (mcpClient && !searchPath) {
    try {
      const result = await callMcpTool(mcpClient, {
        name: 'ragtime_semantic_search',
        arguments: { query: pattern, limit: maxResults, max_tokens: 4000 },
      });
      const content = result.content as McpTextContent[];
      if (content && content.length > 0 && content[0].type === 'text') {
        return content[0].text;
      }
    } catch (err) {
      console.error('[workspace-tools] MCP semantic search failed, falling back to grep:', err);
    }
  }

  try {
    // Build glob pattern for files to search
    const includePattern = searchPath ? `${searchPath}/**/*` : '**/*';
    const excludePattern =
      '{**/node_modules/**,**/dist/**,**/.git/**,**/build/**,**/.next/**,**/pnpm-lock.yaml,**/*.min.js}';

    const files = await vscode.workspace.findFiles(includePattern, excludePattern, 300);

    const results: string[] = [];
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, 'gi');
    } catch {
      return `Error: Invalid regex pattern: ${pattern}`;
    }

    // Search each file
    for (const fileUri of files) {
      if (results.length >= maxResults) break;

      try {
        const fileData = await vscode.workspace.fs.readFile(fileUri);
        const content = Buffer.from(fileData).toString('utf-8');
        const lines = content.split('\n');

        lines.forEach((line: string, index: number) => {
          if (results.length >= maxResults) return;

          regex.lastIndex = 0;
          if (regex.test(line)) {
            const relPath = vscode.workspace.asRelativePath(fileUri);
            const lineNum = index + 1;
            const preview = line.trim().slice(0, 80);
            results.push(
              `${relPath}:${lineNum}: ${preview}${line.trim().length > 80 ? '...' : ''}`,
            );
          }
        });
      } catch {
        // Skip files that can't be read (binary, permissions, etc.)
      }
    }

    if (results.length === 0) {
      const searchScope = searchPath ? `in "${searchPath}"` : 'in workspace';
      return `No matches found for pattern "${pattern}" ${searchScope}`;
    }

    const lines: string[] = [`### Matches for "${pattern}" (${results.length} found)`];
    lines.push(...results.map((r) => `  - ${r}`));

    if (results.length >= maxResults) {
      lines.push(`\n(Limited to ${maxResults} results - there may be more matches)`);
    }

    return lines.join('\n');
  } catch (err) {
    return `Error searching project: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function toolWriteFile(
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const rel = String(input['path'] ?? '').trim();
  if (!rel) return 'Error: path parameter is required';

  const content = String(input['content'] ?? '');

  const abs = path.resolve(workspaceRoot, rel);
  if (abs !== workspaceRoot && !abs.startsWith(workspaceRoot + path.sep)) {
    return 'Error: path escapes workspace root (security violation)';
  }

  // ── RULE PROTECTION: Forbid modification of system rules ──
  if (rel.includes('.agencee/config/codernic/rules/')) {
    return `Error: Modification of system rule files is strictly prohibited for safety. Target: ${rel}`;
  }

  // If MCP client is available, route to write_file
  if (mcpClient) {
    try {
      const result = await callMcpTool(mcpClient, {
        name: 'write_file',
        arguments: { path: abs, content },
      });
      const resContent = result.content as McpTextContent[];
      if (resContent && resContent.length > 0 && resContent[0].type === 'text') {
        return `✅ Written: ${rel} (${content.length} bytes) [via MCP]`;
      }
    } catch (err) {
      console.warn(`[workspace-tools] MCP write_file failed, falling back:`, err);
    }
  }

  await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(abs)));
  const uri = vscode.Uri.file(abs);
  const edit = new vscode.WorkspaceEdit();
  edit.createFile(uri, { overwrite: true, contents: Buffer.from(content, 'utf-8') });
  const ok = await vscode.workspace.applyEdit(edit);
  if (!ok) return `Error: Failed to write file ${rel}`;

  return `✅ Written: ${rel} (${content.length} bytes)`;
}

async function toolCreateDirectory(
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const rel = String(input['path'] ?? '').trim();
  if (!rel) return 'Error: path parameter is required';

  const abs = path.resolve(workspaceRoot, rel);
  if (abs !== workspaceRoot && !abs.startsWith(workspaceRoot + path.sep)) {
    return 'Error: path escapes workspace root (security violation)';
  }

  // If MCP client is available, route to create_directory
  if (mcpClient) {
    try {
      const result = await callMcpTool(mcpClient, {
        name: 'create_directory',
        arguments: { path: abs },
      });
      const resContent = result.content as McpTextContent[];
      if (resContent && resContent.length > 0 && resContent[0].type === 'text') {
        return `✅ Directory created: ${rel} [via MCP]`;
      }
    } catch (err) {
      console.warn(`[workspace-tools] MCP create_directory failed, falling back:`, err);
    }
  }

  await vscode.workspace.fs.createDirectory(vscode.Uri.file(abs));
  return `✅ Directory created: ${rel}`;
}

async function toolRunTerminal(
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
  token?: vscode.CancellationToken,
): Promise<string> {
  const command = String(input['command'] ?? '').trim();
  if (!command) return 'Error: command parameter is required';

  const cwdRel = String(input['cwd'] ?? '').trim();
  const cwd = cwdRel ? path.resolve(workspaceRoot, cwdRel) : workspaceRoot;

  if (cwd !== workspaceRoot && !cwd.startsWith(workspaceRoot + path.sep)) {
    return 'Error: cwd escapes workspace root (security violation)';
  }

  // If MCP client is available, route to execute_command
  if (mcpClient) {
    try {
      // Split command roughly into command and args (note: this is a simple split, real shell parsing is better but this works for basic commands)
      const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const cmd = parts[0] || command;
      const args = parts.slice(1).map((p) => p.replace(/^"|"$/g, ''));

      const result = await callMcpTool(mcpClient, {
        name: 'execute_command',
        arguments: { command: cmd, args, cwd },
      });
      const resContent = result.content as McpTextContent[];
      if (resContent && resContent.length > 0 && resContent[0].type === 'text') {
        return resContent[0].text;
      }
    } catch (err) {
      console.warn(`[workspace-tools] MCP execute_command failed, falling back:`, err);
    }
  }

  // ...existing fallback code...
  return new Promise<string>((resolve) => {
    const proc = childProcess.exec(
      command,
      { cwd, timeout: 60_000, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        const out = [stdout?.trim(), stderr?.trim()].filter(Boolean).join('\n');
        if (err && (err as { killed?: boolean }).killed) {
          resolve(`⏱️ Command timed out after 60 s\n${out}`);
        } else if (err) {
          resolve(`❌ Exit ${err.code ?? 1}\n${out}`);
        } else {
          resolve(`✅ Success\n${out}`);
        }
      },
    );

    if (token) {
      token.onCancellationRequested(() => {
        proc.kill();
        resolve(`🛑 Command cancelled by user\n[Process terminated]`);
      });
    }
  });
}

async function toolApplyPatch(
  input: Record<string, unknown>,
  workspaceRoot: string,
  mcpClient?: import('../mcp').McpClientInstance,
): Promise<string> {
  const rel = String(input['path'] ?? '').trim();
  if (!rel) return 'Error: path parameter is required';

  // ── RULE PROTECTION: Forbid modification of system rules ──
  if (rel.includes('.agencee/config/codernic/rules/')) {
    return `Error: Modification of system rule files is strictly prohibited for safety. Target: ${rel}`;
  }

  const oldText = String(input['old_text'] ?? '');
  const newText = String(input['new_text'] ?? '');

  const abs = path.resolve(workspaceRoot, rel);
  if (abs !== workspaceRoot && !abs.startsWith(workspaceRoot + path.sep)) {
    return 'Error: path escapes workspace root (security violation)';
  }

  // If MCP client is available, route to apply_patch
  if (mcpClient) {
    try {
      const result = await callMcpTool(mcpClient, {
        name: 'apply_patch',
        arguments: { path: abs, old_text: oldText, new_text: newText },
      });
      const resContent = result.content as McpTextContent[];
      if (resContent && resContent.length > 0 && resContent[0].type === 'text') {
        return resContent[0].text;
      }
    } catch (err) {
      console.warn(`[workspace-tools] MCP apply_patch failed, falling back:`, err);
    }
  }

  // Fallback implementation
  try {
    const uri = vscode.Uri.file(abs);
    const fileData = await vscode.workspace.fs.readFile(uri);
    const content = Buffer.from(fileData).toString('utf-8');

    if (!content.includes(oldText)) {
      return `Error: old_text not found in file. Ensure exact match including whitespace.`;
    }

    const count = content.split(oldText).length - 1;
    if (count > 1) {
      return `Error: old_text matches ${count} times. Make it more specific.`;
    }

    const newContent = content.replace(oldText, newText);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      uri,
      new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1000000, 0)),
      newContent,
    );

    const ok = await vscode.workspace.applyEdit(edit);
    return ok ? '✅ Patch applied successfully' : '❌ Failed to apply patch';
  } catch (err) {
    return `Error applying patch: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function toolReadProjectMemory(workspaceRoot: string): Promise<string> {
  const intelligenceDir = path.join(workspaceRoot, '.agencee', 'config', 'intelligence');
  const MAX_TOTAL = 16 * 1024;
  let total = 0;
  const sections: string[] = [];

  const priorityFiles = [
    'project-memory.md',
    'tech-registry.json',
    'conventions.json',
    'agent-hints.json',
  ];

  for (const filename of priorityFiles) {
    if (total >= MAX_TOTAL) break;
    try {
      const uri = vscode.Uri.file(path.join(intelligenceDir, filename));
      const data = await vscode.workspace.fs.readFile(uri);
      const raw = Buffer.from(data).toString('utf-8');
      const slice = raw.slice(0, MAX_TOTAL - total);
      sections.push(
        `### ${filename}\n\`\`\`\n${slice}${slice.length < raw.length ? '\n[...truncated]' : ''}\n\`\`\``,
      );
      total += slice.length;
    } catch {
      /* file not found — skip */
    }
  }

  try {
    const rulesUri = vscode.Uri.file(path.join(intelligenceDir, 'rules'));
    const entries = await vscode.workspace.fs.readDirectory(rulesUri);
    const xmlFiles = entries
      .filter(([n, t]) => t === vscode.FileType.File && n.endsWith('.xml'))
      .slice(0, 3);
    for (const [name] of xmlFiles) {
      if (total >= MAX_TOTAL) break;
      try {
        const uri = vscode.Uri.file(path.join(intelligenceDir, 'rules', name));
        const data = await vscode.workspace.fs.readFile(uri);
        const raw = Buffer.from(data).toString('utf-8');
        const slice = raw.slice(0, MAX_TOTAL - total);
        sections.push(`### rules/${name}\n${slice}`);
        total += slice.length;
      } catch {
        /* skip */
      }
    }
  } catch {
    /* no rules dir */
  }

  if (sections.length === 0) {
    return '(No project memory found. Run `/analyse` to build intelligence artefacts, or `/journey` to start a discovery session.)';
  }

  return `## Project Memory\n\n${sections.join('\n\n')}`;
}

async function toolWriteProjectMemory(
  input: Record<string, unknown>,
  workspaceRoot: string,
): Promise<string> {
  const content = String(input['content'] ?? '').trim();
  if (!content) return 'Error: content is required';

  const allowed = ['decision', 'action', 'convention', 'open'];
  const category = allowed.includes(String(input['category']))
    ? String(input['category'])
    : 'action';

  const memoryPath = path.join(
    workspaceRoot,
    '.agencee',
    'config',
    'intelligence',
    'project-memory.md',
  );
  const memoryUri = vscode.Uri.file(memoryPath);
  const timestamp = new Date().toISOString();
  const entry = `\n## [${timestamp}] [${category}]\n\n${content}\n`;

  try {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(memoryPath)));
    let existing =
      '# Project Memory\n\n_Maintained by Codernic. Tracks decisions, conventions, and actions across sessions._\n';
    try {
      const data = await vscode.workspace.fs.readFile(memoryUri);
      existing = Buffer.from(data).toString('utf-8');
    } catch {
      /* new file */
    }
    await vscode.workspace.fs.writeFile(memoryUri, Buffer.from(existing + entry, 'utf-8'));
    return `✅ Memory recorded [${category}]: ${content.slice(0, 80)}${content.length > 80 ? '...' : ''}`;
  } catch (err) {
    return `Error writing memory: ${err instanceof Error ? err.message : String(err)}`;
  }
}
