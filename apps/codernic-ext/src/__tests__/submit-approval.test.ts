import { SubmitApprovalHandler } from '../features/codernic/model/handlers/submit-approval.handler';
import { sendApprovalResponse } from '../features/codernic/agent-mode/dag-runner';
import type { MessageContext } from '../features/codernic/model/types/message-context.types';

jest.mock('../features/codernic/agent-mode/dag-runner', () => ({
  sendApprovalResponse: jest.fn(),
}));

describe('SubmitApprovalHandler', () => {
  it('calls sendApprovalResponse with payload values', async () => {
    const handler = new (SubmitApprovalHandler as any)();
    const payload = {
      id: 'step-1',
      verdict: 'approve',
      feedback: 'Go ahead',
    };
    const mockContext = {} as MessageContext;

    await handler.handle(payload, mockContext);

    expect(sendApprovalResponse).toHaveBeenCalledTimes(1);
    expect(sendApprovalResponse).toHaveBeenCalledWith({
      id: 'step-1',
      verdict: 'approve',
      feedback: 'Go ahead',
    });
  });
});
