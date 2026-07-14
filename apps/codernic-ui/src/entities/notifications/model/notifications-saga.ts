import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
  fetchNotificationsRequest,
  markAsReadRequest,
  addNotificationRequest,
  setNotifications,
  pushNotification,
  markAllAsRead,
} from './notifications-slice';

import { getCodernicHttpUrl } from '../../../shared/config';

const getBaseUrl = () => getCodernicHttpUrl();

import { selectSandboxMode } from '../../app/model/app-slice';

function* fetchNotificationsSaga(): any {
  const isSandbox = yield select(selectSandboxMode);
  if (isSandbox) return;
  try {
    const response = yield call(fetch, `${getBaseUrl()}/api/notifications`);
    if (response.ok) {
      const data = yield call([response, 'json']);
      yield put(setNotifications(data.reverse())); // latest first
    }
  } catch (error) {
    console.warn('Failed to fetch notifications', error);
  }
}

function* markAsReadSaga(): any {
  const isSandbox = yield select(selectSandboxMode);
  if (isSandbox) {
    yield put(markAllAsRead());
    return;
  }
  try {
    const response = yield call(fetch, `${getBaseUrl()}/api/notifications/read`, {
      method: 'PUT',
    });
    if (response.ok) {
      yield put(markAllAsRead());
    }
  } catch (error) {
    console.error('Failed to mark notifications as read', error);
  }
}

function* addNotificationSaga(action: ReturnType<typeof addNotificationRequest>): any {
  const isSandbox = yield select(selectSandboxMode);
  const newNotif = {
    id: crypto.randomUUID(),
    message: action.payload.message,
    level: action.payload.level,
    is_read: false,
    created_at: Date.now(),
  };

  if (isSandbox) {
    yield put(pushNotification(newNotif));
    return;
  }

  try {
    const response = yield call(fetch, `${getBaseUrl()}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif),
    });
    if (response.ok) {
      yield put(pushNotification(newNotif));
    }
  } catch (error) {
    console.error('Failed to add notification', error);
  }
}

export function* watchNotificationsSaga() {
  yield takeLatest(fetchNotificationsRequest.type, fetchNotificationsSaga);
  yield takeLatest(markAsReadRequest.type, markAsReadSaga);
  yield takeEvery(addNotificationRequest.type, addNotificationSaga);
}
