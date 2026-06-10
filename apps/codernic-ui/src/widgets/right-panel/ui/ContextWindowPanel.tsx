import { useSelector } from 'react-redux';
import { selectContextStats, selectContextFiles, selectMetrics } from '../../../entities/kernel';

export function ContextWindowPanel() {
  const contextStats = useSelector(selectContextStats);
  const contextFiles = useSelector(selectContextFiles);
  const metrics = useSelector(selectMetrics);

  const maxTokens = contextStats?.max_tokens ?? 128000;
  const currentTokens = contextStats?.current_tokens ?? 0;
  const usagePercent = contextStats?.usage_percent ?? ((currentTokens / maxTokens) * 100);

  return (
    <div className="flex flex-col h-full w-full space-y-6">
      <section className="flex flex-col space-y-2">
        <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider">
          Context Window Limits
        </h3>
        <div className="flex flex-col space-y-3 bg-[var(--vscode-editor-inactiveSelectionBackground)] p-3 rounded-md border border-[var(--vscode-widget-border)] shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--vscode-descriptionForeground)]">Capacity Used</span>
            <span className={`font-bold ${usagePercent >= 80 ? 'text-red-400' : usagePercent >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
              {usagePercent.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-[var(--vscode-widget-border)] rounded-full h-2 mt-1">
            <div
              className={`h-2 rounded-full ${usagePercent >= 80 ? 'bg-red-500' : usagePercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--vscode-descriptionForeground)]">Current Tokens</span>
            <span className="text-xs text-[var(--vscode-editor-foreground)] font-mono">{currentTokens.toLocaleString()} / {maxTokens.toLocaleString()}</span>
          </div>

          {metrics && (
            <div className="flex flex-col border-t border-[var(--vscode-widget-border)] pt-2 mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--vscode-descriptionForeground)]">Last Message Payload</span>
                <span className="text-xs text-[var(--vscode-editor-foreground)] font-mono">{metrics.context_tokens_count.toLocaleString()} tk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--vscode-descriptionForeground)]">Time To First Token (TTFT)</span>
                <span className="text-xs text-[var(--vscode-editor-foreground)] font-mono text-emerald-400">{metrics.ttft_ms} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--vscode-descriptionForeground)]">Generation Speed</span>
                <span className="text-xs text-[var(--vscode-editor-foreground)] font-mono text-purple-400">{metrics.tokens_per_second.toFixed(1)} t/s</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col space-y-2 flex-1">
        <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider">
          Attached Context Files
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {contextFiles.length === 0 ? (
            <div className="text-xs text-[var(--vscode-descriptionForeground)] italic">
              No files currently attached to context.
            </div>
          ) : (
            <div className="flex flex-col space-y-1">
              {contextFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 text-xs bg-[var(--vscode-editor-background)] border border-[var(--vscode-widget-border)] rounded">
                  <span className="truncate flex-1 font-mono text-[var(--vscode-editor-foreground)]">{file.fileName}</span>
                  {file.lines && (
                    <span className="text-[10px] text-[var(--vscode-descriptionForeground)] ml-2">
                      L{file.lines[0]}-{file.lines[1]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
