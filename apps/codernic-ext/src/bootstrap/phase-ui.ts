import { PhaseActivator, BootstrapContext } from './types';
import { registerWebSocketAndGetBroadcastAndMcp } from '../shared/web-socket/web-socket-server';
import { initLlmRunner } from '../features/codernic/model/llm-runner';

export class UIPhase implements PhaseActivator {
  name = 'UI & Core Phase';

  async activate(ctx: BootstrapContext): Promise<void> {
    const { vscodeContext, channel, workspaceRoot, mcpManager, extStatusBar } = ctx;

    initLlmRunner(vscodeContext, mcpManager);

    const [broadcastToUI, _] = registerWebSocketAndGetBroadcastAndMcp(
      vscodeContext,
      mcpManager,
      workspaceRoot,
      channel,
      extStatusBar
    ) as [(payload: unknown) => void, any];

    ctx.broadcastToUI = broadcastToUI;
  }
}
