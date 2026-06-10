import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectContextStats,
  selectDaemonStatus,
  selectVramUsage,
  selectGpuTarget,
  selectSystemLogs,
  selectSending,
  selectThinking,
  selectActiveTaskId,
  abortCurrentTask,
  sendIntent,
  selectAppVersion,
  selectRagProgress,
} from '../../entities/kernel';
import { selectGlobalStatus } from '../../entities/telemetry/model/telemetry-slice';

export function StatusBarFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useDispatch();
  const contextStats = useSelector(selectContextStats);
  const daemonStatus = useSelector(selectDaemonStatus);
  const vramUsage = useSelector(selectVramUsage);
  const gpuTarget = useSelector(selectGpuTarget);
  const systemLogs = useSelector(selectSystemLogs);
  const ragProgress = useSelector(selectRagProgress);
  const sending = useSelector(selectSending);
  const thinking = useSelector(selectThinking);
  const activeTaskId = useSelector(selectActiveTaskId);
  const appVersion = useSelector(selectAppVersion);
  const telemetryStatus = useSelector(selectGlobalStatus);
 
  const isThinking = thinking && thinking.phase !== 'idle';
  const showAbortBtn = sending || isThinking;
 
 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAbortBtn && e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        e.stopPropagation();
        if (activeTaskId) {
          dispatch(sendIntent({
            type: 'codernic:abort-task',
            payload: { task_id: activeTaskId },
          }));
        }
        dispatch(abortCurrentTask());
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showAbortBtn, activeTaskId, dispatch]);

  // Auto-scroll to the bottom of the logs when expanded or new logs arrive
  useEffect(() => {
    if (isOpen && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLogs, isOpen]);

  // Determine token string
  const currentTokens = contextStats?.current_tokens ?? 0;
  const maxTokens = contextStats?.max_tokens ?? 128000;
  const tokenStr = `▲ [${currentTokens.toLocaleString()} / ${maxTokens.toLocaleString()} TK]`;

  // Determine VRAM string
  const vramStr = `[VRAM: ${vramUsage !== null ? `${vramUsage.toFixed(2)} GB` : '-- GB'}]`;

  // Determine indexing status pastille & message
  const isIndexing = ragProgress !== null;
  const indexStatusPastilleColor = isIndexing ? 'text-amber-500 animate-pulse' : 'text-emerald-500';
  const indexStatusText = isIndexing
    ? `[Indexing: ${ragProgress.filesIndexed} / ${ragProgress.totalFiles} (${ragProgress.percentage}%)...]`
    : '● [Indexé]';

  return (
    <div
      className="w-full z-50 flex flex-col bg-[#131316] border-t border-[#27272a] select-none text-zinc-400 font-sans"
      style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.5)' }}
    >
      {/* Header Bar */}
      <div
        className="h-8 flex items-center justify-between px-3 text-[11px] hover:bg-zinc-800/50 cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-zinc-300">{tokenStr}</span>
          <span className="text-zinc-600">│</span>
          <span className="font-mono text-zinc-300">{vramStr}</span>
          <span className="text-zinc-600">│</span>
          <div className="flex items-center gap-1.5">
            {!isIndexing && <span className={indexStatusPastilleColor}>●</span>}
            <span className="text-zinc-300">{indexStatusText}</span>
          </div>

        </div>

        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-1.5 group relative"
            title={telemetryStatus === 'ok' ? 'Heartbeat: Passif actif (10s) - OK' : 'Heartbeat: Passif déconnecté'}
          >
            <span className={daemonStatus === 'running' ? 'text-emerald-500' : 'text-zinc-600'}>●</span>
            <span className="text-zinc-300 font-mono">[Daemon: {daemonStatus.toUpperCase()}]</span>
            {/* Tooltip CSS is usually native via title, but we can rely on title for now */}
          </div>
          <span className="text-zinc-600">│</span>
          <span className="text-zinc-400 font-mono">{appVersion ? `v${appVersion}` : 'v0.0.0'}</span>
          <span className="text-zinc-600">│</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono font-bold text-[9px] uppercase tracking-wider">
            {gpuTarget || '--'}
          </span>
          <span className="text-zinc-400 font-mono text-[10px] ml-1">{isOpen ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="h-48 bg-zinc-950 border-t border-[#1f1f23] font-mono text-[11px] text-zinc-300 p-2 overflow-y-auto selection:bg-zinc-800">
          {systemLogs.length === 0 ? (
            <div className="text-zinc-600 italic">Aucun log système disponible</div>
          ) : (
            systemLogs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap leading-5 border-b border-zinc-900/30 py-0.5">
                {log}
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>
      )}
    </div>
  );
}
