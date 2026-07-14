import { selectActiveRightPanelTab, setActiveRightPanelTab } from "../../../entities/app/model/app-slice";
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentSessionId } from '../../../features/sessions/store/sessions.slice';
import { selectMode } from '../../../features/chat/store/chat.slice';
import { ErathosCanvas } from '../../dag-pipeline/ui/ErathosCanvas';
import { AnalyzerPanel } from './AnalyzerPanel';
import { ModelHubPanel } from '../../../features/models/components/organisms/ModelHubPanel';
import { ContextWindowPanel } from './ContextWindowPanel';
import { IntrospectionPanel } from './IntrospectionPanel';
import { ArtifactsPanel } from './ArtifactsPanel';
import {
  useTestId,
  IconFileText, IconShare2, IconActivity, IconCloud, IconLayers, IconThought
} from '@ai-agencee/ui';

export type RightPanelTab = 'introspection' | 'artifacts' | 'erathos' | 'analyzer' | 'model-hub' | 'context-window';

export interface IRightPanelProps {
  initialTab?: RightPanelTab;
}

const tabs: { id: RightPanelTab; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: 'introspection',  label: 'Introspection',Icon: IconThought },
  { id: 'artifacts',      label: 'Artifacts',   Icon: IconFileText },
  { id: 'erathos',        label: 'Erathos',     Icon: IconShare2 },
  { id: 'analyzer',       label: 'Analyzer',    Icon: IconActivity },
  { id: 'model-hub',      label: 'Models',      Icon: IconCloud },
  { id: 'context-window', label: 'Context',     Icon: IconLayers },
];

export function RightPanel() {
  
  const { rootId, getTestId } = useTestId('right-panel', undefined);
const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveRightPanelTab) as RightPanelTab;
  const currentSessionId = useSelector(selectCurrentSessionId);
  const mode = useSelector(selectMode);

  const visibleTabs = tabs.filter(t => t.id !== 'analyzer' || mode === 'analyse');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-panel)',
      }}
    >
      {/* ── Tab bar ── */}
      <div className="flex items-stretch border-b border-zinc-800 flex-shrink-0 overflow-x-auto bg-[var(--bg-panel)] hide-scrollbar">
        {visibleTabs.map(({ id, label, Icon }) => {
          
  const { rootId, getTestId } = useTestId('visible-tabs-item', undefined);
const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => dispatch(setActiveRightPanelTab(id))}
              title={label}
              className={`flex items-center gap-1.5 px-3 h-[34px] border-b-2 text-[10px] uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 outline-none
                ${isActive 
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 font-normal'}`}
              data-testid={id === 'model-hub' ? 'models-hub-button' : `right-panel-tab-${id}`}
            >
              <Icon data-testid={getTestId('icon')} size={12} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px',
        }}
      >
        {activeTab === 'introspection'  && <IntrospectionPanel data-testid={getTestId('introspection-panel')} />}
        {activeTab === 'artifacts'      && <ArtifactsPanel data-testid={getTestId('artifacts-panel')} sessionId={currentSessionId} />}
        {activeTab === 'erathos'        && <ErathosCanvas data-testid={getTestId('erathos-canvas')} key={currentSessionId || 'default'} />}
        {activeTab === 'analyzer'       && <AnalyzerPanel data-testid={getTestId('analyzer-panel')} />}
        {activeTab === 'model-hub'      && <ModelHubPanel data-testid={getTestId('model-hub-panel')} />}
        {activeTab === 'context-window' && <ContextWindowPanel data-testid={getTestId('context-window-panel')} />}
      </div>
    </div>
  );
}
