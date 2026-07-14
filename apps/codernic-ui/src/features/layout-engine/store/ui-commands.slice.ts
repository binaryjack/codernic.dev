import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createUICommandsRootState } from '@binaryjack/state-factories';

export interface UICommandState {
  isExpanded?: boolean;
  isMaximized?: boolean;
  isDisabled?: boolean;
  isBlinking?: boolean;
  isHighlighted?: boolean;
  isObscured?: boolean;
  isBlurred?: boolean;
  isSemiTransparent?: boolean;
  lastRefreshed?: number;
  validationErrors?: string[];
}

export interface UICommandsRootState {
  commands: Record<string, UICommandState>;
}

const initialState: UICommandsRootState = createUICommandsRootState() as unknown as UICommandsRootState;

export const uiCommandsSlice = createSlice({
  name: 'uiCommands',
  initialState,
  reducers: {
    applyUICommand: (
      state,
      action: PayloadAction<{ id: string; command: 'expand' | 'collapse' | 'maximize' | 'minimize' | 'enable' | 'disable' | 'refresh' | 'blink' | 'unblink' | 'highlight' | 'unhighlight' | 'obscure' | 'unobscure' | 'blur' | 'unblur' | 'fade' | 'unfade' }>
    ) => {
      const { id, command } = action.payload;
      if (!state.commands[id]) {
        state.commands[id] = {};
      }

      switch (command) {
        case 'expand':
          state.commands[id].isExpanded = true;
          break;
        case 'collapse':
          state.commands[id].isExpanded = false;
          break;
        case 'maximize':
          state.commands[id].isMaximized = true;
          break;
        case 'minimize':
          state.commands[id].isMaximized = false;
          break;
        case 'enable':
          state.commands[id].isDisabled = false;
          break;
        case 'disable':
          state.commands[id].isDisabled = true;
          break;
        case 'refresh':
          state.commands[id].lastRefreshed = Date.now();
          break;
        case 'blink':
          state.commands[id].isBlinking = true;
          break;
        case 'unblink':
          state.commands[id].isBlinking = false;
          break;
        case 'highlight':
          state.commands[id].isHighlighted = true;
          break;
        case 'unhighlight':
          state.commands[id].isHighlighted = false;
          break;
        case 'obscure':
          state.commands[id].isObscured = true;
          break;
        case 'unobscure':
          state.commands[id].isObscured = false;
          break;
        case 'blur':
          state.commands[id].isBlurred = true;
          break;
        case 'unblur':
          state.commands[id].isBlurred = false;
          break;
        case 'fade':
          state.commands[id].isSemiTransparent = true;
          break;
        case 'unfade':
          state.commands[id].isSemiTransparent = false;
          break;
      }
    },
    clearUICommand: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      delete state.commands[id];
    },
    resetUICommands: (state) => {
      state.commands = {};
    },
    setValidationErrors: (state, action: PayloadAction<{ id: string; errors: string[] }>) => {
      const { id, errors } = action.payload;
      if (!state.commands[id]) {
        state.commands[id] = {};
      }
      state.commands[id].validationErrors = errors;
    },
  },
});

export const { applyUICommand, clearUICommand, resetUICommands, setValidationErrors } = uiCommandsSlice.actions;
export default uiCommandsSlice.reducer;
