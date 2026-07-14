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
      'Read all project intelligence from .codernic/config/intelligence/ — tech registry, conventions, agent-hints, and persistent memory log. Call this at the start of every conversation to orient yourself before answering.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'write_project_memory',
    description:
      'Append a timestamped entry to .codernic/config/intelligence/project-memory.md. Call this after completing significant work, making architectural decisions, or discovering important project conventions.',
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

