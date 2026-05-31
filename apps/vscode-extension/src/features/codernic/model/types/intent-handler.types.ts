import * as vscode from 'vscode';
import type { CodernicMode } from '../codernic-mode.types';
import type { CodernicIntent } from '../intent-detector';
import type { MessageContext } from './message-context.types';

export interface IntentHandler {
  handle: (
    intent: CodernicIntent,
    mode: CodernicMode,
    context: MessageContext,
    history?: { role: string; text: string }[],
    token?: vscode.CancellationToken,
  ) => Promise<boolean>;
}
