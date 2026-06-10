/**
 * Shared types for AI Agencee VS Code Extension
 * Ported from legacy @ai-agencee/core to remove Node dependency
 */

export interface ContextWindowUI {
  currentTokens: number;
  maxTokens: number;
  usagePercent: number;
  costEstimate: number;
  lastUpdated: string;
  turnCount?: number;
  optimizedTurnCount: number;
  removedTurnsCount: number;
  compressionRatio: number;
  atCapacity: boolean;
  statusMessage: string;
  recommendations: string[];
}

export interface CodeSymbol {
  name: string;
  kind: string;
  line_start: number;
  start_line: number;
  startLine: number;
  start_char: number;
  end_line: number;
  endLine: number;
  end_char: number;
  file_path: string;
  filePath?: string;
  file_id?: number;
  type?: string;
  signature?: string;
  docstring?: string;
}

export interface IndexedFile {
  id?: number;
  file_path: string;
  relative_path: string;
  indexed_at: number;
  hash: string;
  content_hash: string;
}

export interface IndexStats {
  total_files: number;
  totalFiles: number;
  total_symbols: number;
  totalSymbols: number;
  totalDependencies: number;
  last_indexed: number;
  exists: boolean;
}
