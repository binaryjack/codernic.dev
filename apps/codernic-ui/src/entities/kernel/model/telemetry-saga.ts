import type { EventChannel } from 'redux-saga';
import { eventChannel, buffers } from 'redux-saga';
import { all, call, fork, put, take } from 'redux-saga/effects';
import { CONFIG } from '../../../../../vscode-extension/src/shared/config';
import type { AgentRunState } from './types';
import { setAgentRun, setContextStats, setInfraStats } from './kernel-slice';

function createTelemetryChannel(): EventChannel<any> {
  return eventChannel((emitter) => {
    const ws = new WebSocket(CONFIG.TELEMETRY_WS_URL);

    ws.onmessage = (event) => {
      try {
        const telemetry = JSON.parse(event.data);
        emitter(telemetry);
      } catch (e) {
        console.error('[telemetry saga] Parse error:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('[telemetry saga] WS error:', err);
    };

    return () => {
      ws.close();
    };
  }, buffers.expanding(100));
}

function* watchTelemetry(): Generator {
  const channel = (yield call(createTelemetryChannel)) as EventChannel<any>;
  while (true) {
    const telemetry = (yield take(channel)) as any;

    if (telemetry.target === 'infra_telemetry') {
      yield put(
        setInfraStats({
          vram_used: telemetry.fields.vram_used,
          vram_total: telemetry.fields.vram_total,
          vram_available: telemetry.fields.vram_available,
          vram_required: telemetry.fields.vram_required,
        }),
      );
    } else if (telemetry.target === 'context_telemetry') {
      yield put(
        setContextStats({
          current_tokens: telemetry.fields.current_tokens,
          max_tokens: telemetry.fields.max_tokens,
          usage_percent: telemetry.fields.usage_percent,
          turn_count: telemetry.fields.turn_count,
        }),
      );
    } else if (telemetry.type === 'agent-run-update') {
      yield put(setAgentRun(telemetry.payload as AgentRunState));
    }
  }
}

export function* rootTelemetrySaga(): Generator {
  yield all([fork(watchTelemetry)]);
}
