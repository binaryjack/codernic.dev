import { SequenceConfig } from '../core/StateMachine';
import { SessionFactory } from '../factories/widgets/SessionFactory';
import { ChatFactory } from '../factories/widgets/ChatFactory';
import { SchemaFactory } from '../factories/widgets/SchemaFactory';
import { GalileusFactory } from '../factories/widgets/GalileusFactory';
import { AnalystFactory } from '../factories/widgets/AnalystFactory';
import { SettingsFactory } from '../factories/widgets/SettingsFactory';
import { EnterpriseChatbotFactory } from '../factories/widgets/EnterpriseChatbotFactory';
import { DiagnosticFactory } from '../factories/widgets/DiagnosticFactory';
import { ArtifactsFactory } from '../factories/widgets/ArtifactsFactory';
import { IntrospectionFactory } from '../factories/widgets/IntrospectionFactory';
import { TelemetryFactory } from '../factories/widgets/TelemetryFactory';
import { NotificationsFactory } from '../factories/widgets/NotificationsFactory';
import { AppFactory } from '../factories/widgets/AppFactory';

export const debugAllStatesSequence: SequenceConfig = {
  id: '99_Debug_All_States',
  name: '99. Debug All States Injection',
  initial: 'inject',
  states: {
    inject: {
      target: 'system-root',
      action: 'dispatch',
      payload: [
        // 1. Sessions Layout / List Statuses
        SessionFactory.createSetSessionsDispatch(),
        SessionFactory.createSetCurrentSessionDispatch(),

        // 2. Chat Feed / All Message variations, monologue, pirsig reports, plan CTAs
        ChatFactory.createDispatchAction(),
        ChatFactory.createSetSendingDispatch(),
        ChatFactory.createSetThinkingDispatch(),
        ChatFactory.createSetContextFilesDispatch(),

        // 3. Artifacts Panel
        ArtifactsFactory.createPopulateAction(),

        // 4. Introspection Monologue
        ...IntrospectionFactory.createMockIntrospectionDispatch(),

        // 5. Erathos Schema Canvas
        SchemaFactory.createDispatchAction(),

        // 6. Pirsig Compliance & Agent Events
        DiagnosticFactory.createDispatchAction(),
        ...GalileusFactory.createDispatchAction(),

        // 7. Analyst / Model Hub / Download states
        AnalystFactory.createMockAnalystSessionAction(),
        AnalystFactory.createSetCurrentAnalystSessionAction(),
        AnalystFactory.createCloudModelsAction(),
        AnalystFactory.createAnalyseProgressAction(),
        AnalystFactory.createMockSearchResultsAction(),
        AnalystFactory.createSetLocalModelsAction(),

        // 8. Settings Panels / Provider, Route configurations & Dual Form schemas
        SettingsFactory.createPopulateAction(),
        SettingsFactory.createLlmProvidersAction(),
        SettingsFactory.createLlmRoutesAction(),
        SettingsFactory.createSetJsonEditorSchemasAction(),

        // 9. Enterprise Chatbot Messages
        EnterpriseChatbotFactory.createInjectMessagesAction(),

        // 10. Global App State (Workspace name, daemon status)
        ...AppFactory.createDispatchActions(),

        // 11. Telemetry / Diagnostics
        ...TelemetryFactory.createDispatchActions(),

        // 12. Notifications (Toasts & History)
        ...NotificationsFactory.createDispatchActions()
      ]
    }
  }
};
