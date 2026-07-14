import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';
import { SettingsFactory } from '../widgets/SettingsFactory';

export class SettingsTourStrategy implements PageStrategy {
  getEntryKey() {
    return 'settings_init_layout';
  }

  getInitActions() {
    return [
      SettingsFactory.createPopulateAction(),
      SettingsFactory.createLlmProvidersAction(),
      SettingsFactory.createLlmRoutesAction(),
      SettingsFactory.createSetJsonEditorSchemasAction()
    ];
  }

  getSequence(): Record<string, StepAction> {
    const sequence: Record<string, StepAction> = {
      'settings_init_layout': {
        target: 'layout-engine',
        action: 'introspection',
        payload: { method: 'switchLayout', args: ['Settings', true] },
        autoAdvance: true,
        next: 'settings_inject_data'
      },
      'settings_inject_data': {
        target: 'system-root',
        action: 'dispatch',
        payload: this.getInitActions(),
        autoAdvance: true,
        next: 'settings_models'
      }
    };

    // All settings widgets available in the Settings layout (no system-settings here)
    const widgets = [
      { id: 'models', label: 'Model', next: 'rules' },
      { id: 'rules', label: 'Rule', next: 'prompts' },
      { id: 'prompts', label: 'Prompt', next: 'agents' },
      { id: 'agents', label: 'Agent', next: 'dags' },
      { id: 'dags', label: 'DAG', next: 'techs' },
      { id: 'techs', label: 'Tech', next: 'routing' },
      { id: 'routing', label: 'Route', next: null }
    ];

    for (const w of widgets) {
      sequence[`settings_${w.id}`] = {
        target: `${w.id}-widget-root`,
        action: 'highlight',
        content: `[SETTINGS] Let's look at ${w.label} configuration.`,
        next: `settings_${w.id}_list`
      };
      sequence[`settings_${w.id}_list`] = {
        target: `${w.id}.widget-agnostic-editor-list`,
        action: 'highlight',
        content: `[SETTINGS] This is the exhaustive list of your registered ${w.id}.`,
        next: `settings_${w.id}_edit`
      };
      sequence[`settings_${w.id}_edit`] = {
        target: `${w.id}.widget-agnostic-editor-list-edit-item-0`,
        action: 'click',
        autoAdvance: true,
        next: `settings_${w.id}_form`
      };
      sequence[`settings_${w.id}_form`] = {
        target: `${w.id}.widget-agnostic-editor-form`,
        action: 'highlight',
        content: `[SETTINGS] With a powerful dual JSON/Form auto-generating editor.`,
        next: `settings_${w.id}_create`
      };
      sequence[`settings_${w.id}_create`] = {
        target: `${w.id}.widget-icon-plus`,
        action: 'highlight',
        content: `[SETTINGS] Scaffold new ${w.id} instantly from schemas.`
      };

      if (w.next) {
        sequence[`settings_${w.id}_create`].next = `settings_${w.next}`;
      }
    }

    // After the Settings layout widgets, navigate to the dedicated Admin layout for system settings
    sequence['settings_routing_create'].next = 'settings_admin_switch';

    sequence['settings_admin_switch'] = {
      target: 'layout-engine',
      action: 'introspection',
      payload: { method: 'switchLayout', args: ['Admin', true] },
      autoAdvance: true,
      next: 'settings_system'
    };

    sequence['settings_system'] = {
      target: 'system-widget-root',
      action: 'highlight',
      content: '[SETTINGS / ADMIN] System-level configuration: daemon process, ports, telemetry, and security settings.'
      // Next link dynamically patched by DemoEngine
    };

    return sequence;
  }
}

