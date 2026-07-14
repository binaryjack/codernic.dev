/** Codernic mode definitions — controls permissions and context strategies. */

/** Mode type — controls what Codernic can do. */
export type CodernicMode = 'brainstorm' | 'plan' | 'builder' | 'journey' | 'analyse' | 'agent';

/** Mode metadata — display info and context strategy. */
export type CodernicModeInfo = {
  label: string;
  emoji: string;
  topK: number;
  description: string;
};

/** Mode configuration — maps mode to UI and behavior. */
export const MODE_CONFIG: Record<CodernicMode, CodernicModeInfo> = {
  brainstorm: {
    label: 'Brainstorm',
    emoji: '💡',
    topK: 100,
    description: 'Explore the codebase, brainstorm ideas, and generate sandboxed schemas',
  },
  plan: {
    label: 'Plan',
    emoji: '📋',
    topK: 200,
    description: 'Design generation with extensive architectural context (no execution)',
  },
  builder: {
    label: 'Builder',
    emoji: '⚡',
    topK: 300,
    description: 'Full command execution with maximum codebase context',
  },
  journey: {
    label: 'Journey',
    emoji: '🗺️',
    topK: 0,
    description: 'AI-driven 5-phase BA discovery — understands your project deeply',
  },
  analyse: {
    label: 'Analyse',
    emoji: '🔬',
    topK: 0,
    description: 'Automated codebase intelligence extraction — generates agent-ready artefacts',
  },
  agent: {
    label: 'Agent',
    emoji: '🤖',
    topK: 100,
    description: 'Execute DAG configuration files for autonomous background agents',
  },
};

/** Get display label for mode selector. */
export const getModeLabel = (mode: CodernicMode): string => {
  const info = MODE_CONFIG[mode];
  return `${info.emoji} ${info.label}`;
};

/** Get topK for mode-specific context gathering. */
export const getTopK = (mode: CodernicMode): number => {
  return MODE_CONFIG[mode].topK;
};
