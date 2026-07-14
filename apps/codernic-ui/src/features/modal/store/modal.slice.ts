import { createSlice, type PayloadAction, createAction } from '@reduxjs/toolkit';
import { createModalState } from '@binaryjack/state-factories';

export interface ModalConfig {
  title: string;
  message?: string;
  type?: 'confirm' | 'alert' | 'prompt' | 'spinner';
  confirmText?: string;
  cancelText?: string;
}

export interface ModalState {
  isOpen: boolean;
  config: ModalConfig | null;
  // We can optionally store the deferred object here, but it's available via action meta.
  // We'll store it here so the React component can easily access it from state.
  deferred: { resolve: (val: any) => void; reject: (err: any) => void } | null;
}

const initialState: ModalState = createModalState() as unknown as ModalState;

// We use prepare to inject the meta property as per Redux toolkit standard,
// but we'll also store the deferred callbacks in state since serializableCheck is false.
export const openModal = createAction(
  'modal/open',
  function prepare(config: ModalConfig, deferred: { resolve: (val: any) => void; reject: (err: any) => void }) {
    return {
      payload: config,
      meta: { deferred },
    };
  }
);

export const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    closeModal: (state) => {
      state.isOpen = false;
      state.config = null;
      state.deferred = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(openModal, (state, action) => {
      state.isOpen = true;
      state.config = action.payload;
      state.deferred = action.meta.deferred;
    });
  },
});

export const { closeModal } = modalSlice.actions;
export default modalSlice.reducer;
