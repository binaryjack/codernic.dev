import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';
import { createEnterpriseChatbotState } from '@binaryjack/state-factories';

export interface EnterpriseMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface EnterpriseChatbotState {
  messages: EnterpriseMessage[];
  sending: boolean;
}

const initialState: EnterpriseChatbotState = createEnterpriseChatbotState() as unknown as EnterpriseChatbotState;

export const enterpriseChatbotSlice = createSlice({
  name: 'enterpriseChatbot',
  initialState,
  reducers: {
    appendMessage(state, action: PayloadAction<EnterpriseMessage>) {
      state.messages.push(action.payload);
    },
    setSending(state, action: PayloadAction<boolean>) {
      state.sending = action.payload;
    },
    setMessages(state, action: PayloadAction<EnterpriseMessage[]>) {
      state.messages = action.payload;
    },
  },
});

export const { appendMessage, setSending, setMessages } = enterpriseChatbotSlice.actions;

// Saga trigger action creator
export const submitEnterpriseMessage = (payload: { text: string }) => ({
  type: 'enterpriseChatbot/submitEnterpriseMessage',
  payload,
});

export const selectEnterpriseMessages = (state: RootState) => state.enterpriseChatbot.messages;
export const selectEnterpriseSending = (state: RootState) => state.enterpriseChatbot.sending;

export default enterpriseChatbotSlice.reducer;
