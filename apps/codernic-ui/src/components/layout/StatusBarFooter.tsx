import type { RootState } from '../../store';
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSending, selectThinking, selectActiveTaskId, abortCurrentTask, selectContextFiles, selectAutoPilot, selectUseRag } from '../../features/chat/store/chat.slice';
import { sendIntent } from '../../shared/store/intent';
import { SystemLogsConsole } from './SystemLogsConsole';
import { StatusBarChips } from './StatusBarChips';
import { useResizable } from '../../shared/hooks/useResizable';
import { useKeyboardShortcut } from '../../shared/hooks/useKeyboardShortcut';
import { useSystemMetrics } from '../../features/system/hooks/useSystemMetrics';

import { selectSandboxMode } from '../../entities/app/model/app-slice';
import { useTestId } from '@ai-agencee/ui';

export function StatusBarFooter() {
  const { getTestId } = useTestId('status-bar-footer');
const [isOpen, setIsOpen] = useState(false);
  const { height: logsHeight, handleMouseDown } = useResizable(180, 100, 800);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useDispatch();
  const sandboxMode = useSelector(selectSandboxMode);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentSessionId = useSelector((state: RootState) => state.sessions.currentSessionId) || '';
  const sending = useSelector(selectSending);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thinking = useSelector((state: RootState) => selectThinking(state, currentSessionId));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeTaskId = useSelector((state: RootState) => selectActiveTaskId(state, currentSessionId));
  const contextFiles = useSelector(selectContextFiles);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAutoPilot = useSelector((state: RootState) => selectAutoPilot(state, currentSessionId));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useRag = useSelector((state: RootState) => selectUseRag(state, currentSessionId));

  const isThinking = thinking && thinking.phase !== 'idle';
  const showAbortBtn = sending || isThinking;

  useKeyboardShortcut('c', true, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTaskId) {
      dispatch(sendIntent({
        type: 'codernic:abort-task',
        payload: { task_id: activeTaskId },
      }));
    }
    dispatch(abortCurrentTask({ sessionId: currentSessionId }));
  }, showAbortBtn, true);

  const metrics = useSystemMetrics(currentSessionId);

  useEffect(() => {
    if (isOpen && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [metrics.systemLogs, isOpen]);

  return (
    <div className="flex flex-col border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex-shrink-0 z-50">
      {/* ── Drag handle ── */}
      {isOpen && (
        <div
          onMouseDown={handleMouseDown}
          className="h-[4px] -mt-[2px] w-full cursor-ns-resize hover:bg-[var(--border-active)] z-[60] absolute top-0"
        />
      )}

      {/* ── Status bar row ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-[28px] flex items-center justify-between px-2.5 cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)]"
      >
        <StatusBarChips data-testid={getTestId('status-bar-chips')} 
          tokenPct={metrics.tokenPct}
          currentTokens={metrics.currentTokens}
          dynamicMaxTokens={metrics.dynamicMaxTokens}
          sessionLlm={metrics.sessionLlm}
          contextFiles={contextFiles}
          cpuStr={metrics.cpuStr}
          ramStr={metrics.ramStr}
          vramStr={metrics.vramStr}
          isIndexing={metrics.isIndexing}
          ragProgress={metrics.ragProgress}
          isThinking={isThinking}
          thinking={thinking}
          daemonStatus={metrics.daemonStatus}
          gpuTarget={metrics.gpuTarget}
          appVersion={metrics.appVersion}
          daemonOk={metrics.daemonOk}
          isOpen={isOpen}
          isStale={false}
          isAutoPilot={isAutoPilot}
          useRag={useRag}
          sandboxMode={sandboxMode}
          loraTrainingStatus={metrics.loraTrainingStatus}
        />
      </div>

      {/* ── Log console panel ── */}
      <SystemLogsConsole data-testid={getTestId('system-logs-console')} 
        isOpen={isOpen}
        logsHeight={logsHeight}
        systemLogs={metrics.systemLogs}
        consoleEndRef={consoleEndRef}
      />
    </div>
  );
}
