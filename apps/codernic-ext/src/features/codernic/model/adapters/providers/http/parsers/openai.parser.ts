import type { StreamEvent } from '../../../llm-adapter.interface';
import type { StreamParserStrategy } from './stream-parser.interface';

export class OpenAiStreamParser implements StreamParserStrategy {
  private toolCallsMap = new Map<string | number, { id: string; name: string; args: string }>();
  private assistantContent = '';

  parseChunk(chunk: string, onEvent: (event: StreamEvent) => void) {
    let isDone = false;

    if (chunk === 'data: [DONE]') {
      return {
        isDone: true,
        toolCalls: Array.from(this.toolCallsMap.values()).filter((tc) => tc.name),
        assistantContent: this.assistantContent
      };
    }

    if (chunk.startsWith('data: ')) {
      try {
        const data = JSON.parse(chunk.slice(6));
        const delta = data.choices[0]?.delta;

        if (delta?.content) {
          this.assistantContent += delta.content;
          onEvent({ type: 'token', chunk: delta.content });
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            const existing = this.toolCallsMap.get(idx) || { id: '', name: '', args: '' };
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.args += tc.function.arguments;
            this.toolCallsMap.set(idx, existing);
          }
        }
      } catch (e) {
        // Ignore partial chunk parse errors
      }
    }

    return {
      isDone,
      toolCalls: Array.from(this.toolCallsMap.values()).filter((tc) => tc.name),
      assistantContent: this.assistantContent
    };
  }
}
