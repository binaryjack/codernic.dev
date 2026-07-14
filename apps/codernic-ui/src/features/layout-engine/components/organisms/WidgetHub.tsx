import React from 'react';
import { useLayoutEngine } from '@ai-agencee/ui/layout-engine';
import { IconThought, IconBot, IconZap, IconLayers, IconSession, IconFolder, IconSettings, IconShield, IconActivity, IconFileText } from '@ai-agencee/ui';
export type WidgetType = 'chat' | 'introspection' | 'analyse' | 'model-hub' | 'cloud-model-hub' | 'erathos' | 'galileus-router' | 'vblock' | 'sessions' | 'models-settings' | 'rules-settings' | 'prompts-settings' | 'routing-settings' | 'system-settings' | 'pirsig-widget' | 'agent-events-widget' | 'agents' | 'dags' | 'technologies' | 'sandbox' | 'artifacts' | 'benchmark-widget' | 'my-system-dashboard' | 'shield-proxy' | 'welcome-dashboard' | 'model-selection-card';

export const WIDGET_DEF: { type: WidgetType; label: string; icon: any }[] = [
  { type: 'sessions', label: 'Sessions', icon: IconSession },
  { type: 'chat', label: 'Chat Area', icon: IconBot },
  { type: 'agents', label: 'Agents', icon: IconBot },
  { type: 'dags', label: 'DAGs', icon: IconZap },
  { type: 'technologies', label: 'Technologies', icon: IconLayers },
  { type: 'introspection', label: 'Introspection', icon: IconThought },
  { type: 'analyse', label: 'Analyse', icon: IconLayers },
  { type: 'model-hub', label: 'Local Models', icon: IconBot },
  { type: 'cloud-model-hub', label: 'Cloud Models', icon: IconBot },
  { type: 'erathos', label: 'Erathos DAG', icon: IconZap },
  { type: 'galileus-router', label: 'Galileus Router', icon: IconActivity },
  { type: 'pirsig-widget', label: 'Pirsig Quality', icon: IconShield },
  { type: 'agent-events-widget', label: 'Agent Events', icon: IconActivity },
  { type: 'models-settings', label: 'Model Settings', icon: IconSettings },
  { type: 'rules-settings', label: 'System Rules', icon: IconSettings },
  { type: 'prompts-settings', label: 'Prompts', icon: IconSettings },
  { type: 'routing-settings', label: 'Routing', icon: IconSettings },
  { type: 'system-settings', label: 'System', icon: IconSettings },
  { type: 'vblock', label: 'Empty VBlock', icon: IconFolder },
  { type: 'sandbox', label: 'Sandbox Mode', icon: IconShield },
  { type: 'artifacts', label: 'Artifacts', icon: IconFileText },
  { type: 'benchmark-widget', label: 'Model Benchmarks', icon: IconActivity },
  { type: 'my-system-dashboard', label: 'System Dashboard', icon: IconActivity },
  { type: 'shield-proxy', label: 'Shield Proxy', icon: IconShield },
  { type: 'welcome-dashboard', label: 'Welcome Dashboard', icon: IconActivity },
  { type: 'model-selection-card', label: 'Model Selection Card', icon: IconActivity }
];

export function WidgetHub() {
  const { state } = useLayoutEngine();
  const isEditMode = state.isEditMode;

  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/codernic-widget', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const activeWidgetTypes = new Set(
    Object.values(state.blocks)
      .filter(b => b.type === 'widget' && b.widgetType)
      .map(b => b.widgetType)
  );

  if (!isEditMode) return null;

  return (
    <div className="w-64 border-l border-zinc-800/50 bg-[#131316] p-4 flex flex-col gap-2 h-full overflow-y-auto shrink-0 z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Widget Palette</h3>
      <div className="flex flex-col gap-2">
        {WIDGET_DEF.map(def => {
          const isActive = activeWidgetTypes.has(def.type);
          return (
            <div 
              key={def.type}
              draggable
              onDragStart={(e) => onDragStart(e, def.type)}
              className={`flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition-colors relative overflow-hidden ${isActive ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <def.icon size={16} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">{def.label}</span>
              </div>
              {isActive && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  Placé
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
