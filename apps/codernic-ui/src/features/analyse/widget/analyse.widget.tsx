import type { RootState } from '../../../store';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAnalyseProgress, setAnalyseProgress } from '../../../features/dag/store/dag.slice';
import { AnalyseProgressPanel } from '../../../widgets/analyse-progress/ui/analyse-progress-panel';

import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { useTestId } from '@ai-agencee/ui';

export function AnalyseWidget({ dataTestId }: { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('analyse-widget', dataTestId);
const dispatch = useDispatch();
  const currentSessionId = useSelector((state: RootState) => state.sessions.currentSessionId) || '';
  const analyseProgress = useSelector((state: RootState) => selectAnalyseProgress(state, currentSessionId));

  console.log('[DEBUG] AnalyseWidget rendered. currentSessionId:', currentSessionId, 'analyseProgress:', !!analyseProgress);

  return (
    <ErrorBoundary>
      <div data-testid={getTestId('root')} className="w-full h-full bg-[#09090b] flex flex-col overflow-hidden p-2">

        {analyseProgress ? (
          <AnalyseProgressPanel data-testid={getTestId('analyse-progress-panel')}
            progress={analyseProgress}
            onDismiss={() => dispatch(setAnalyseProgress(null))}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
             <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg mb-4">
               <span className="text-xl">🔬</span>
             </div>
             <h3 className="text-[#f1f5f9] font-bold text-sm mb-1 tracking-wide">Analysis Mode</h3>
             <p className="text-[#71717a] text-xs leading-relaxed max-w-[200px]">
               Run an analysis in the chat to extract technologies, coding style, and generate agent rules.
             </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
