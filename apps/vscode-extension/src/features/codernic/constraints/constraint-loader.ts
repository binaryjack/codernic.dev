/**
 * @file constraint-loader.ts
 * @description Loads or generates the Codernic constraint manifest.
 *
 * The constraint manifest is a markdown block injected into every Codernic
 * system message so the LLM knows the project's hard coding constraints.
 *
 * Resolution order:
 *   1. Read `.agencee/constraints.md` from disk (cache hit)
 *   2. Call `pirsig-profile` MCP tool to derive StyleProfile from index
 *   3. Generate `<HARD_CONSTRAINTS>` block + write to `.agencee/constraints.md`
 *   4. Return the block (or empty string on any failure)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { callMcpTool, type McpClientInstance, type McpTextContent } from '../../../shared/mcp';

const CONSTRAINTS_FILE = path.join('.agencee', 'constraints.md');

// ─── Minimal shape of the StyleProfile returned by the MCP tool ──────────────

interface StyleProfileShape {
  naming?: {
    functions?: string;
    classes?: string;
    interfaces?: string;
    files?: string;
    hooks?: string;
  };
  structure?: {
    prefersNamedExports?: boolean;
    usesBarrelIndex?: boolean;
    prefersFactoryFunctions?: boolean;
    prefersReadonly?: boolean;
    prefersTypeOverInterface?: boolean;
    componentPattern?: string;
  };
  imports?: {
    prefersAbsoluteImports?: boolean;
    usesPathAliases?: boolean;
    importsHaveJsExtension?: boolean;
  };
  testing?: {
    framework?: string;
    fileNamingPattern?: string;
    prefersCoLocation?: boolean;
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Reads the constraint manifest from `.agencee/constraints.md`.
 * Returns `null` if the file does not exist.
 */
export async function loadConstraintManifest(workspaceRoot: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(workspaceRoot, CONSTRAINTS_FILE), 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Converts a StyleProfile JSON object into a `<HARD_CONSTRAINTS>` block
 * that can be prepended to every Codernic system message.
 */
export function generateConstraintManifestFromProfile(profile: StyleProfileShape): string {
  const lines: string[] = [
    '<HARD_CONSTRAINTS>',
    '## Project Coding Constraints (auto-derived from codebase index)',
    '',
  ];

  // Naming
  const n = profile.naming;
  if (n) {
    lines.push('### Naming Conventions');
    if (n.functions) lines.push(`- Functions: **${n.functions}**`);
    if (n.classes) lines.push(`- Classes: **${n.classes}**`);
    if (n.interfaces) lines.push(`- Interfaces: **${n.interfaces}**`);
    if (n.files) lines.push(`- Files: **${n.files}**`);
    if (n.hooks) lines.push(`- Hooks: **${n.hooks}** prefix`);
    lines.push('');
  }

  // Structure
  const s = profile.structure;
  if (s) {
    lines.push('### Structure');
    if (s.prefersNamedExports)
      lines.push('- **Named exports required** — use `export const` / `export function`');
    if (s.usesBarrelIndex) lines.push('- **Barrel index** — re-export from `index.ts`');
    if (s.prefersFactoryFunctions)
      lines.push('- **Factory functions** — use `createX()` / `buildX()` over `new X()`');
    if (s.prefersReadonly)
      lines.push('- **Immutability** — prefer `Readonly<T>` for shaped objects');
    if (s.prefersTypeOverInterface)
      lines.push('- **Types over interfaces** — prefer `type` aliases');
    if (s.componentPattern === 'functional')
      lines.push('- **Functional components** — no class components');
    lines.push('');
  }

  // Imports
  const i = profile.imports;
  if (i) {
    lines.push('### Imports');
    if (i.prefersAbsoluteImports) lines.push('- **Absolute imports** preferred over relative `./`');
    if (i.usesPathAliases) lines.push('- **Path aliases** in use — respect configured aliases');
    if (i.importsHaveJsExtension)
      lines.push('- **`.js` extension** required on relative imports (ESM)');
    lines.push('');
  }

  // Testing
  const t = profile.testing;
  if (t) {
    lines.push('### Testing');
    if (t.framework) lines.push(`- Framework: **${t.framework}**`);
    if (t.fileNamingPattern) lines.push(`- Test file pattern: **${t.fileNamingPattern}**`);
    if (t.prefersCoLocation) lines.push('- **Co-located tests** — place test files next to source');
    lines.push('');
  }

  lines.push('</HARD_CONSTRAINTS>');
  return lines.join('\n');
}

/**
 * Ensures a constraint manifest exists for the workspace.
 *
 * 1. Returns cached `.agencee/constraints.md` if present.
 * 2. Generates it from StyleProfile via `pirsig-profile` MCP tool.
 * 3. Writes the result and returns it.
 * 4. Returns empty string if `mcpClient` is null or any step fails.
 */
export async function ensureConstraintManifest(
  workspaceRoot: string,
  mcpClient: McpClientInstance | null,
): Promise<string> {
  // Fast path — already generated
  const cached = await loadConstraintManifest(workspaceRoot);
  if (cached) return cached;

  // No MCP client — cannot derive profile
  if (!mcpClient) return '';

  try {
    const result = await callMcpTool(mcpClient, {
      name: 'pirsig-profile',
      arguments: { projectRoot: workspaceRoot },
    });

    const text = result.content
      .filter(
        (c): c is McpTextContent =>
          c.type === 'text' && typeof (c as { text?: unknown }).text === 'string',
      )
      .map((c: McpTextContent) => c.text)
      .join('');

    if (!text) return '';

    const profile = JSON.parse(text) as StyleProfileShape;
    const manifest = generateConstraintManifestFromProfile(profile);

    // Persist for future requests
    const targetPath = path.join(workspaceRoot, CONSTRAINTS_FILE);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, manifest, 'utf-8');

    return manifest;
  } catch {
    return '';
  }
}
