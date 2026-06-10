import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';

export interface HardwareMetrics {
  vramUsedGb: number | null;
  memoryLockLimit: string | null;
}

export interface BackendMetrics {
  ragInitialized: boolean;
  indexedChunksCount: number;
  activeMcpBridges: string[];
}

export interface FrontendMetrics {
  activeWatchers: number;
}

export interface TelemetryState {
  globalStatus: 'ok' | 'down' | 'unknown';
  hardware: HardwareMetrics | null;
  backend: BackendMetrics | null;
  frontend: FrontendMetrics | null;
}

const initialState: TelemetryState = {
  globalStatus: 'unknown',
  hardware: null,
  backend: null,
  frontend: null,
};

export const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState,
  reducers: {
    updateHeartbeat: (state, action: PayloadAction<'ok' | 'down'>) => {
      state.globalStatus = action.payload;
    },
    updateDiagnostic: (state, action: PayloadAction<{ hardware: HardwareMetrics, backend: BackendMetrics, frontend: FrontendMetrics }>) => {
      state.hardware = action.payload.hardware;
      state.backend = action.payload.backend;
      state.frontend = action.payload.frontend;
    },
  },
});

export const { updateHeartbeat, updateDiagnostic } = telemetrySlice.actions;

export const selectGlobalStatus = (state: RootState) => state.telemetry.globalStatus;
export const selectHardwareMetrics = (state: RootState) => state.telemetry.hardware;
export const selectBackendBridges = (state: RootState) => state.telemetry.backend;
export const selectFrontendSecurity = (state: RootState) => state.telemetry.frontend;

export default telemetrySlice.reducer;
