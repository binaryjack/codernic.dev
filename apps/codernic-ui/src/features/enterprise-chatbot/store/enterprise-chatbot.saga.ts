import { call, put, takeEvery } from 'redux-saga/effects';
import { apiClient } from '../../../shared/api/api-client';
import { appendMessage, setSending } from './enterprise-chatbot.slice';

function* handleSubmitEnterpriseMessage(action: { type: string; payload: { text: string } }) {
  const { text } = action.payload;
  if (!text.trim()) return;

  const userMsg = { id: Date.now().toString(), role: 'user' as const, text };
  yield put(appendMessage(userMsg));
  yield put(setSending(true));

  try {
    const response = yield call([apiClient, apiClient.query], text, { auth_token: 'mock_token_engineering' });
    const botMsg = { id: Date.now().toString() + 'bot', role: 'assistant' as const, text: response.text || 'Done.' };
    yield put(appendMessage(botMsg));
  } catch (e: unknown) {
    const errorMsg = { id: Date.now().toString() + 'err', role: 'assistant' as const, text: `Error: ${(e instanceof Error ? e.message : String(e))}` };
    yield put(appendMessage(errorMsg));
  } finally {
    yield put(setSending(false));
  }
}

export function* enterpriseChatbotSaga() {
  yield takeEvery('enterpriseChatbot/submitEnterpriseMessage', handleSubmitEnterpriseMessage);
}
