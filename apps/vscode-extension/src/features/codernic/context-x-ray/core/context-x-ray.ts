import type { ContextGraph, ContextNode, TokenEstimate } from '../types/context-x-ray.types';

export const ContextXRayPrototype = {
  calculateTokens(content: string): TokenEstimate {
    // Standard heuristic: 1 token ~= 4 characters for English text and code
    const count = Math.ceil(content.length / 4);
    let severity: TokenEstimate['severity'] = 'low';

    if (count > 32000) {
      severity = 'critical';
    } else if (count > 8000) {
      severity = 'high';
    } else if (count > 2000) {
      severity = 'medium';
    }

    return { count, severity };
  },

  buildGraph(
    nodes: ReadonlyArray<ContextNode>,
    maxContextTokens: number,
    warningThreshold: number,
  ): ContextGraph {
    const totalTokens = nodes.reduce((acc, node) => acc + node.tokenEstimate.count, 0);

    let capacityStatus: ContextGraph['capacityStatus'] = 'optimal';
    if (totalTokens >= maxContextTokens) {
      capacityStatus = 'exceeded';
    } else if (totalTokens >= maxContextTokens * warningThreshold) {
      capacityStatus = 'warning';
    }

    return {
      nodes,
      totalTokens,
      capacityStatus,
    };
  },
};
