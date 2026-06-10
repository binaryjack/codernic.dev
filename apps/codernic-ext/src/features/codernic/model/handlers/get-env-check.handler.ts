import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const GetEnvCheckHandler = function (this: MessageHandler): void {};

GetEnvCheckHandler.prototype.handle = async function (
  this: MessageHandler,
  _payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, extensionPath, reply } = context;
  if (workspaceRoot && extensionPath) {
    const { getMissingRequiredPackages } = await import('../../../../shared/workspace-setup.js');
    const missing = await getMissingRequiredPackages(workspaceRoot, extensionPath);
    
    let extVersion = '0.0.0';
    try {
      const vscode = await import('vscode');
      extVersion = vscode.extensions.getExtension('binaryjack.codernic-ext')?.packageJSON.version || '0.0.0';
    } catch {
      // Ignored
    }

    reply({ type: 'codernic:env-check', payload: { missing, version: extVersion } });
  }
};
