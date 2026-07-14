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
      const fs = await import('fs/promises');
      const path = await import('path');
      const pkgPath = path.join(extensionPath, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf8');
      extVersion = JSON.parse(pkgContent).version || '0.0.0';
    } catch (e) {
      console.warn('Failed to read extension version', e);
    }

    reply({ type: 'codernic:env-check', payload: { missing, version: extVersion } });
  }
};
