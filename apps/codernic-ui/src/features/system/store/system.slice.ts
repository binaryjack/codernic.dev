import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { InfraStats, ContextStats } from '../../../entities/kernel/model/types';

import type { InferenceMetrics } from '../../../entities/kernel/model/types';
import type { RootState } from '../../../store';
import { createSystemState } from '@binaryjack/state-factories';

export type ActorType = 'Daemon' | 'Configuration' | 'Models' | 'VSCode';
export type ActorStatus = 'connected' | 'disconnected' | 'error';
export interface ActorState {
  status: ActorStatus;
  message?: string;
}

export interface SystemState {
  appVersion: string | null;
  infraStats: InfraStats | null;
  contextStats: ContextStats | null;
  metrics: InferenceMetrics | null;
  daemonStatus: 'running' | 'stopped' | 'starting' | 'stopping';
  vramUsage: number | null;
  vramTotal: number | null;
  totalRam: number | null;
  ramUsage: number | null;
  cpuUsage: number | null;
  gpuTarget: string;
  systemLogs: string[];
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  actors: Record<ActorType, ActorState>;
  loraTrainingStatus: string | null;
}

const initialState: SystemState = createSystemState() as unknown as SystemState;

export const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setAppVersion(state, action: PayloadAction<string | null>) {
      state.appVersion = action.payload;
    },
    setInfraStats(state, action: PayloadAction<InfraStats | null>) {
      state.infraStats = action.payload;
    },
    setContextStats(state, action: PayloadAction<ContextStats | null>) {
      state.contextStats = action.payload;
    },
    setMetrics(state, action: PayloadAction<InferenceMetrics | null>) {
      state.metrics = action.payload;
    },
    updateSystemStatus(
      state,
      action: PayloadAction<{
        daemonStatus: 'running' | 'stopped' | 'starting' | 'stopping';
        vramUsage?: number | null;
        vramTotal?: number | null;
        totalRam?: number | null;
        ramUsage?: number | null;
        cpuUsage?: number | null;
        gpuTarget?: string;
        isIndexing?: boolean;
      }>,
    ) {
      state.daemonStatus = action.payload.daemonStatus;
      
      // Auto-sync the Daemon actor status for WidgetOfflineOverlay
      if (action.payload.daemonStatus === 'running') {
        state.actors['Daemon'] = { status: 'connected', message: 'Connected to Daemon' };
      } else if (action.payload.daemonStatus === 'stopped') {
        state.actors['Daemon'] = { status: 'disconnected', message: 'Daemon is stopped' };
      } else {
        state.actors['Daemon'] = { status: 'disconnected', message: `Daemon is ${action.payload.daemonStatus}` };
      }

      if (action.payload.vramUsage !== undefined) {
        state.vramUsage = action.payload.vramUsage;
      }
      if (action.payload.vramTotal !== undefined) {
        state.vramTotal = action.payload.vramTotal;
      }
      if (action.payload.totalRam !== undefined) {
        state.totalRam = action.payload.totalRam;
      }
      if (action.payload.ramUsage !== undefined) {
        state.ramUsage = action.payload.ramUsage;
      }
      if (action.payload.cpuUsage !== undefined) {
        state.cpuUsage = action.payload.cpuUsage;
      }
      if (action.payload.gpuTarget !== undefined) {
        state.gpuTarget = action.payload.gpuTarget;
      }
    },
    appendSystemLogsBatch(state, action: PayloadAction<{ logs?: unknown[]; message?: string; timestamp?: string } | unknown[] | unknown>) {
      const logsArray = (action.payload as { logs?: unknown[] })?.logs || (Array.isArray(action.payload) ? action.payload : [action.payload]);
      const formattedLines = logsArray.map((log: unknown) => {
        if (typeof log === 'object' && log && 'message' in log && typeof log.message === 'string') {
          const time = 'timestamp' in log && typeof log.timestamp === 'string' ? log.timestamp.split('T')[1].slice(0, 8) : 'LOG';
          return `[${time}] ${log.message}`;
        }
        return String(log);
      });
      state.systemLogs.push(...formattedLines);
      if (state.systemLogs.length > 500) {
        state.systemLogs = state.systemLogs.slice(state.systemLogs.length - 500);
      }
    },
    setWsStatus(state, action: PayloadAction<SystemState['wsStatus']>) {
      state.wsStatus = action.payload;
    },
    updateActorStatus(
      state,
      action: PayloadAction<{ actor: ActorType; status: ActorStatus; message?: string }>
    ) {
      state.actors[action.payload.actor] = {
        status: action.payload.status,
        message: action.payload.message,
      };
    },
    setLoraTrainingStatus(state, action: PayloadAction<string | null>) {
      state.loraTrainingStatus = action.payload;
    },
  },
});

export const {
  setAppVersion,
  setInfraStats,
  setContextStats,
  setMetrics,
  updateSystemStatus,
  appendSystemLogsBatch,
  setWsStatus,
  updateActorStatus,
  setLoraTrainingStatus,
} = systemSlice.actions;

export const selectAppVersion = (state: RootState) => state.system.appVersion;
export const selectInfraStats = (state: RootState) => state.system.infraStats;
export const selectContextStats = (state: RootState) => state.system.contextStats;
export const selectMetrics = (state: RootState) => state.system.metrics;
export const selectDaemonStatus = (state: RootState) => state.system.daemonStatus;
export const selectVramUsage = (state: RootState) => state.system.vramUsage;
export const selectVramTotal = (state: RootState) => state.system.vramTotal;
export const selectTotalRam = (state: RootState) => state.system.totalRam;
export const selectRamUsage = (state: RootState) => state.system.ramUsage;
export const selectCpuUsage = (state: RootState) => state.system.cpuUsage;
export const selectGpuTarget = (state: RootState) => state.system.gpuTarget;
export const selectSystemLogs = (state: RootState) => state.system.systemLogs;
export const selectWsStatus = (state: RootState) => state.system.wsStatus;
export const selectActorStatus = (actor: ActorType) => (state: RootState) => state.system.actors[actor];
export const selectLoraTrainingStatus = (state: RootState) => state.system.loraTrainingStatus;

export default systemSlice.reducer;
