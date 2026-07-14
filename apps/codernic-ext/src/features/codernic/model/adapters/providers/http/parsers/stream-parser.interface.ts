import type { StreamEvent } from '../../../llm-adapter.interface';

export interface StreamParserStrategy {
  parseChunk(chunk: string, onEvent: (event: StreamEvent) => void): { isDone: boolean; toolCalls: { id: string; name: string; args: string; thought_signature?: string }[], assistantContent: string };
}
