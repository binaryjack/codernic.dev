import { useState } from 'react';
import { Button } from '@ai-agencee/ui';
import { IconX } from '@ai-agencee/ui';

import { ModelsTab } from './models-tab';

import { RulesTab } from './rules-tab';
import { PromptsTab } from './prompts-tab';
import { RoutesTab } from './routes-tab';
import { SystemTab } from './system-tab';
import { RagWidget } from '../../../widgets/settings/rag-widget';
import { AgentsWidget } from '../../agents/widget/agents.widget';
import { DagsWidget } from '../../dags/widget/dags.widget';
import { TechsWidget } from '../../techs/widget/techs.widget';
import { useTestId } from '@ai-agencee/ui';

interface SettingsPanelProps {
  onClose: () => void;
  dataTestId?: string;
}

export function SettingsPanel({ dataTestId, onClose }: SettingsPanelProps) {
  
  const { rootId, getTestId } = useTestId('settings-panel', dataTestId);
const [activeTab, setActiveTab] = useState<'agents' | 'dags' | 'techs' | 'models' | 'rules' | 'prompts' | 'routing' | 'rag' | 'system'>('models');

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    padding: '8px 4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: isActive ? 'var(--amber-400)' : 'var(--text-muted)',
    borderBottom: isActive ? '2px solid var(--amber-400)' : '2px solid transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <div className="flex flex-col gap-3.5 p-4 bg-[var(--vscode-editor-background)]">
      <div className="flex justify-between items-center">
        <h2 className="m-0 text-xs uppercase tracking-wider">
          System Settings
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
          data-testid={getTestId('button')}
        >
          <IconX data-testid={getTestId('icon-x')} size={14} />
        </Button>
      </div>

      <div className="flex gap-4 border-b border-zinc-800 scrollbar-thin overflow-x-auto">
        {(['agents', 'dags', 'techs', 'models', 'rules', 'prompts', 'routing', 'rag', 'system'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2
                ${isActive 
                  ? 'text-amber-400 border-amber-400' 
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
              data-testid={`settings-tab-${tab}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="settings-scroll-container flex-1 min-h-0" style={{ overflowY: 'auto' }}>

        {activeTab === 'agents' && <AgentsWidget data-testid={getTestId('agents-widget')} id="agents-settings" />}
        {activeTab === 'dags' && <DagsWidget data-testid={getTestId('dags-widget')} id="dags-settings" />}
        {activeTab === 'techs' && <TechsWidget data-testid={getTestId('techs-widget')} id="techs-settings" />}
        {activeTab === 'models' && <ModelsTab data-testid={getTestId('models-tab')} />}
        {activeTab === 'rules' && <RulesTab data-testid={getTestId('rules-tab')} />}
        {activeTab === 'prompts' && <PromptsTab data-testid={getTestId('prompts-tab')} />}
        {activeTab === 'routing' && <RoutesTab data-testid={getTestId('routes-tab')} />}
        {activeTab === 'rag' && <RagWidget data-testid={getTestId('rag-widget')} />}
        {activeTab === 'system' && <SystemTab data-testid={getTestId('system-tab')} />}
      </div>
    </div>
  );
}
