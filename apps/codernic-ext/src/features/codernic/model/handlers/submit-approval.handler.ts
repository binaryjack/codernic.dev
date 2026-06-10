import { sendApprovalResponse } from '../../agent-mode/dag-runner';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { activeChatManager } from './chat.handler';

export const SubmitApprovalHandler = function (this: MessageHandler): void {};

SubmitApprovalHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { id, verdict, feedback } = payload as {
    id: string;
    verdict: 'approve' | 'reject';
    feedback?: string;
  };
  
  if (activeChatManager) {
    activeChatManager.write({ id, verdict, feedback });
  } else {
    sendApprovalResponse({ id, verdict, feedback });
  }
};
