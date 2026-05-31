import type { EventChannel } from 'redux-saga';
import { eventChannel, buffers } from 'redux-saga';
import { all, call, delay, fork, put, take } from 'redux-saga/effects';
import { vscode } from '../../../shared/api/vscode-api';
import type { WorkspaceSnapshot } from './types';
import { setGalileusError, setGalileusSnapshot } from './kernel-slice';

function createGalileusChannel(): EventChannel<WsGalileusMessage> {
  return eventChannel((emitter) => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'galileus:state') {
        emitter(msg.payload);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, buffers.expanding(100));
}

type WsGalileusMessage = WorkspaceSnapshot & { error?: string };

function* pollGalileus(): Generator {
  while (true) {
    vscode.postMessage({ type: 'galileus:get-state' });
    yield delay(3000);
  }
}

function* watchGalileus(): Generator {
  const channel = (yield call(createGalileusChannel)) as EventChannel<WsGalileusMessage>;
  while (true) {
    const payload = (yield take(channel)) as WsGalileusMessage;
    if (payload?.error) {
      yield put(setGalileusError(payload.error));
    } else {
      yield put(setGalileusSnapshot(payload));
    }
  }
}

export function* rootGalileusSaga(): Generator {
  yield all([fork(pollGalileus), fork(watchGalileus)]);
}
