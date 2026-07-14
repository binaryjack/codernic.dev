import { lazy } from 'react';
import { CloudModelHubWidget } from '../../ockham/widget/cloud-model-hub.widget';

export interface WidgetConfig {
  type: string;
  component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
  requiredActors?: string[];
  id?: string;
  name?: string;
  description?: string;
  defaultSize?: { minWidth: number, minHeight: number };
  icon?: string;
}

export const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  'cloud-model-hub': {
    type: 'cloud-model-hub',
    id: 'cloud-model-hub',
    name: 'Cloud Model Hub',
    description: 'Cloud provider models config',
    component: CloudModelHubWidget,
    defaultSize: { minWidth: 300, minHeight: 400 },
    icon: 'hub'
  },
  'chat': {
    type: 'chat',
    component: lazy(() => import('../../chat/widget/chat.widget').then(m => ({ default: m.ChatWidget }))),
    requiredActors: ['Daemon']
  },
  'introspection': {
    type: 'introspection',
    component: lazy(() => import('../../introspection/widget/introspection.widget').then(m => ({ default: m.IntrospectionWidget }))),
    requiredActors: ['Daemon']
  },
  'artifacts': {
    type: 'artifacts',
    component: lazy(() => import('../../artifacts/widget/artifacts.widget').then(m => ({ default: m.ArtifactsWidget }))),
    requiredActors: []
  },
  'erathos': {
    type: 'erathos',
    component: lazy(() => import('../../erathos/widget/erathos.widget').then(m => ({ default: m.ErathosWidget }))),
    requiredActors: []
  },
  'galileus-router': {
    type: 'galileus-router',
    component: lazy(() => import('../../galileus-router/widget/galileus-router.widget').then(m => ({ default: m.GalileusRouterWidget }))),
    requiredActors: ['Daemon']
  },
  'galileus-topology': {
    type: 'galileus-topology',
    component: lazy(() => import('../../dag/components/organisms/GalileusTopologyWidget').then(m => ({ default: m.GalileusTopologyWidget }))),
    requiredActors: ['Daemon']
  },
  'galileus-daw': {
    type: 'galileus-daw',
    component: lazy(() => import('../../dag/components/organisms/GalileusDawWidget').then(m => ({ default: m.GalileusDawWidget }))),
    requiredActors: ['Daemon']
  },
  'model-hub': {
    type: 'model-hub',
    component: lazy(() => import('../../model-hub/widget/model-hub.widget').then(m => ({ default: m.ModelHubWidget }))),
    requiredActors: []
  },
  'analyse': {
    type: 'analyse',
    component: lazy(() => import('../../analyse/widget/analyse.widget').then(m => ({ default: m.AnalyseWidget }))),
    requiredActors: []
  },
  'sessions': {
    type: 'sessions',
    component: lazy(() => import('../../sessions/widget/session.widget').then(m => ({ default: m.SessionWidget }))),
    requiredActors: []
  },
  'models-settings': {
    type: 'models-settings',
    component: lazy(() => import('../../settings/widget/models.widget').then(m => ({ default: m.ModelsWidget }))),
    requiredActors: []
  },
  'rules-settings': {
    type: 'rules-settings',
    component: lazy(() => import('../../settings/widget/rules.widget').then(m => ({ default: m.RulesWidget }))),
    requiredActors: []
  },
  'prompts-settings': {
    type: 'prompts-settings',
    component: lazy(() => import('../../settings/widget/prompts.widget').then(m => ({ default: m.PromptsWidget }))),
    requiredActors: []
  },
  'routing-settings': {
    type: 'routing-settings',
    component: lazy(() => import('../../settings/widget/routing.widget').then(m => ({ default: m.RoutingWidget }))),
    requiredActors: []
  },
  'system-settings': {
    type: 'system-settings',
    component: lazy(() => import('../../settings/widget/system.widget').then(m => ({ default: m.SystemWidget }))),
    requiredActors: ['Daemon']
  },
  'pirsig-widget': {
    type: 'pirsig-widget',
    component: lazy(() => import('../../diagnostic-dashboard/widget/pirsig.widget').then(m => ({ default: m.PirsigWidget }))),
    requiredActors: ['Daemon']
  },
  'agent-events-widget': {
    type: 'agent-events-widget',
    component: lazy(() => import('../../diagnostic-dashboard/widget/agent-events.widget').then(m => ({ default: m.AgentEventsWidget }))),
    requiredActors: ['Daemon']
  },
  'agents': {
    type: 'agents',
    component: lazy(() => import('../../agents/widget/agents.widget').then(m => ({ default: m.AgentsWidget }))),
    requiredActors: ['Daemon']
  },
  'dags': {
    type: 'dags',
    component: lazy(() => import('../../dags/widget/dags.widget').then(m => ({ default: m.DagsWidget }))),
    requiredActors: ['Daemon']
  },
  'technologies': {
    type: 'technologies',
    component: lazy(() => import('../../techs/widget/techs.widget').then(m => ({ default: m.TechsWidget }))),
    requiredActors: []
  },
  'enterprise-chatbot': {
    type: 'enterprise-chatbot',
    component: lazy(() => import('../../enterprise-chatbot/widget/enterprise-chatbot.widget').then(m => ({ default: m.EnterpriseChatbotWidget }))),
    requiredActors: []
  },
  'sandbox': {
    type: 'sandbox',
    component: lazy(() => import('../../../widgets/sandbox/SandboxWidget').then(m => ({ default: m.SandboxWidget }))),
    requiredActors: []
  },
  'benchmark-widget': {
    type: 'benchmark-widget',
    component: lazy(() => import('../../chat/components/organisms/benchmark-widget').then(m => ({ default: m.BenchmarkWidget }))),
    requiredActors: []
  },
  'my-system-dashboard': {
    type: 'my-system-dashboard',
    component: lazy(() => import('../../../widgets/settings/ui/MySystemDashboard').then(m => ({ default: m.MySystemDashboard }))),
    requiredActors: []
  },
  'shield-proxy': {
    type: 'shield-proxy',
    component: lazy(() => import('../../../widgets/shield-proxy/ui/ShieldProxyWidget').then(m => ({ default: m.ShieldProxyWidget }))),
    requiredActors: []
  },
  'welcome-dashboard': {
    type: 'welcome-dashboard',
    component: lazy(() => import('../../../widgets/onboarding/ui/WelcomeDashboard').then(m => ({ default: m.WelcomeDashboard }))),
    requiredActors: []
  },
  'model-selection-card': {
    type: 'model-selection-card',
    component: lazy(() => import('../../../widgets/models-hub/ui/ModelSelectionWidget').then(m => ({ default: m.ModelSelectionWidget }))),
    requiredActors: []
  }
};
