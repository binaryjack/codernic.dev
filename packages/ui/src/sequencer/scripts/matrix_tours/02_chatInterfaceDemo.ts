import { DemoEngine } from '../../factories/DemoEngine';
import { ChatInterfaceStrategy } from '../../factories/pages/ChatInterfaceStrategy';
import type { SequenceConfig } from '../../core/StateMachine';

const engine = new DemoEngine('chat-interface-demo', '02. Interactive Chat & Prompts Tour')
  .addPage(new ChatInterfaceStrategy());

export const chatInterfaceDemoSequence: SequenceConfig = engine.build();
