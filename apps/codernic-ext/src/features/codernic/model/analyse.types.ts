/** analyse.types.ts — Strong types for the intelligence extraction pipeline. */

export interface TechRegistry {
  technologies: Array<{
    name: string;
    version?: string;
    category: string;
    confidence: number;
  }>;
  generatedAt?: string;
}

export interface ConventionRule {
  name: string;
  pattern: string;
  rationale: string;
  category: 'styling' | 'architecture' | 'naming' | 'testing';
}

export interface Conventions {
  rules: ConventionRule[];
  generatedAt?: string;
}

export interface AgentRule {
  filename: string;
  content: string;
}

export interface AgentGenerationResult {
  rules: AgentRule[];
  agentHints: {
    primaryStack: string[];
    conventionsSummary: string;
    projectContext: string;
    generatedAt?: string;
  };
}
