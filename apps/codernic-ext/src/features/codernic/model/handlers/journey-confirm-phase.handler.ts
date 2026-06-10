import type * as vscode from 'vscode';
import { confirmPhaseGate } from '../journey-handler';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const JourneyConfirmPhaseHandler = function (this: MessageHandler): void {};

JourneyConfirmPhaseHandler.prototype.handle = async function (
  this: MessageHandler,
  _payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceState, channel, reply } = context;

  if (!workspaceState) {
    return;
  }
  const newPhase = await confirmPhaseGate(
    workspaceState as vscode.ExtensionContext['workspaceState'],
    (l) => channel.appendLine(l),
  );
  reply({ type: 'codernic:journey-phase-advanced', payload: { currentPhase: newPhase } });
};
