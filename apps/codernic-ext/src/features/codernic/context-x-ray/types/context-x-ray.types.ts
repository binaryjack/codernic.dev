export type ContextNodeType = 'file' | 'rag-chunk' | 'terminal-output' | 'memory-node';

export interface TokenEstimate {
  readonly count: number;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContextNode {
  readonly id: string;
  readonly type: ContextNodeType;
  readonly uri: string;
  readonly contentSnapshot: string;
  readonly tokenEstimate: TokenEstimate;
  readonly inclusionReason: string;
  readonly timestamp: number;
}

export interface ContextGraph {
  readonly nodes: ReadonlyArray<ContextNode>;
  readonly totalTokens: number;
  readonly capacityStatus: 'optimal' | 'warning' | 'exceeded';
}

export interface ContextXRayConfig {
  readonly maxContextTokens: number;
  readonly warningThreshold: number;
}

export interface ContextXRay {
  readonly getGraph: () => ContextGraph;
  readonly addNode: (node: Omit<ContextNode, 'id' | 'timestamp' | 'tokenEstimate'>) => ContextNode;
  readonly removeNode: (id: string) => void;
  readonly clear: () => void;
  readonly calculateTokens: (content: string) => TokenEstimate;
}
