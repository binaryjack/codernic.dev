import type { ContextGraph } from '../../context-x-ray';
import type {
  EvictionTarget,
  GarbageCollectionMetrics,
  GarbageCollectionPolicy,
} from '../types/context-gc.types';

export const ContextGarbageCollectionPrototype = {
  /**
   * Identifies stale nodes that have exceeded the eviction threshold.
   * Nodes that are manually pinned override the stale threshold unless strict limiting applies.
   */
  evaluateStaleNodes(
    targets: Map<string, EvictionTarget>,
    currentTime: number,
    policy: GarbageCollectionPolicy,
  ): ReadonlyArray<string> {
    const staleIds: string[] = [];

    for (const [nodeId, target] of targets.entries()) {
      if (target.manualPin && !policy.strictLimitPinning) {
        continue;
      }

      const elapsedMs = currentTime - target.lastAccessedAt;
      if (elapsedMs >= policy.staleThresholdMs) {
        staleIds.push(nodeId);
      }
    }

    return Object.freeze(staleIds);
  },

  /**
   * Sweeps a ContextGraph based on the identified stale targets,
   * calculating exact tokens recovered.
   */
  sweepGraph(
    staleIds: ReadonlyArray<string>,
    graphSnapshot: ContextGraph,
    startTime: number,
  ): GarbageCollectionMetrics {
    let tokensRecovered = 0;
    const evictedIds: string[] = [];

    // Loop logic to match stale ID against active context nodes
    const evictionSet = new Set(staleIds);
    for (const node of graphSnapshot.nodes) {
      if (evictionSet.has(node.id)) {
        tokensRecovered += node.tokenEstimate.count;
        evictedIds.push(node.id);
      }
    }

    return {
      evictedNodeIds: Object.freeze(evictedIds),
      tokensRecovered,
      generationTimeMs: Date.now() - startTime,
    };
  },
};
