import { useState } from 'react';
import { ErathosCanvas } from '../../dag-pipeline/ui/ErathosCanvas';
import { AnalyzerPanel } from './AnalyzerPanel';
import { ModelHubPanel } from './ModelHubPanel';
import { ContextWindowPanel } from './ContextWindowPanel';
import { PropertiesPanel } from './PropertiesPanel';

export type RightPanelTab = 'artifacts' | 'erathos' | 'analyzer' | 'model-hub' | 'context-window' | 'properties';

export interface IRightPanelProps {
  initialTab?: RightPanelTab;
}

export function RightPanel({ initialTab = 'artifacts' }: IRightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>(initialTab);

  const tabs: { id: RightPanelTab; label: string }[] = [
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'erathos', label: 'Erathos' },
    { id: 'analyzer', label: 'Analyzer' },
    { id: 'model-hub', label: 'Model Hub' },
    { id: 'context-window', label: 'Context' },
    { id: 'properties', label: 'Properties' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[var(--vscode-editor-background)]">
      {/* Tabs Header */}
      <div className="flex border-b border-[var(--vscode-widget-border)] flex-shrink-0 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs cursor-pointer whitespace-nowrap transition-colors uppercase tracking-wider font-semibold ${
              activeTab === tab.id
                ? 'text-[var(--vscode-tab-activeForeground)] border-b-2 border-[var(--vscode-tab-activeBorderTop)]'
                : 'text-[var(--vscode-tab-inactiveForeground)] hover:bg-[var(--vscode-tab-hoverBackground)]'
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'artifacts' && (
          <div className="text-xs text-[var(--vscode-descriptionForeground)]">
            No artifacts generated yet.
          </div>
        )}
        {activeTab === 'erathos' && (
          <div className="h-full w-full">
            <ErathosCanvas />
          </div>
        )}
        {activeTab === 'analyzer' && (
          <div className="h-full w-full">
            <AnalyzerPanel />
          </div>
        )}
        {activeTab === 'model-hub' && (
          <div className="h-full w-full">
            <ModelHubPanel />
          </div>
        )}
        { activeTab === 'context-window' && (
          <div className="h-full w-full">
            <ContextWindowPanel />
          </div>
        )}
        {activeTab === 'properties' && (
          <div className="h-full w-full">
            <PropertiesPanel />
          </div>
        )}
      </div>
    </div>
  );
}
