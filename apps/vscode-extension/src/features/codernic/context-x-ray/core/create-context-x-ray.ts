import type {
  ContextGraph,
  ContextNode,
  ContextXRay,
  ContextXRayConfig,
} from '../types/context-x-ray.types';
import { ContextXRayPrototype } from './context-x-ray';

/**
 * Factory for creating a Context X-Ray observer.
 * Utilizes the prototype pattern and closures to enforce strict privacy
 * for the observed state context, ensuring no monolith leakage.
 */
export function createContextXRay(config: ContextXRayConfig): ContextXRay {
  // Private encapsulated state (Closure)
  let nodes: Array<ContextNode> = [];

  // Bind Prototype
  const instance = Object.create(ContextXRayPrototype);

  // Math.random base36 used for ID generation as crypto.randomUUID isn't always available in all extension contexts without stubbing
  const generateId = (): string =>
    Date.now().toString(36) + Math.random().toString(36).substring(2);

  // Define strictly typed instance operations
  instance.getGraph = function (): ContextGraph {
    // Pass read-only snapshot to prototype
    return this.buildGraph(
      Object.freeze([...nodes]),
      config.maxContextTokens,
      config.warningThreshold,
    );
  };

  instance.addNode = function (
    data: Omit<ContextNode, 'id' | 'timestamp' | 'tokenEstimate'>,
  ): ContextNode {
    const tokenEstimate = this.calculateTokens(data.contentSnapshot);
    const node: ContextNode = {
      ...data,
      id: generateId(),
      timestamp: Date.now(),
      tokenEstimate,
    };
    nodes.push(node);
    return node;
  };

  instance.removeNode = function (id: string): void {
    nodes = nodes.filter((n) => n.id !== id);
  };

  instance.clear = function (): void {
    nodes = [];
  };

  return instance as ContextXRay;
}
