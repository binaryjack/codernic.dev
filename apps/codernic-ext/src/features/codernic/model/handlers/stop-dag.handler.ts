import * as vscode from 'vscode';
import type { IntentHandler } from '../types/intent-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const StopDagHandler = function (this: IntentHandler): void {};

StopDagHandler.prototype.handle = async function (
  this: IntentHandler,
  payload: any,
  context: MessageContext,
): Promise<void> {
  await vscode.commands.executeCommand('codernic.stopDAG');
};
