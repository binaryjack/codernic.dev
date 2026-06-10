import type { ContextXRay } from '../../context-x-ray';
import type {
  ContextGarbageCollection,
  EvictionTarget,
  GarbageCollectionMetrics,
  GarbageCollectionPolicy,
} from '../types/context-gc.types';
import { ContextGarbageCollectionPrototype } from './context-gc';

/**
 * Factory creating a Garbage Collection pipeline bounded to a ContextXRay instance.
 * @param config The threshold constraints for sweeping.
 * @param xray The encapsulated context tracker module.
 */
export function createContextGarbageCollection(
  policy: GarbageCollectionPolicy,
  xray: ContextXRay,
): ContextGarbageCollection {
  // Private encapsulated state array of memory tracking targets.
  // Using Map for fast O(1) lookup on target access
  const trackingMap = new Map<string, EvictionTarget>();

  const instance = Object.create(ContextGarbageCollectionPrototype);

  instance.trackAccess = function (nodeId: string): void {
    const existing = trackingMap.get(nodeId);
    if (existing) {
      trackingMap.set(nodeId, {
        ...existing,
        lastAccessedAt: Date.now(),
        accessFrequency: existing.accessFrequency + 1,
      });
    } else {
      trackingMap.set(nodeId, {
        nodeId,
        lastAccessedAt: Date.now(),
        manualPin: false,
        accessFrequency: 1,
      });
    }
  };

  instance.setPinState = function (nodeId: string, isPinned: boolean): void {
    const existing = trackingMap.get(nodeId);
    if (existing) {
      trackingMap.set(nodeId, { ...existing, manualPin: isPinned });
    }
  };

  instance.unregisterNode = function (nodeId: string): void {
    trackingMap.delete(nodeId);
  };

  instance.sweepStaleNodes = function (): GarbageCollectionMetrics {
    const startTime = Date.now();

    // Evaluate stale using prototype pipeline
    const staleIds = this.evaluateStaleNodes(trackingMap, startTime, policy);
    const graph = xray.getGraph();

    // Compute total return metrics before we mutate the graph
    const metrics = this.sweepGraph(staleIds, graph, startTime);

    // Actively evict nodes from memory
    for (const evictedId of metrics.evictedNodeIds) {
      xray.removeNode(evictedId);
      trackingMap.delete(evictedId);
    }

    return metrics;
  };

  instance.getTargets = function (): ReadonlyArray<EvictionTarget> {
    return Object.freeze(Array.from(trackingMap.values()));
  };

  return instance as ContextGarbageCollection;
}
