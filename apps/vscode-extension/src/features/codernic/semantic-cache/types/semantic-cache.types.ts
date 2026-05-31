export type SemanticHash = string;

export interface CacheEntry {
  readonly hash: SemanticHash;
  readonly originalQuery: string;
  readonly contextSignature: string; // Hash of the active context graph
  readonly responsePayload: string;
  readonly timestamp: number;
}

export interface CacheConfig {
  readonly ttlMilliseconds: number;
  readonly maxEntries: number;
}

export interface StorageAdapter {
  readonly read: (hash: SemanticHash) => Promise<CacheEntry | null>;
  readonly write: (entry: CacheEntry) => Promise<void>;
  readonly remove: (hash: SemanticHash) => Promise<void>;
  readonly clearAll: () => Promise<void>;
}

export interface SemanticCache {
  readonly store: (
    query: string,
    contextSignature: string,
    response: string,
  ) => Promise<SemanticHash>;
  readonly retrieve: (query: string, contextSignature: string) => Promise<CacheEntry | null>;
  readonly invalidateStale: () => Promise<void>;
}
