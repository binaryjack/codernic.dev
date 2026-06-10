import { useSelector } from 'react-redux';
import { selectAnalyseProgress, selectIntrospectionEvents, selectPirsigMetrics, setAnalyseProgress } from '../../../entities/kernel';
import { AnalyseProgressPanel } from '../../analyse-progress';
import { useDispatch } from 'react-redux';

export function AnalyzerPanel() {
  const dispatch = useDispatch();
  const pirsig = useSelector(selectPirsigMetrics);
  const events = useSelector(selectIntrospectionEvents);
  const analyseProgress = useSelector(selectAnalyseProgress);

  return (
    <div className="flex flex-col h-full w-full space-y-6">
      
      {/* Project Analysis Progress */}
      {analyseProgress && (
        <section className="flex flex-col space-y-2 max-h-[300px]">
          <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider">
            Project Analysis
          </h3>
          <AnalyseProgressPanel 
            progress={analyseProgress} 
            onDismiss={() => dispatch(setAnalyseProgress(null))} 
          />
        </section>
      )}

      {/* Pirsig Quality Flags */}
      <section className="flex flex-col space-y-2">
        <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider">
          Pirsig Quality Audit
        </h3>
        
        {pirsig ? (
          <div className="flex flex-col space-y-3 bg-[var(--vscode-editor-inactiveSelectionBackground)] p-3 rounded-md border border-[var(--vscode-widget-border)] shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">KPI Score</span>
              <span className={`font-bold ${pirsig.kpi_score >= 80 ? 'text-green-400' : pirsig.kpi_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {pirsig.kpi_score.toFixed(1)} / 100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">Symbols Parsed</span>
              <span className="text-xs text-[var(--vscode-editor-foreground)] font-mono">{pirsig.symbols_count}</span>
            </div>
            
            {pirsig.qualitative_flags && pirsig.qualitative_flags.length > 0 && (
              <div className="pt-2 border-t border-[var(--vscode-widget-border)] flex flex-wrap gap-1.5">
                {pirsig.qualitative_flags.map((flag, idx) => {
                  const isPositive = !flag.toLowerCase().includes('fail') && !flag.toLowerCase().includes('error') && !flag.toLowerCase().includes('warn') && !flag.toLowerCase().includes('bad');
                  return (
                    <span 
                      key={idx} 
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        isPositive 
                          ? 'bg-green-900/30 text-green-300 border-green-700/50' 
                          : 'bg-red-900/30 text-red-300 border-red-700/50'
                      }`}
                    >
                      {flag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-[var(--vscode-descriptionForeground)] italic">
            Waiting for Pirsig AST analysis...
          </div>
        )}
      </section>

      {/* DAG Introspection Timeline */}
      <section className="flex flex-col space-y-2 flex-1 overflow-hidden">
        <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider">
          Agent Introspection
        </h3>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {events.length === 0 ? (
            <div className="text-xs text-[var(--vscode-descriptionForeground)] italic">
              No agent events yet.
            </div>
          ) : (
            <div className="relative border-l border-[var(--vscode-widget-border)] ml-2 pl-4 py-2 space-y-4">
              {events.map((evt, idx) => {
                let icon = '🔵';
                let title = evt.type;
                let detail = evt.delta || evt.step_id || '';
                
                if (evt.type === 'step_start') {
                  icon = '▶️';
                  title = 'Step Started';
                } else if (evt.type === 'step_success') {
                  icon = '✅';
                  title = 'Step Succeeded';
                } else if (evt.type === 'step_retry') {
                  icon = '🔄';
                  title = 'Retrying Step';
                } else if (evt.type === 'ToolExecutionResult') {
                  icon = evt.payload?.success ? '🛠️' : '❌';
                  title = `Tool: ${evt.payload?.tool_name || 'unknown'}`;
                  detail = evt.payload?.success ? 'Execution succeeded' : 'Execution failed';
                } else if (evt.type === 'agent-thinking-stream') {
                  icon = '💭';
                  title = 'Thinking';
                }

                return (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[23px] bg-[var(--vscode-editor-background)] text-xs">
                      {icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--vscode-editor-foreground)]">{title}</span>
                      {detail && (
                        <span className="text-[10px] text-[var(--vscode-descriptionForeground)] truncate">
                          {detail}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
}
