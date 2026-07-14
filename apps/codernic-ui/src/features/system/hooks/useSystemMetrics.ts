import type { RootState } from '../../../store';
import { useSelector } from 'react-redux';
import { 
  selectContextStats, selectDaemonStatus, selectVramUsage, selectGpuTarget, 
  selectSystemLogs, selectAppVersion, selectRamUsage, selectCpuUsage, 
  selectMetrics, selectLoraTrainingStatus
} from '../store/system.slice';
import { selectGlobalStatus } from '../../../entities/telemetry/model/telemetry-slice';
import { selectRagProgress } from '../../dag/store/dag.slice';
import { selectSessionLlm } from '../../models/store/models.slice';

const LLM_CONTEXT_MAP: Record<string, number> = {
  'claude-3-5-sonnet-20240620': 200000,
  'claude-3-opus-20240229': 200000,
  'claude-3-haiku-20240307': 200000,
  'gpt-4o': 128000,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16385,
  'llama-3-8b': 8192,
  'llama-3-70b': 8192,
  'mixtral-8x7b': 32768,
  'command-r-plus': 128000,
};

export function useSystemMetrics(currentSessionId: string) {
  const contextStats = useSelector(selectContextStats);
  const daemonStatus = useSelector(selectDaemonStatus);
  const vramUsage = useSelector(selectVramUsage);
  const gpuTarget = useSelector(selectGpuTarget);
  const systemLogs = useSelector(selectSystemLogs);
  const ragProgress = useSelector(selectRagProgress);
  const appVersion = useSelector(selectAppVersion);
  const telemetryStatus = useSelector(selectGlobalStatus);
  const metrics = useSelector(selectMetrics);
  const ramUsage = useSelector(selectRamUsage);
  const cpuUsage = useSelector(selectCpuUsage);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionLlm = useSelector((state: RootState) => selectSessionLlm(state, currentSessionId));

  const loraTrainingStatus = useSelector(selectLoraTrainingStatus);

  let dynamicMaxTokens = contextStats?.max_tokens ?? 128000;
  if (sessionLlm) {
    const knownKey = Object.keys(LLM_CONTEXT_MAP).find(k => sessionLlm.toLowerCase().includes(k));
    if (knownKey) {
      dynamicMaxTokens = LLM_CONTEXT_MAP[knownKey];
    }
  }

  const currentTokens = metrics?.context_tokens_count ?? contextStats?.current_tokens ?? 0;
  const tokenPct = Math.min(100, Math.round((currentTokens / dynamicMaxTokens) * 100));

  const vramStr = vramUsage !== null ? `${vramUsage.toFixed(1)} GB` : '--';
  const ramStr = ramUsage !== null ? `${ramUsage.toFixed(1)} GB` : '--';
  const cpuStr = cpuUsage !== null ? `${cpuUsage.toFixed(0)}%` : '--';
  const isIndexing = ragProgress !== null;
  const daemonOk = daemonStatus === 'running' && telemetryStatus === 'ok';

  return {
    daemonStatus,
    gpuTarget,
    systemLogs,
    ragProgress,
    appVersion,
    dynamicMaxTokens,
    currentTokens,
    tokenPct,
    vramStr,
    ramStr,
    cpuStr,
    isIndexing,
    daemonOk,
    sessionLlm,
    loraTrainingStatus
  };
}
