import { DemoEngine } from '../../factories/DemoEngine';
import { ModelHubSetupStrategy } from '../../factories/pages/ModelHubSetupStrategy';
import type { SequenceConfig } from '../../core/StateMachine';

const engine = new DemoEngine('model-hub-setup-demo', '01. Model Hub & Provider Management Tour')
  .addPage(new ModelHubSetupStrategy());

export const modelHubSetupDemoSequence: SequenceConfig = engine.build();
