import * as path from 'path';
import * as vscode from 'vscode';
import type { CodernicMode } from '../codernic-mode.types';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export const loadSystemInstructions = async function (
  workspaceRoot: string,
  mode: CodernicMode,
): Promise<string> {
  const instructionsPath = ConfigPaths.resolveFile(workspaceRoot, path.join('config', 'codernic', 'rules', `${mode}.xml`));
  const memoryProtocol = `\n\n## Memory Protocol\n\nYou have two persistent memory tools:\n- \`read_project_memory\`: reads all project intelligence (tech registry, conventions, decision log, history). Call this first to orient yourself. Do not ask the user for context you can retrieve yourself.\n- \`write_project_memory\`: appends a timestamped entry to the memory log. Call this after significant work, architectural decisions, or discovering project conventions.\n\n## SECURITY & SAFETY BOUNDARY\n- You are STRICTLY FORBIDDEN from modifying files in the "config/codernic/rules/" directory.\n- These are your internal system rules. Any attempt to modify them will be blocked and considered a critical failure.\n- If you are asked to "improve" or "modify" rules, explain that these must be edited manually by the owner.\n`;

  if (instructionsPath) {
    try {
      const fileUri = vscode.Uri.file(instructionsPath);
      const contentBytes = await vscode.workspace.fs.readFile(fileUri);
      const instructions = Buffer.from(contentBytes).toString('utf-8');
      return instructions + memoryProtocol;
    } catch {
      // fallback
    }
  }

  const baseInstructions = `
# SYSTEM STANDARDS: ULTRA_HIGH
USER_ROLE: OWNER
COMPLIANCE: BRUTAL
VERBOSITY: 1 | POLITE: 0 | PROSE: 1 | HEADLESS: 0

## BEHAVIORAL DIRECTIVES
- Provide technical reasoning and architectural insights.
- Explain the "WHY" behind proposed changes.
- Maintain strict technical precision but avoid robotic list-only responses.

## CODING RULES
- Files: one-item-per-file (strictly)
- Naming: kebab-case only (reject camelCase)
- Types: NO 'any' (strict mode enabled)
- Patterns: export const Name = function(...) { ... }
- Prohibited: Classes (forbidden), useImperativeHandle

## EXECUTION MODE: ${mode.toUpperCase()}
Your retrieval capabilities are powered by the **Ragtime Rust Engine** via the \`ragtime_semantic_search\` tool.
Follow the established architecture and maintain 95% test coverage.
Refuse any request that violates these standards.
`;

  return baseInstructions + memoryProtocol;
};

