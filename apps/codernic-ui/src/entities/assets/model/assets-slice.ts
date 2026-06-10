import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AssetEntry {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface AssetsState {
  agents: AssetEntry[];
  dags: AssetEntry[];
  techs: AssetEntry[];
  rules: AssetEntry[];
  prompts: AssetEntry[];
  providers: string[];
  loaded: boolean;
}

const initialState: AssetsState = {
  agents: [],
  dags: [],
  techs: [],
  rules: [],
  prompts: [],
  providers: [],
  loaded: false,
};

export const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setAssetsPayload(state, action: PayloadAction<Omit<AssetsState, 'loaded'>>) {
      state.agents = action.payload.agents;
      state.dags = action.payload.dags;
      state.techs = action.payload.techs;
      state.rules = action.payload.rules;
      state.prompts = action.payload.prompts;
      state.providers = action.payload.providers;
      state.loaded = true;
    },
  },
});

const selectAssetsState = (state: { assets: AssetsState }) => state.assets;

export const selectAgents = createSelector([selectAssetsState], (assets) => assets.agents);
export const selectDags = createSelector([selectAssetsState], (assets) => assets.dags);
export const selectTechs = createSelector([selectAssetsState], (assets) => assets.techs);
export const selectRules = createSelector([selectAssetsState], (assets) => assets.rules);
export const selectPrompts = createSelector([selectAssetsState], (assets) => assets.prompts);
export const selectProviders = createSelector([selectAssetsState], (assets) => assets.providers);
export const selectAssetsLoaded = createSelector([selectAssetsState], (assets) => assets.loaded);

export const { setAssetsPayload } = assetsSlice.actions;
export default assetsSlice.reducer;
