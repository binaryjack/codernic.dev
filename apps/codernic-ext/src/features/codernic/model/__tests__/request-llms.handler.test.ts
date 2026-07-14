import { RequestLlmsHandler } from '../handlers/request-llms.handler';
import * as llmUtils from '../../../../shared/api/llm-utils';
import type { MessageContext } from '../types/message-context.types';

// Mock the dependencies
jest.mock('../../../../shared/api/llm-utils', () => ({
  broadcastLlms: jest.fn().mockResolvedValue(undefined),
  broadcastRouteProfiles: jest.fn().mockResolvedValue(undefined),
}));

describe('RequestLlmsHandler', () => {
  let mockReply: jest.Mock;
  let mockContext: MessageContext;
  let handler: any;

  beforeEach(() => {
    mockReply = jest.fn();
    mockContext = {
      reply: mockReply,
      context: {} as any,
      workspaceRoot: '/mock/workspace/root',
      channel: { appendLine: jest.fn() } as any,
    };
    
    // Create an instance of the handler function via prototype binding as used in the real router
    handler = {
      handle: RequestLlmsHandler.prototype.handle
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call broadcastLlms and broadcastRouteProfiles with correct parameters', async () => {
    await handler.handle({}, mockContext);

    expect(llmUtils.broadcastLlms).toHaveBeenCalledTimes(1);
    expect(llmUtils.broadcastLlms).toHaveBeenCalledWith(
      mockReply,
      mockContext.context,
      mockContext.workspaceRoot
    );

    expect(llmUtils.broadcastRouteProfiles).toHaveBeenCalledTimes(1);
    expect(llmUtils.broadcastRouteProfiles).toHaveBeenCalledWith(
      mockReply,
      mockContext.workspaceRoot
    );
  });
});
