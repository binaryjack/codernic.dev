// Feature Slice: Semantic Query Caching
// Handles short-circuiting identical AI queries over identical context states to save tokens/latency.

export * from './types/semantic-cache.types';
export * from './core/create-semantic-cache';
