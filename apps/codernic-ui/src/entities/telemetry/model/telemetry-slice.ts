import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';
import { createTelemetryState } from '@binaryjack/state-factories';

export interface HardwareMetrics {
  vramUsedGb: number | null;
  memoryLockLimit: string | null;
  totalRamGb: number;
  cpuCores: number;
  hasCuda: boolean;
  hasRocm: boolean;
  hasMetal: boolean;
}

export interface BackendMetrics {
  ragInitialized: boolean;
  indexedChunksCount: number;
  activeMcpBridges: string[];
}

export interface FrontendMetrics {
  activeWatchers: number;
}

export interface ProxyMetricsState {
  enabled: boolean;
  activeConnections: number;
  blockedRequests: number;
  anonymizedTokens: number;
  bypassedRequests: number;
}

export interface TelemetryState {
  globalStatus: 'ok' | 'down' | 'unknown';
  hardware: HardwareMetrics | null;
  backend: BackendMetrics | null;
  frontend: FrontendMetrics | null;
  proxy: ProxyMetricsState | null;
}

const initialState: TelemetryState = createTelemetryState() as unknown as TelemetryState;

export const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState,
  reducers: {
    updateHeartbeat: (state, action: PayloadAction<'ok' | 'down'>) => {
      state.globalStatus = action.payload;
    },
    updateDiagnostic: (state, action: PayloadAction<{ hardware: HardwareMetrics, backend: BackendMetrics, frontend: FrontendMetrics, proxy?: ProxyMetricsState }>) => {
      state.hardware = action.payload.hardware;
      state.backend = action.payload.backend;
      state.frontend = action.payload.frontend;
      if (action.payload.proxy) {
        state.proxy = action.payload.proxy;
      }
    },
  },
});

export const { updateHeartbeat, updateDiagnostic } = telemetrySlice.actions;

export const selectGlobalStatus = (state: RootState) => state.telemetry.globalStatus;
export const selectHardwareMetrics = (state: RootState) => state.telemetry.hardware;
export const selectBackendBridges = (state: RootState) => state.telemetry.backend;
export const selectFrontendSecurity = (state: RootState) => state.telemetry.frontend;
export const selectProxyMetrics = (state: RootState) => state.telemetry.proxy;

export default telemetrySlice.reducer;
