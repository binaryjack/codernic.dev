import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAssetsState } from '@binaryjack/state-factories';

export interface AssetEntry {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface AssetsState {
  agents: Record<string, AssetEntry>;
  dags: Record<string, AssetEntry>;
  techs: Record<string, AssetEntry>;
  rules: Record<string, AssetEntry>;
  prompts: Record<string, AssetEntry>;
  providers: string[];
  routes: string[];
  llmProviders: Record<string, AssetEntry>;
  llmRoutes: Record<string, AssetEntry>;
  loaded: boolean;
  editingAsset: { type: string; id: string; content: string } | null;
  jsonEditorSchemas: Record<string, any>;
  metadataSources: Record<string, any>;
  cloudModels: any[];
  activeRouteProfile: string;
}

const initialState: AssetsState = createAssetsState() as unknown as AssetsState;

export const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setAssetsPayload(state, action: PayloadAction<{
      agents: AssetEntry[];
      dags: AssetEntry[];
      techs: AssetEntry[];
      rules: AssetEntry[];
      prompts: AssetEntry[];
      providers: string[];
      routes?: string[];
    }>) {
      state.agents = action.payload.agents.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
      state.dags = action.payload.dags.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
      state.techs = action.payload.techs.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
      state.rules = action.payload.rules.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
      state.prompts = action.payload.prompts.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
      state.providers = action.payload.providers;
      state.routes = action.payload.routes || [];
      state.loaded = true;
    },
    setLlmProviders(state, action: PayloadAction<AssetEntry[]>) {
      state.llmProviders = action.payload.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
    },
    setLlmRoutes(state, action: PayloadAction<AssetEntry[]>) {
      state.llmRoutes = action.payload.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
    },
    setEditingAsset(state, action: PayloadAction<{ type: string; id: string; content: string } | null>) {
      state.editingAsset = action.payload;
    },
    removeAsset(state, action: PayloadAction<{ type: string; id: string }>) {
      const { type, id } = action.payload;
      if (type === 'agent') delete state.agents[id];
      if (type === 'dag') delete state.dags[id];
      if (type === 'technology') delete state.techs[id];
      if (type === 'rule') delete state.rules[id];
      if (type === 'prompt') delete state.prompts[id];
      if (type === 'config/llms') {
        if (id.endsWith('.route')) delete state.llmRoutes[id.replace('.route', '')];
        else if (id.endsWith('.provider')) delete state.llmProviders[id.replace('.provider', '')];
      }
    },
    updateAssetContent(state, action: PayloadAction<{ content: string }>) {
      if (state.editingAsset) {
        state.editingAsset.content = action.payload.content;
      }
    },
    updateLlmAssetContent(state, action: PayloadAction<{ id: string; type: string; content: any }>) {
      const { id, type, content } = action.payload;
      if (type === 'provider' && state.llmProviders[id]) {
        state.llmProviders[id].content = content;
      } else if (type === 'route' && state.llmRoutes[id]) {
        state.llmRoutes[id].content = content;
      } else if (type === 'route' && !state.llmRoutes[id]) {
        // If the route doesn't exist yet, we can create it
        state.llmRoutes[id] = { id, name: id, content };
      }
    },
    setJsonEditorSchemas(state, action: PayloadAction<Record<string, unknown>>) {
      state.jsonEditorSchemas = action.payload;
    },
    setMetadataSource(state, action: PayloadAction<{ file: string; data: unknown }>) {
      state.metadataSources[action.payload.file] = action.payload.data;
    },
    setCloudModels(state, action: PayloadAction<Record<string, unknown>[]>) {
      state.cloudModels = action.payload;
    },
    setActiveRouteProfile(state, action: PayloadAction<string>) {
      state.activeRouteProfile = action.payload;
    }
  },
});

const selectAssetsState = (state: { assets: AssetsState }) => state.assets;

export const selectAgents = createSelector([selectAssetsState], (assets) => assets.agents);
export const selectDags = createSelector([selectAssetsState], (assets) => assets.dags);
export const selectTechs = createSelector([selectAssetsState], (assets) => assets.techs);
export const selectRules = createSelector([selectAssetsState], (assets) => assets.rules);
export const selectPrompts = createSelector([selectAssetsState], (assets) => assets.prompts);
export const selectProviders = createSelector([selectAssetsState], (assets) => assets.providers);
export const selectLlmProviders = createSelector([selectAssetsState], (assets) => assets.llmProviders);
export const selectLlmRoutes = createSelector([selectAssetsState], (assets) => assets.llmRoutes);
export const selectAssetsLoaded = createSelector([selectAssetsState], (assets) => assets.loaded);
export const selectEditingAsset = createSelector([selectAssetsState], (assets) => assets.editingAsset);
export const selectJsonEditorSchemas = createSelector([selectAssetsState], (assets) => assets.jsonEditorSchemas);
export const selectMetadataSources = createSelector([selectAssetsState], (assets) => assets.metadataSources);
export const selectCloudModels = createSelector([selectAssetsState], (assets) => assets.cloudModels);
export const selectActiveRouteProfile = createSelector([selectAssetsState], (assets) => assets.activeRouteProfile);
export const selectRoutes = createSelector([selectAssetsState], (assets) => assets.routes || []);

export const { setAssetsPayload, setLlmProviders, setLlmRoutes, setEditingAsset, removeAsset, updateAssetContent, updateLlmAssetContent, setJsonEditorSchemas, setMetadataSource, setCloudModels, setActiveRouteProfile } = assetsSlice.actions;
export default assetsSlice.reducer;
