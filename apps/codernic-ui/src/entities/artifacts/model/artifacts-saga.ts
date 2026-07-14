import { call, put, takeLatest, all, select } from 'redux-saga/effects';
import {
  fetchArtifactsRequest,
  fetchArtifactsSuccess,
  fetchArtifactsFailure,
  fetchArtifactContentRequest,
  fetchArtifactContentSuccess,
  fetchArtifactContentFailure,
} from './artifacts-slice';

import { getCodernicHttpUrl } from '../../../shared/config';
import { selectSandboxMode } from '../../app/model/app-slice';

const getBaseUrl = () => getCodernicHttpUrl();

function* handleFetchArtifacts(): Generator<any, void, any> {
  try {
    const sandboxMode = yield select(selectSandboxMode);
    if (sandboxMode) {
      // Preserve the mock data injected by the sequencer
      return;
    }
    const response = yield call(fetch, `${getBaseUrl()}/api/artifacts`);
    if (response.ok) {
      const artifacts: string[] = yield call([response, 'json']);
      yield put(fetchArtifactsSuccess(artifacts));
    } else {
      yield put(fetchArtifactsFailure(`Failed to fetch artifacts: ${response.statusText}`));
    }
  } catch (error: unknown) {
    yield put(fetchArtifactsFailure((error instanceof Error ? error.message : String(error)) || 'Network error'));
  }
}

function* handleFetchArtifactContent(action: ReturnType<typeof fetchArtifactContentRequest>): Generator<any, void, any> {
  const filename = action.payload;
  try {
    const response = yield call(fetch, `${getBaseUrl()}/api/artifacts/${filename}`);
    if (response.ok) {
      const content: string = yield call([response, 'text']);
      yield put(fetchArtifactContentSuccess({ filename, content }));
    } else {
      yield put(fetchArtifactContentFailure(`Failed to fetch artifact content: ${response.statusText}`));
    }
  } catch (error: unknown) {
    yield put(fetchArtifactContentFailure((error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || 'Network error'));
  }
}

export function* rootArtifactsSaga() {
  yield all([
    takeLatest(fetchArtifactsRequest.type, handleFetchArtifacts),
    takeLatest(fetchArtifactContentRequest.type, handleFetchArtifactContent),
  ]);
}
