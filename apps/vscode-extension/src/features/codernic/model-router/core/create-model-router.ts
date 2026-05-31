import type {
  ModelRouter,
  ModelRouterConfig,
  ModelEndpoint,
  TaskTopology,
  RoutingDecision,
  ModelTier,
} from '../types/model-router.types';
import { ModelRouterPrototype } from './model-router';

/**
 * Factory for creating a Smart Model Router capable of dynamically selecting the most cost-efficient
 * LLM endpoint that meets the query's complexity requirements.
 */
export function createModelRouter(config: ModelRouterConfig): ModelRouter {
  const registeredEndpoints = new Map<string, ModelEndpoint>();

  const instance = Object.create(ModelRouterPrototype);

  instance.registerEndpoint = function (endpoint: ModelEndpoint): void {
    registeredEndpoints.set(endpoint.id, endpoint);
  };

  instance.getRegisteredEndpoints = function (): ReadonlyArray<ModelEndpoint> {
    return Object.freeze(Array.from(registeredEndpoints.values()));
  };

  instance.routeTask = function (topology: TaskTopology): RoutingDecision {
    const complexityMatrix = this.evaluateComplexity(topology);
    const requiredTier: ModelTier = this.determineTier(complexityMatrix);

    // Select the appropriate configured default endpoint based on the required tier
    let targetEndpointId: string;
    switch (requiredTier) {
      case 'fast':
        targetEndpointId = config.defaultFastModel;
        break;
      case 'balanced':
        targetEndpointId = config.defaultBalancedModel;
        break;
      case 'reasoning':
        targetEndpointId = config.defaultReasoningModel;
        break;
      default:
        targetEndpointId = config.defaultFastModel; // Fallback
    }

    const targetEndpoint = registeredEndpoints.get(targetEndpointId);
    if (!targetEndpoint) {
      // Fallback if the configured model isn't registered
      const fallback = Array.from(registeredEndpoints.values())[0];
      if (!fallback) throw new Error('No model endpoints registered for routing.');

      return {
        selectedModelId: fallback.id,
        selectedTier: fallback.tier,
        explanation: `Fallback to lowest available tier. Required: ${requiredTier}`,
        estimatedCost: this.estimateCost(fallback, topology.totalContextTokens),
      };
    }

    const estimatedCost = this.estimateCost(targetEndpoint, topology.totalContextTokens);

    // Reason text to give user feedback
    const explanationDetails = `Score: ${complexityMatrix.structuralComplexityScore}/10 | Cost: $${estimatedCost.toFixed(4)}`;

    return {
      selectedModelId: targetEndpoint.id,
      selectedTier: targetEndpoint.tier,
      explanation: `Routed to ${targetEndpoint.name} (${requiredTier} tier). ${explanationDetails}`,
      estimatedCost,
    };
  };

  return instance as ModelRouter;
}
