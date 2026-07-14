import { useSelector } from 'react-redux';
import { selectIntrospectionEvents } from '../../../features/dag/store/dag.slice';
import { IconPlay, IconCheck, IconRepeat, IconTool, IconThought, IconDot } from '@ai-agencee/ui';
import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { useTestId } from '@ai-agencee/ui';

export function AgentEventsWidget({ dataTestId }: { dataTestId?: string }) {
  const events = useSelector(selectIntrospectionEvents);
  const { rootId, getTestId } = useTestId('agent-events-widget', dataTestId);

  const getEventIcon = (type: string, success?: boolean) => {
    
    // Removed the buggy rootId assignment here
if (type === 'step_start')               return <IconPlay data-testid={getTestId('icon-play')} size={11} color="var(--accent-ask, #3b82f6)" />;
    if (type === 'step_success')             return <IconCheck data-testid={getTestId('icon-check')} size={11} color="var(--status-ok, #22c55e)" />;
    if (type === 'step_retry')               return <IconRepeat data-testid={getTestId('icon-repeat')} size={11} color="var(--amber-400, #fbbf24)" />;
    if (type === 'ToolExecutionResult')      return <IconTool data-testid={getTestId('icon-tool')} size={11} color={success ? 'var(--status-ok, #22c55e)' : 'var(--status-error, #ef4444)'} />;
    if (type === 'agent-thinking-stream')    return <IconThought data-testid={getTestId('icon-thought')} size={11} color="var(--text-muted, #a1a1aa)" />;
    return <IconDot data-testid={getTestId('icon-dot')} size={8} color="var(--text-muted, #a1a1aa)" />;
  };

  const getEventLabel = (evt: { type: string; payload?: { tool_name?: string; success?: boolean }; step_id?: string }) => {
    if (evt.type === 'step_start')          return 'Step Started';
    if (evt.type === 'step_success')        return 'Step Succeeded';
    if (evt.type === 'step_retry')          return 'Retrying Step';
    if (evt.type === 'ToolExecutionResult') return `Tool: ${evt.payload?.tool_name || 'unknown'}`;
    if (evt.type === 'agent-thinking-stream') return 'Thinking';
    return evt.type;
  };

  return (
    <ErrorBoundary data-testid={getTestId('error-boundary')}>
      <div data-testid={getTestId('root')} className="flex flex-col h-full w-full bg-[#09090b] overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {events.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] text-[#a1a1aa] italic">
              No agent events yet.
            </div>
          ) : (
            <div className="relative pl-5 border-l border-[#27272a] flex flex-col gap-3 ml-2 p-4">
              {events.map((evt, idx) => (
                <div key={idx} data-testid={getTestId('item', idx)} className="relative flex flex-col gap-0.5">
                  <span className="absolute -left-[29px] top-0.5 bg-[#09090b] flex items-center justify-center w-4 h-4">
                    {getEventIcon(evt.type, evt.payload?.success)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#f1f5f9]">
                    {getEventLabel(evt)}
                  </span>
                  {(evt.delta || evt.step_id) && (
                    <span className="text-[10px] text-[#a1a1aa] font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                      {evt.delta || evt.step_id}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
