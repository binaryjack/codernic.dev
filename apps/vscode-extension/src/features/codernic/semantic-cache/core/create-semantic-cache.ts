import type {
  SemanticCache,
  StorageAdapter,
  CacheConfig,
  SemanticHash,
} from '../types/semantic-cache.types';
import { SemanticCachePrototype } from './semantic-cache';

/**
 * Factory for creating a Semantic Query Cache pipeline.
 * Binds an external storage adapter (e.g., SQLite or Memory) strictly without exposing it.
 *
 * @param storage Adapter responsible for data persistence.
 * @param config Configuration parameters like time-to-live and max entries.
 */
export function createSemanticCache(storage: StorageAdapter, config: CacheConfig): SemanticCache {
  const instance = Object.create(SemanticCachePrototype);

  instance.store = async function (
    query: string,
    contextSignature: string,
    response: string,
  ): Promise<SemanticHash> {
    const hash = this.generateCompositeHash(query, contextSignature);
    const entry = this.buildCacheEntry(query, contextSignature, response, hash);

    await storage.write(entry);
    return hash;
  };

  instance.retrieve = async function (
    query: string,
    contextSignature: string,
  ): Promise<ReturnType<StorageAdapter['read']>> {
    const hash = this.generateCompositeHash(query, contextSignature);
    const storedEntry = await storage.read(hash);

    if (!storedEntry) {
      return null;
    }

    const now = Date.now();
    if (this.isExpired(storedEntry, config, now)) {
      await storage.remove(hash);
      return null;
    }

    return storedEntry;
  };

  instance.invalidateStale = async function (): Promise<void> {
    // In a fully robust iteration, this would ask storage for all entries
    // to map over, but normally the adapter handles its own GC.
    // Stub implementation placeholder to enforce API design contract.
    await Promise.resolve();
  };

  return instance as SemanticCache;
}
