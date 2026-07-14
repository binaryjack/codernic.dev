import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createArtifactsState } from '@binaryjack/state-factories';
export interface ArtifactsState {
  list: string[];
  content: Record<string, string>;
  isLoadingList: boolean;
  isLoadingContent: boolean;
  error: string | null;
}

const initialState: ArtifactsState = createArtifactsState() as unknown as ArtifactsState;

export const artifactsSlice = createSlice({
  name: 'artifacts',
  initialState,
  reducers: {
    fetchArtifactsRequest(state) {
      state.isLoadingList = true;
      state.error = null;
    },
    fetchArtifactsSuccess(state, action: PayloadAction<string[]>) {
      state.list = action.payload;
      state.isLoadingList = false;
    },
    fetchArtifactsFailure(state, action: PayloadAction<string>) {
      state.isLoadingList = false;
      state.error = action.payload;
    },
    fetchArtifactContentRequest(state, action: PayloadAction<string>) {
      state.isLoadingContent = true;
      state.error = null;
    },
    fetchArtifactContentSuccess(state, action: PayloadAction<{ filename: string; content: string }>) {
      state.content[action.payload.filename] = action.payload.content;
      state.isLoadingContent = false;
    },
    fetchArtifactContentFailure(state, action: PayloadAction<string>) {
      state.isLoadingContent = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchArtifactsRequest,
  fetchArtifactsSuccess,
  fetchArtifactsFailure,
  fetchArtifactContentRequest,
  fetchArtifactContentSuccess,
  fetchArtifactContentFailure,
} = artifactsSlice.actions;

const selectArtifactsState = (state: { artifacts: ArtifactsState }) => state.artifacts;

export const selectArtifactsList = createSelector(
  [selectArtifactsState],
  (state) => state.list
);

export const selectArtifactContentMap = createSelector(
  [selectArtifactsState],
  (state) => state.content
);

export const selectArtifactsLoading = createSelector(
  [selectArtifactsState],
  (state) => state.isLoadingList
);

export const selectArtifactContentLoading = createSelector(
  [selectArtifactsState],
  (state) => state.isLoadingContent
);

export const selectArtifactsError = createSelector(
  [selectArtifactsState],
  (state) => state.error
);

export default artifactsSlice.reducer;
