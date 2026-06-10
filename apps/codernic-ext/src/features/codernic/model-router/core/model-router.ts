import type {
  ComplexityMatrix,
  TaskTopology,
  ModelEndpoint,
  ModelTier,
  RoutingDecision,
} from '../types/model-router.types';

export const ModelRouterPrototype = {
  /**
   * Analyzes the structural complexity of a user task based on instructions and context size.
   */
  evaluateComplexity(topology: TaskTopology): ComplexityMatrix {
    const text = topology.promptText.toLowerCase();

    // Heuristics for complexity
    const requiresExternalTools =
      (topology.availableToolsCount > 0 && text.includes('use tool')) || text.includes('search');
    const multiStepReasoning =
      text.includes('plan') ||
      text.includes('step by step') ||
      text.includes('architect') ||
      text.includes('analyze');

    // Instruction density proxy: count directives vs total words
    const directives = ['first', 'then', 'create', 'update', 'test', 'refactor', 'ensure', 'must'];
    let directiveCount = 0;
    directives.forEach((d) => {
      if (text.includes(d)) directiveCount++;
    });

    const words = text.split(/\s+/).length || 1;
    const instructionDensity = Math.min(directiveCount / words, 1.0);

    // Score based on context size and reasoning needs
    let structuralComplexityScore = 1; // Base score
    if (topology.totalContextTokens > 10000) structuralComplexityScore += 3;
    if (multiStepReasoning) structuralComplexityScore += 4;
    if (requiresExternalTools) structuralComplexityScore += 2;

    return {
      instructionDensity,
      requiresExternalTools,
      multiStepReasoning,
      structuralComplexityScore: Math.min(structuralComplexityScore, 10),
    };
  },

  /**
   * Determines the optimal model tier based on the complexity matrix.
   */
  determineTier(matrix: ComplexityMatrix): ModelTier {
    if (matrix.structuralComplexityScore >= 8 || matrix.multiStepReasoning) {
      return 'reasoning';
    }
    if (
      matrix.structuralComplexityScore >= 4 ||
      matrix.instructionDensity > 0.05 ||
      matrix.requiresExternalTools
    ) {
      return 'balanced';
    }
    return 'fast';
  },

  /**
   * Estimates cost based on the endpoint rates and topological size.
   * Assumes an output size average offset.
   */
  estimateCost(
    endpoint: ModelEndpoint,
    inputTokens: number,
    estOutputTokens: number = 500,
  ): number {
    return (
      (inputTokens / 1000) * endpoint.costPer1kInput +
      (estOutputTokens / 1000) * endpoint.costPer1kOutput
    );
  },
};
