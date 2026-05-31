/** Codernic mode definitions — controls permissions and context strategies. */

/** Mode type — controls what Codernic can do. */
export type CodernicMode = 'ask' | 'plan' | 'agent' | 'journey' | 'analyse';

/** Mode metadata — display info and context strategy. */
export type CodernicModeInfo = {
  label: string;
  emoji: string;
  topK: number;
  description: string;
};

/** Mode configuration — maps mode to UI and behavior. */
export const MODE_CONFIG: Record<CodernicMode, CodernicModeInfo> = {
  ask: {
    label: 'Ask',
    emoji: '💬',
    topK: 100,
    description: 'Q&A with comprehensive codebase context',
  },
  plan: {
    label: 'Plan',
    emoji: '📋',
    topK: 200,
    description: 'Design generation with extensive architectural context (no execution)',
  },
  agent: {
    label: 'Agent',
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
