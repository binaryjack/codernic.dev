import { SequenceConfig } from '../core/StateMachine';
import { DemoEngine } from '../factories/DemoEngine';
import { SessionsTourStrategy } from '../factories/pages/SessionsTourStrategy';
import { ChatTourStrategy } from '../factories/pages/ChatTourStrategy';
import { ArchitectTourStrategy } from '../factories/pages/ArchitectTourStrategy';
import { GalileusTourStrategy } from '../factories/pages/GalileusTourStrategy';
import { AnalystTourStrategy } from '../factories/pages/AnalystTourStrategy';
import { SettingsTourStrategy } from '../factories/pages/SettingsTourStrategy';
import { EnterpriseChatbotTourStrategy } from '../factories/pages/EnterpriseChatbotTourStrategy';

const demoEngine = new DemoEngine('99_exhaustiveDebugDemo', 'Global Exhaustive UI Debug Tour');

demoEngine
  .addPage(new SessionsTourStrategy())
  .addPage(new ChatTourStrategy())
  .addPage(new ArchitectTourStrategy())
  .addPage(new GalileusTourStrategy())
  .addPage(new AnalystTourStrategy())
  .addPage(new SettingsTourStrategy())
  .addPage(new EnterpriseChatbotTourStrategy());

export const exhaustiveDebugDemoSequence: SequenceConfig = demoEngine.build();

