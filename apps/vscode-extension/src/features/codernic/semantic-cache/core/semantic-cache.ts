import type { CacheConfig, CacheEntry, SemanticHash } from '../types/semantic-cache.types';

export const SemanticCachePrototype = {
  /**
   * Generates a deterministic hash for a given query and context signature.
   * This acts as the composite key for cache lookups.
   * Note: Despite the "semantic" name, this relies on a syntactic FNV hash
   * for exact-match retrieval, rather than true semantic embeddings.
   */
  generateCompositeHash(query: string, contextSignature: string): SemanticHash {
    const raw = `${query.trim().toLowerCase()}|${contextSignature}`;
    let hash = 0x811c9dc5; // FNV offset basis

    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return (hash >>> 0).toString(16);
  },

  /**
   * Creates a structured cache entry.
   */
  buildCacheEntry(
    query: string,
    contextSignature: string,
    responsePayload: string,
    hash: SemanticHash,
  ): CacheEntry {
    return {
      hash,
      originalQuery: query,
      contextSignature,
      responsePayload,
      timestamp: Date.now(),
    };
  },

  /**
   * Determines if a cache entry has exceeded its time-to-live.
   */
  isExpired(entry: CacheEntry, config: CacheConfig, currentTime: number): boolean {
    return currentTime - entry.timestamp > config.ttlMilliseconds;
  },
};
