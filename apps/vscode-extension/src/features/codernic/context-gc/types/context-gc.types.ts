// Define strict types for the garbage collection cycle
export interface EvictionTarget {
  readonly nodeId: string;
  readonly lastAccessedAt: number;
  readonly manualPin: boolean;
  readonly accessFrequency: number;
}

export interface GarbageCollectionMetrics {
  readonly evictedNodeIds: ReadonlyArray<string>;
  readonly tokensRecovered: number;
  readonly generationTimeMs: number;
}

export interface GarbageCollectionPolicy {
  readonly staleThresholdMs: number;
  readonly strictLimitPinning: boolean;
}

export interface ContextGarbageCollection {
  readonly trackAccess: (nodeId: string) => void;
  readonly setPinState: (nodeId: string, isPinned: boolean) => void;
  readonly unregisterNode: (nodeId: string) => void;
  readonly sweepStaleNodes: () => GarbageCollectionMetrics;
  readonly getTargets: () => ReadonlyArray<EvictionTarget>;
}
