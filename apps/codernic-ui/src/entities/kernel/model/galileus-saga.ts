import type { EventChannel } from 'redux-saga';
import { eventChannel, buffers } from 'redux-saga';
import { all, call, delay, fork, put, take, select } from 'redux-saga/effects';
import { vscode } from '../../../shared/api/vscode-api';

import { setGalileusError, setGalileusSnapshot } from '../../../features/dag/store/dag.slice';
import { selectMode } from '../../../features/chat/store/chat.slice';
import { updateSystemStatus, appendSystemLogsBatch } from '../../../features/system/store/system.slice';

function createGalileusChannel(): EventChannel<any> {
  return eventChannel((emitter) => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'galileus:state') {
        emitter({ type: 'state', payload: msg.payload });
      } else if (msg.type === 'codernic:system-status') {
        emitter({ type: 'system-status', payload: msg.payload });
      } else if (msg.type === 'codernic:system-log-batch') {
        emitter({ type: 'system-log-batch', payload: msg.payload });
      } else if (msg.type === 'lora:training-status') {
        emitter({ type: 'lora-training-status', payload: msg.payload });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, buffers.expanding(100));
}

function* pollGalileus(): Generator {
  while (true) {
    const currentMode = (yield select(selectMode)) as string;
    if (currentMode !== 'brainstorm') {
      vscode.postMessage({ type: 'galileus:get-state' });
    }
    yield delay(3000);
  }
}

function* watchGalileus(): Generator {
  const channel = (yield call(createGalileusChannel)) as EventChannel<any>;
  while (true) {
    const action = (yield take(channel)) as any;
    if (action.type === 'state') {
      const payload = action.payload;
      if (payload?.error) {
        yield put(setGalileusError(payload.error));
      } else {
        yield put(setGalileusSnapshot(payload));
      }
    } else if (action.type === 'system-status') {
      yield put(updateSystemStatus(action.payload as any));
    } else if (action.type === 'system-log-batch') {
      const { logs } = action.payload as { logs: { timestamp: string; message: string }[] };
      const formattedLines = logs.map((log) => {
        const dateStr = new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19);
        return `[${dateStr}] ${log.message}`;
      });
      yield put(appendSystemLogsBatch(formattedLines));
    } else if (action.type === 'lora-training-status') {
      const { status, agent } = action.payload as { status: string; agent: string };
      if (status === 'running') {
        yield put({ type: 'system/setLoraTrainingStatus', payload: agent });
      } else if (status === 'finished' || status === 'error') {
        yield put({ type: 'system/setLoraTrainingStatus', payload: null });
      }
    }
  }
}

export function* rootGalileusSaga(): Generator {
  yield all([fork(pollGalileus), fork(watchGalileus)]);
}
