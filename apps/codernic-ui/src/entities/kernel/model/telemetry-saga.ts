import type { EventChannel } from 'redux-saga';
import { eventChannel, buffers, END } from 'redux-saga';
import { all, call, fork, put, take, delay } from 'redux-saga/effects';
import type { AgentRunState } from './types';
import { setContextStats, setInfraStats, updateActorStatus, updateSystemStatus } from '../../../features/system/store/system.slice';
import { setAgentRun } from '../../../features/dag/store/dag.slice';

import { getCodernicWsUrl } from '../../../shared/config';

const WS_URL = getCodernicWsUrl();

function createTelemetryChannel(): EventChannel<any> {
  return eventChannel((emitter) => {
    // Connect to the /ws endpoint of the daemon
    const targetUrl = WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`;
    const ws = new WebSocket(targetUrl);

    ws.onopen = () => {
      emitter({ _type: 'ACTOR_STATUS', payload: { actor: 'Daemon', status: 'connected', message: 'Connected to Core Daemon' } });
    };

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
      emitter({ _type: 'ACTOR_STATUS', payload: { actor: 'Daemon', status: 'error', message: 'Failed to connect to Daemon WebSocket' } });
    };

    ws.onclose = () => {
      emitter({ _type: 'ACTOR_STATUS', payload: { actor: 'Daemon', status: 'disconnected', message: 'Connection to Core Daemon lost' } });
      emitter(END);
    };

    return () => {
      ws.close();
    };
  }, buffers.expanding(100));
}

function* watchTelemetry(): Generator {
  while (true) {
    const channel = (yield call(createTelemetryChannel)) as EventChannel<any>;
    
    try {
      while (true) {
        const telemetry = (yield take(channel)) as any;
        
        if (telemetry === END || (telemetry && telemetry.type === '@@redux-saga/CHANNEL_END')) {
          break;
        }
        
        if (telemetry._type === 'ACTOR_STATUS') {
          yield put(updateActorStatus(telemetry.payload));
        } else if (telemetry.target === 'infra_telemetry') {
          yield put(
            setInfraStats({
              vram_used: telemetry.fields.vram_used,
              vram_total: telemetry.fields.vram_total,
              vram_available: telemetry.fields.vram_available,
              vram_required: telemetry.fields.vram_required,
            }),
          );
          if (telemetry.fields.ram_used !== undefined) {
            yield put(updateSystemStatus({
              daemonStatus: 'running',
              ramUsage: telemetry.fields.ram_used,
              totalRam: telemetry.fields.ram_total,
              cpuUsage: telemetry.fields.cpu_usage,
            }));
          }
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
          yield put(setAgentRun({ sessionId: (telemetry.payload as any).sessionId || 'default', run: telemetry.payload as AgentRunState }));
        }
      }
    } catch (err) {
      console.error('Telemetry channel error:', err);
    } finally {
      // When channel closes (via END), wait before reconnecting
      yield delay(2000);
    }
  }
}

export function* rootTelemetrySaga(): Generator {
  yield all([fork(watchTelemetry)]);
}
