import { clearSteps, loadManifest, saveManifest, type AnalyseProfile } from '../analyse-manifest';
import { runAnalysis } from '../analyse-runner';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const AnalyseRunHandler = function (this: MessageHandler): void {};

AnalyseRunHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, extensionPath, channel, reply } = context;
  const { llmId, profile, force, forceSection } = (payload ?? {}) as {
    llmId: string;
    profile?: AnalyseProfile;
    force?: boolean;
    forceSection?: string;
  };

  if (!llmId) {
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: '⚠️ No LLM selected.', done: true },
    });
    return;
  }

  if (force || forceSection) {
    const manifest = await loadManifest(workspaceRoot);
    let cleared;
    if (force) {
      cleared = clearSteps(manifest, 'all');
    } else if (forceSection === 'agents') {
      cleared = clearSteps(manifest, ['agent-generation']);
    } else if (forceSection === 'tech') {
      cleared = clearSteps(manifest, ['tech-identification']);
    } else if (forceSection === 'conventions') {
      cleared = clearSteps(manifest, ['convention-mining']);
    } else {
      cleared = manifest;
    }
    await saveManifest(workspaceRoot, cleared);
  }

  try {
    await runAnalysis({
      profile: profile ?? 'standard',
      llmId,
      workspaceRoot,
      extensionPath: extensionPath ?? '',
      onProgress: (p) => reply({ type: 'codernic:analyse-progress', payload: p }),
      onLog: (line) => channel.appendLine(line),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    reply({
      type: 'codernic:analyse-progress',
      payload: {
        steps: {
          'tech-identification': 'error',
          'convention-mining': 'error',
          'agent-generation': 'error',
        },
        currentStep: null,
        totalCostUSD: 0,
        errorMessage: errMsg,
      },
    });
  }
};
