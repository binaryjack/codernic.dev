import type { StreamEvent } from '../../../llm-adapter.interface';
import type { StreamParserStrategy } from './stream-parser.interface';

export class OllamaStreamParser implements StreamParserStrategy {
  private toolCallsMap = new Map<string | number, { id: string; name: string; args: string }>();
  private assistantContent = '';

  parseChunk(chunk: string, onEvent: (event: StreamEvent) => void) {
    let isDone = false;
    
    try {
      const data = JSON.parse(chunk);
      if (data.message) {
        if (data.message.content) {
          this.assistantContent += data.message.content;
          onEvent({ type: 'token', chunk: data.message.content });
        }
        if (data.message.tool_calls) {
          for (const tc of data.message.tool_calls) {
            const idx = tc.index ?? 0;
            const existing = this.toolCallsMap.get(idx) || { id: '', name: '', args: '' };
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) {
              const args =
                typeof tc.function.arguments === 'string'
                  ? tc.function.arguments
                  : JSON.stringify(tc.function.arguments);
              existing.args += args;
            }
            if (!existing.id) existing.id = 'call_' + Math.random().toString(36).substring(2, 11);
            this.toolCallsMap.set(idx, existing);
          }
        }
      }
      if (data.done) isDone = true;
    } catch (e) {
      // Ignore partial JSON chunks
    }

    return {
      isDone,
      toolCalls: Array.from(this.toolCallsMap.values()).filter((tc) => tc.name),
      assistantContent: this.assistantContent
    };
  }
}
