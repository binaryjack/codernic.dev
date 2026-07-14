import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';
import { createAppState } from '@binaryjack/state-factories';

export interface AppState {
  loaders: Record<string, boolean>;
  workspaceName: string | null;
  sandboxMode: boolean;
  daemonIsLoaded: boolean;
}

const initialState: AppState = createAppState() as unknown as AppState;

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<{ key: string; status: boolean }>) {
      if (action.payload.status) {
        state.loaders[action.payload.key] = true;
      } else {
        delete state.loaders[action.payload.key];
      }
    },
    clearAllLoaders(state) {
      state.loaders = {};
    },
    setWorkspaceName(state, action: PayloadAction<string>) {
      state.workspaceName = action.payload;
    },
    setSandboxMode(state, action: PayloadAction<boolean>) {
      state.sandboxMode = action.payload;
    },
    setDaemonIsLoaded(state, action: PayloadAction<boolean>) {
      state.daemonIsLoaded = action.payload;
    },
  },
});

export const { setLoading, clearAllLoaders, setWorkspaceName, setSandboxMode, setDaemonIsLoaded } = appSlice.actions;

export const selectLoaders = (state: RootState) => state.app.loaders;
export const selectIsAppLoading = (state: RootState) => Object.keys(state.app.loaders).length > 0;
export const selectWorkspaceName = (state: RootState) => state.app.workspaceName;
export const selectSandboxMode = (state: RootState) => state.app.sandboxMode;
export const selectWaitingForDaemonOverlay = (state: RootState) => !state.app.sandboxMode && !state.app.daemonIsLoaded;


export default appSlice.reducer;
