import { PhaseActivator, BootstrapContext } from './types';
import { TelemetryBridge } from '../telemetry-bridge';

export class TelemetryPhase implements PhaseActivator {
  name = 'Telemetry Phase';

  async activate(ctx: BootstrapContext): Promise<void> {
    const { vscodeContext, broadcastToUI } = ctx;
    const telemetryBridge = new TelemetryBridge(broadcastToUI);
    vscodeContext.subscriptions.push(telemetryBridge);
  }
}
