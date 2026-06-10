export type ModelTier = 'fast' | 'balanced' | 'reasoning';

export interface ModelEndpoint {
  readonly id: string;
  readonly name: string;
  readonly tier: ModelTier;
  readonly maxContextTokens: number;
  readonly costPer1kInput: number;
  readonly costPer1kOutput: number;
}

export interface ComplexityMatrix {
  readonly instructionDensity: number; // 0.0 to 1.0
  readonly requiresExternalTools: boolean;
  readonly multiStepReasoning: boolean;
  readonly structuralComplexityScore: number; // 1 to 10
}

export interface RoutingDecision {
  readonly selectedModelId: string;
  readonly selectedTier: ModelTier;
  readonly explanation: string;
  readonly estimatedCost: number;
}

export interface TaskTopology {
  readonly promptText: string;
  readonly totalContextTokens: number;
  readonly availableToolsCount: number;
}

export interface ModelRouterConfig {
  readonly defaultFastModel: string;
  readonly defaultBalancedModel: string;
  readonly defaultReasoningModel: string;
  readonly strictCostLimitMax?: number; // threshold to force lower tiers
}

export interface ModelRouter {
  readonly registerEndpoint: (endpoint: ModelEndpoint) => void;
  readonly routeTask: (topology: TaskTopology) => RoutingDecision;
  readonly getRegisteredEndpoints: () => ReadonlyArray<ModelEndpoint>;
}
