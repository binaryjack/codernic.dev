// ── Tech Catalog Feature — Public API ────────────────────────────────────────
// Feature-Sliced Design: All cross-feature imports must go through this index.

// Tree provider API
export { TcTreeProvider } from './api/tc-tree-provider';
export { TcItemInstance } from './model/tc-item';

// Store APIs
export { resolveAgentsDir, writeAgent } from './model/agent-store';
export { resolvePromptsDir, resolveRulesDir } from './model/rules-store';
export { resolveTechsDir, writeTech } from './model/tech-store';

// Commands
export { registerTcCommands } from './api/register-tc-commands';

// Types
export type { AgentEntry, DagEntry } from './model/agent-store';
export type { PromptEntry, RuleEntry } from './model/rules-store';
export type { TechEntry } from './model/tech-store';
