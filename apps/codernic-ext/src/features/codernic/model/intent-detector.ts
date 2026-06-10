/** Intent detection for Codernic command handling. */

import type { CodernicMode } from './codernic-mode.types';

/** Detected intent — command type + extracted specification. */
export type CodernicIntent = {
  type:
    | 'create-agent'
    | 'create-dag'
    | 'run-dag'
    | 'list-agents'
    | 'index'
    | 'help'
    | 'analyse'
    | 'analyse-force'
    | 'analyse-force-section'
    | 'journey'
    | 'journey-reset'
    | 'galileus'
    | 'schema'
    | 'read-project-memory'
    | 'write-project-memory';
  spec: string;
  rawCommand?: string;
  /** For analyse-force-section: which section to force (tech | agents | conventions). */
  forceSection?: string;
};

/** Slash command pattern — optionally ignores @codernic prefix, then matches /command args. */
const SLASH_PATTERN = /^(?:@codernic\s+)?\/([a-z_-]+)(?:\s+(.+))?$/i;

/** Natural language patterns for intent detection. */
const INTENT_PATTERNS: Array<{ pattern: RegExp; type: CodernicIntent['type'] }> = [
  // Create agent patterns
  {
    pattern: /^(create|make|new|add|scaffold|build)\s+(an?\s+)?agent\s+(for|to|that)\s+(.+)/i,
    type: 'create-agent',
  },
  { pattern: /^(create|make|new|add)\s+(an?\s+)?(.+)\s+agent$/i, type: 'create-agent' },

  // Create DAG patterns
  {
    pattern: /^(create|make|build|scaffold|new)\s+(a\s+)?(dag|workflow)\s+(for|to)\s+(.+)/i,
    type: 'create-dag',
  },
  { pattern: /^(build|create)\s+(a\s+)?workflow\s+(.+)/i, type: 'create-dag' },

  // Run DAG patterns
  { pattern: /^(run|execute|start)\s+(the\s+)?(dag|workflow)/i, type: 'run-dag' },
  { pattern: /^(run|execute)\s+(.+\.dag\.json)/i, type: 'run-dag' },

  // List agents
  { pattern: /^(list|show|display|get)\s+(all\s+)?(agents|agent\s+list)/i, type: 'list-agents' },

  // Index codebase — utility command, available in all modes
  {
    pattern:
      /^(index|reindex|re-index|rebuild\s+index|scan\s+codebase|index\s+codebase|index\s+the\s+codebase)/i,
    type: 'index',
  },

  // Help
  { pattern: /^(help|what\s+can\s+you\s+do|commands|show\s+commands)/i, type: 'help' },
];

/** Detect intent from user message. Returns null if no command detected. */
export const detectIntent = function (text: string, mode: CodernicMode): CodernicIntent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Try slash command first — /index, /analyse, /journey are available in all modes
  const slashMatch = trimmed.match(SLASH_PATTERN);
  if (slashMatch) {
    const [, command, args] = slashMatch;
    const commandLower = command.toLowerCase();

    // /index is a utility command available in all modes (including ask)
    if (commandLower === 'index' || commandLower === 'reindex') {
      return { type: 'index', spec: '', rawCommand: trimmed };
    }

    if (commandLower === 'read-project-memory' || commandLower === 'read_project_memory') {
      return { type: 'read-project-memory', spec: args || '', rawCommand: trimmed };
    }

    if (commandLower === 'write-project-memory' || commandLower === 'write_project_memory') {
      return { type: 'write-project-memory', spec: args || '', rawCommand: trimmed };
    }

    // /analyse and /journey are utility commands available in all modes
    if (commandLower === 'analyse' || commandLower === 'analyze') {
      const argsLower = (args ?? '').toLowerCase().trim();
      if (argsLower === '--force') {
        return { type: 'analyse-force', spec: '', rawCommand: trimmed };
      }
      if (argsLower.startsWith('--force ')) {
        const section = argsLower.replace('--force ', '').trim();
        return {
          type: 'analyse-force-section',
          spec: '',
          rawCommand: trimmed,
          forceSection: section,
        };
      }
      // Optional profile flag: /analyse --profile starter|standard|enterprise
      return { type: 'analyse', spec: args || '', rawCommand: trimmed };
    }

    if (commandLower === 'journey') {
      const argsLower = (args ?? '').toLowerCase().trim();
      if (argsLower === 'reset') {
        return { type: 'journey-reset', spec: '', rawCommand: trimmed };
      }
      return { type: 'journey', spec: args || '', rawCommand: trimmed };
    }

    // /galileus — multi-session coordination, available in all modes
    if (commandLower === 'galileus') {
      return { type: 'galileus', spec: args || '', rawCommand: trimmed };
    }

    // All other slash commands are blocked in Ask mode
    if (mode === 'ask') return null;

    // Map slash commands to intent types
    switch (commandLower) {
      case 'create-agent':
      case 'agent':
        if (mode === 'plan') return null;
        return { type: 'create-agent', spec: args || '', rawCommand: trimmed };
      case 'create-dag':
      case 'dag':
        if (mode === 'plan') return null;
        return { type: 'create-dag', spec: args || '', rawCommand: trimmed };
      case 'run-dag':
      case 'run':
        if (mode === 'plan') return null;
        return { type: 'run-dag', spec: args || '', rawCommand: trimmed };
      case 'list-agents':
      case 'agents':
        return { type: 'list-agents', spec: '', rawCommand: trimmed };
      case 'help':
        return { type: 'help', spec: '', rawCommand: trimmed };
      default:
        return null;
    }
  }

  // Ask and Plan mode: NL commands disabled (except utility slash commands above)
  // This ensures behavior is driven by LLM + XML rules in Plan mode, not hardcoded intents.
  if (mode === 'ask' || mode === 'plan' || mode === 'journey') return null;

  // Try natural language patterns (agent mode only)
  for (const { pattern, type } of INTENT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      // Extract specification from capture groups (usually last group)
      const spec = match.slice(1).filter(Boolean).pop() || '';
      return { type, spec, rawCommand: trimmed };
    }
  }

  return null;
};

/** Get help text for available commands. */
export const getCommandHelp = function (mode: CodernicMode): string {
  const utilityBlock = `\n\n**Utility commands (all modes):**\n- \`/index\` — Index or re-index the codebase\n- \`/analyse\` — Extract codebase intelligence artefacts\n- \`/analyse --force\` — Re-run full analysis (ignores cache)\n- \`/analyse --force agents\` — Re-run agent generation step only\n- \`/journey\` — Start or resume the 5-phase BA discovery\n- \`/journey reset\` — Clear journey state and start fresh\n- \`/galileus\` — Show Galileus multi-session workspace state\n- \`/galileus declare <session> <file:type>\` — Declare a session intent with file claims\n- \`/galileus resolve <session>\` — Resolve a session and unblock its waiters`;

  if (mode === 'ask') {
    return `💬 **Ask Mode** — Safe Q&A only (NL commands disabled)\n\nI can answer questions about your codebase using live workspace analysis.${utilityBlock}\n\n💡 Ctrl+Enter to send · ↑↓ browse history`;
  }

  if (mode === 'journey') {
    return `🗺️ **Journey Mode** — AI-driven 5-phase BA discovery\n\nThe BA agent reads your codebase first, then guides you through 5 structured phases to produce a complete sprint plan.\n\n**Phases:** Discovery → Architecture → Decomposition → Wiring → Validation\n\n**Commands:**\n- \`/journey reset\` — Clear current journey and start fresh${utilityBlock}\n\n💡 Ctrl+Enter to send · ↑↓ browse history`;
  }

  if (mode === 'analyse') {
    return `🔬 **Analyse Mode** — Automated codebase intelligence\n\nScans your project and generates structured artefacts used to customise every Codernic agent.\n\n**Commands:**\n- \`/analyse\` — Run analysis (skips unchanged steps)\n- \`/analyse --force\` — Force full re-analysis\n- \`/analyse --force agents\` — Re-run agent generation only\n- \`/analyse --profile starter|standard|enterprise\` — Select analysis depth${utilityBlock}\n\n💡 Ctrl+Enter to send · ↑↓ browse history`;
  }

  if (mode === 'plan') {
    return `📋 **Plan Mode** — Design generation (no execution)\n\n**Natural Language:**\n- "create an agent for testing"\n- "build a DAG for code review"\n\n**Slash Commands:**\n- \`/create-agent [description]\`\n- \`/create-dag [description]\`\n- \`/list-agents\`${utilityBlock}\n\nI'll create designs and plans but won't execute them automatically.\n\n💡 Ctrl+Enter to send · ↑↓ browse history`;
  }

  // Agent mode
  return `⚡ **Agent Mode** — Full execution\n\n**Commands:**\n- \`/create-agent <name>\` — Scaffold a new \`.agent.json\`\n- \`/create-dag <name>\` — Scaffold a new \`.dag.json\` workflow\n- \`/run-dag <name>\` — Execute a DAG with live lane progress\n- \`/list-agents\` — List all agents in the project\n\n**Natural Language also works:**\n- "create a security agent"\n- "build a code-review workflow"${utilityBlock}\n\n💡 Ctrl+Enter to send · ↑↓ browse history`;
};
