import { describe, it, expect } from 'vitest';
import { call, select } from 'redux-saga/effects';
import { handleArtifactContentSuccess } from './dag.saga';
import { callMcpTool } from '../../../shared/api/mcp-client';

describe('Erathos MCP Schema Synchronization', () => {
  it('should parse erathos schema artifact and dispatch update_erathos_schema MCP call', () => {
    const mockSchema = { nodes: [{ id: '1' }], version: '1.0' };
    const action = {
      payload: {
        filename: 'session123_schema.md',
        content: `# Schema\n\n\`\`\`json\n${JSON.stringify(mockSchema)}\n\`\`\``
      }
    };

    const generator = handleArtifactContentSuccess(action);

    // 1. Select the current session ID
    const selectEffect = generator.next().value;
    expect(selectEffect.type).toBe('SELECT');

    // 2. Call the MCP tool
    const callEffect = generator.next('session123').value;
    expect(callEffect).toEqual(
      call(callMcpTool as any, 'update_erathos_schema', {
        session_id: 'session123',
        schema: mockSchema
      })
    );

    // 3. Generator should be done
    expect(generator.next().done).toBe(true);
  });
});
