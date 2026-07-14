import type { SagaIterator } from 'redux-saga';
import { call, put, takeEvery, all, take, race, delay, select } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { setLoading, selectSandboxMode } from '../../app/model/app-slice';
import { logTelemetryError } from '../../telemetry/model/telemetry-utils';
import { vscode } from '../../../shared/api/vscode-api';
import { sendIntent } from '../../../shared/store/intent';
import { removeAsset, setAssetsPayload, setEditingAsset, setCloudModels, selectRoutes } from './assets-slice';
import { setCloudDigest } from '../../../features/models/store/models.slice';
import { dispatchPromiseModal } from '../../../features/modal/store/modal.saga';
import { openModal, closeModal } from '../../../features/modal/store/modal.slice';

const uid = (): string => Math.random().toString(36).slice(2, 10);

// Global vscode IPC helper
const postIpcMessage = (msg: any) => {
  vscode.postMessage(msg);
};

export function* deleteAssetSaga(action: PayloadAction<{ type: string; id: string }>): SagaIterator {
  const transactionId = uid();
  const { type, id } = action.payload;
  
  try {
    const confirmed = yield call(dispatchPromiseModal, {
      title: 'Delete Asset',
      message: `Are you sure you want to delete ${id}?`,
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) {
      return { status: 'cancelled' };
    }

    // 1) loading status ON
    yield put(setLoading({ key: `delete_asset_${transactionId}`, status: true }));
    yield put(openModal({ type: 'spinner', title: 'Deleting asset...' }, { resolve: ()=>{}, reject: ()=>{} }));
    
    // 2) operations fetch, call select (Issue the Command)
    postIpcMessage({ 
      type: 'codernic:delete-asset', 
      payload: { type, id, transactionId }
    });
    
    // Wait for the correlated response event (The Query Result)
    // We listen to the global window message event since VS Code posts back to it
    const responseEvent = yield call(waitForIpcEvent, transactionId);
    
    // 3 & 4) evaluate api response
    if (responseEvent.type === 'codernic:asset-deleted') {
      // 5) set the state accordingly (we could dispatch to remove locally if needed)
      yield put(removeAsset({ type, id }));
      
      // 6) return/yield status object
      return { status: 'success', data: responseEvent.payload };
    } else {
      throw new Error(responseEvent.payload.error || 'Unknown error during asset deletion');
    }
  } catch (error: unknown) {
    // 7) log the error (telemetry)
    yield call(logTelemetryError, {
      type: 'CRUD_ERROR',
      title: `Failed to delete ${type}`,
      source: 'deleteAssetSaga',
      origin: 'codernic-ui',
      message: (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)) : String(error)),
      otherInfos: { id, type }
    });
  } finally {
    // 8) loading status OFF
    yield put(setLoading({ key: `delete_asset_${transactionId}`, status: false }));
    yield put(closeModal()); // Force close spinner if still open
  }
}

export function* createAssetSaga(action: PayloadAction<{ type: string; id?: string; scaffoldedData?: any; title?: string }>): SagaIterator {
  const transactionId = uid();
  let { type, id, scaffoldedData, title } = action.payload;
  
  try {
    if (!id) {
      const promptResult = yield call(dispatchPromiseModal, {
        title: `Create new ${title || type}`,
        message: 'Enter an ID for the new asset:',
        type: 'prompt',
        confirmText: 'Create',
        cancelText: 'Cancel'
      });

      if (!promptResult || typeof promptResult !== 'string' || !promptResult.trim()) {
        return { status: 'cancelled' };
      }
      id = promptResult.trim();
    }

    if (type === 'config/llms') {
      if (title === 'Route' && !id.endsWith('.route')) id = `${id}.route`;
      if (title === 'Provider' && !id.endsWith('.provider')) id = `${id}.provider`;
    }

    yield put(setLoading({ key: `create_asset_${transactionId}`, status: true }));
    yield put(openModal({ type: 'spinner', title: `Creating ${id}...` }, { resolve: ()=>{}, reject: ()=>{} }));
    
    postIpcMessage({ 
      type: 'codernic:create-asset', 
      payload: { type, id, transactionId, scaffoldedData }
    });
    
    const responseEvent = yield call(waitForIpcEvent, transactionId);
    
    if (responseEvent.type === 'codernic:asset-created') {
      return { status: 'success', data: responseEvent.payload };
    } else {
      throw new Error(responseEvent.payload.error || 'Unknown error during asset creation');
    }
  } catch (error: unknown) {
    if ((error instanceof Error ? (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)) : String(error)) !== 'User cancelled asset creation') {
      yield call(logTelemetryError, {
        type: 'CRUD_ERROR',
        title: `Failed to create ${type}`,
        source: 'createAssetSaga',
        origin: 'codernic-ui',
        message: (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)) : String(error)),
        otherInfos: { type }
      });
    }
  } finally {
    yield put(setLoading({ key: `create_asset_${transactionId}`, status: false }));
    yield put(closeModal()); // Close spinner
  }
}

// Helper to wait for IPC events with timeout (Saga pattern)
function* waitForIpcEvent(transactionId: string, timeoutMs: number = 10000): SagaIterator {
  const { response, timeout } = yield race({
    response: take((action: any) => 
      (action.type === 'WS/codernic:asset-deleted' || 
       action.type === 'WS/codernic:asset-created' || 
       action.type === 'WS/codernic:asset-saved' || 
       action.type === 'WS/codernic:add-cloud-model-result' ||
       action.type === 'WS/codernic:command-error') &&
      action.payload?.transactionId === transactionId
    ),
    timeout: delay(timeoutMs)
  });

  if (timeout) {
    throw new Error(`Timeout waiting for IPC response for transaction ${transactionId}`);
  }

  return {
    type: response.type.replace('WS/', ''),
    payload: response.payload
  };
}

export function* openAssetSaga(action: PayloadAction<{ type: string; id: string }>): SagaIterator {
  const { type, id } = action.payload;
  vscode.postMessage({ 
    type: 'codernic:open-file', 
    payload: { type, id }
  });
}

export function* fetchAssetSaga(action: PayloadAction<{ type: string; id: string }>): SagaIterator {
  const { type, id } = action.payload;
  yield put(sendIntent({ 
    type: 'codernic:get-asset', 
    payload: { assetType: type, id }
  }));
}

export function* saveAssetSaga(action: PayloadAction<{ type: string; id: string; content: string }>): SagaIterator {
  const transactionId = uid();
  const { type, id, content } = action.payload;
  
  try {
    yield put(setLoading({ key: `save_asset_${transactionId}`, status: true }));
    
    postIpcMessage({ 
      type: 'codernic:save-asset', 
      payload: { assetType: type, id, content, transactionId }
    });
    
    const responseEvent = yield call(waitForIpcEvent, transactionId);
    
    if (responseEvent.type === 'codernic:asset-saved') {
      return { status: 'success', data: responseEvent.payload };
    } else {
      throw new Error(responseEvent.payload?.error || 'Unknown error during asset saving');
    }
  } catch (error: unknown) {
    yield call(logTelemetryError, {
      type: 'CRUD_ERROR',
      title: `Failed to save ${type}`,
      source: 'saveAssetSaga',
      origin: 'codernic-ui',
      message: (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)) : String(error)),
      otherInfos: { id, type }
    });
  } finally {
    yield put(setLoading({ key: `save_asset_${transactionId}`, status: false }));
  }
}

export function* fetchLlmProvidersSaga(): SagaIterator {
  yield put(sendIntent({ type: 'codernic:get-llm-config' }));
}

export function* fetchLlmRoutesSaga(): SagaIterator {
  const routes: string[] = yield select(selectRoutes);
  for (const route of routes) {
    const assetId = route === 'default' ? 'routes' : `${route}.route`;
    yield put(sendIntent({ type: 'codernic:get-asset', payload: { type: 'config/llms', id: assetId } }));
  }
}

export function* fetchCloudModelsSaga(): SagaIterator {
  const sandboxMode = yield select(selectSandboxMode);
  if (sandboxMode) {
    yield put({ type: 'models/setCloudDigestLoading', payload: false });
    yield put(setCloudDigest({
      updated_at: new Date().toISOString(),
      providers: [
        { id: 'openai', name: 'OpenAI', subscription_url: 'https://platform.openai.com' },
        { id: 'anthropic', name: 'Anthropic', subscription_url: 'https://console.anthropic.com' },
        { id: 'huggingface', name: 'HuggingFace', subscription_url: 'https://huggingface.co' }
      ],
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', context_length: 128000, pricing: { prompt: '$5.00 / M', completion: '$15.00 / M' } },
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', context_length: 200000, pricing: { prompt: '$3.00 / M', completion: '$15.00 / M' } },
        { id: 'meta-llama-3-70b', name: 'Llama 3 70B', provider: 'huggingface', context_length: 8192, pricing: { prompt: '$0.50 / M', completion: '$0.50 / M' } }
      ]
    }));
    return;
  }
  yield put({ type: 'models/setCloudDigestLoading', payload: true });
  yield put(sendIntent({ type: 'codernic:get-cloud-models' }));
}

export function* addCloudModelSaga(action: PayloadAction<{ providerId: string; model: any }>): SagaIterator {
  const transactionId = uid();
  const { providerId, model } = action.payload;
  
  try {
    yield put(setLoading({ key: `add_cloud_model_${transactionId}`, status: true }));
    yield put(openModal({ type: 'spinner', title: `Adding model ${model.id}...` }, { resolve: ()=>{}, reject: ()=>{} }));
    
    postIpcMessage({ 
      type: 'codernic:add-cloud-model', 
      payload: { providerId, model, transactionId }
    });
    
    const responseEvent = yield call(waitForIpcEvent, transactionId);
    
    if (responseEvent.type === 'codernic:add-cloud-model-result') {
      // Re-fetch providers to get updated config
      yield put({ type: 'assets/fetchLlmProvidersRequest' });
      return { status: 'success' };
    } else {
      throw new Error(responseEvent.payload?.error || 'Unknown error during cloud model addition');
    }
  } catch (error: unknown) {
    yield call(logTelemetryError, {
      type: 'CRUD_ERROR',
      title: `Failed to add cloud model`,
      source: 'addCloudModelSaga',
      origin: 'codernic-ui',
      message: (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)) : String(error)),
      otherInfos: { modelId: model.id, providerId }
    });
  } finally {
    yield put(setLoading({ key: `add_cloud_model_${transactionId}`, status: false }));
    yield put(closeModal());
  }
}

// Watchers
function* handleAssetsWsEvents(action: { type: string; payload?: any }): SagaIterator {
  const type = action.type;
  if (type === 'WS/codernic:assets-payload') {
    yield put(setAssetsPayload(action.payload));
  } else if (type === 'WS/codernic:asset-created' || type === 'WS/codernic:asset-deleted') {
    yield put(sendIntent({ type: 'codernic:request-assets' }));
  } else if (type === 'WS/codernic:asset-content' && !action.payload.isMetadata) {
    if (action.payload.assetType === 'config/llms') {
      let contentObj = {};
      try {
        contentObj = typeof action.payload.content === 'string' ? JSON.parse(action.payload.content) : action.payload.content;
      } catch (e) { }

      if (action.payload.id?.endsWith('.provider')) {
        yield put({ type: 'assets/updateLlmAssetContent', payload: { id: action.payload.id.replace('.provider', ''), type: 'provider', content: contentObj } });
      } else if (action.payload.id?.endsWith('.route')) {
        yield put({ type: 'assets/updateLlmAssetContent', payload: { id: action.payload.id.replace('.route', ''), type: 'route', content: contentObj } });
      } else if (action.payload.id === 'routes') {
        yield put({ type: 'assets/updateLlmAssetContent', payload: { id: 'default', type: 'route', content: contentObj } });
      }
    } else {
      yield put(setEditingAsset({ type: action.payload.assetType, id: action.payload.id, content: action.payload.content }));
    }
  } else if (type === 'WS/codernic:llm-config') {
    const providers = action.payload.providers || [];
    yield put({ type: 'assets/setLlmProviders', payload: providers.map((p: any) => ({
      id: p.id,
      name: p.name || p.id,
      content: {} // Initially empty, will be populated by fetchAssetRequest
    })) });
    // Fetch content for each provider
    for (const p of providers) {
      yield put(sendIntent({ type: 'codernic:get-asset', payload: { type: 'config/llms', id: `${p.id}.provider` } }));
    }
  } else if (type === 'WS/codernic:route-profile') {
    yield put({ type: 'assets/setActiveRouteProfile', payload: action.payload.profile });
  } else if (type === 'WS/codernic:cloud-models-result') {
    yield put({ type: 'models/setCloudDigestLoading', payload: false });
    yield put(setCloudDigest(action.payload));
  }
}

export function* rootAssetsSaga(): SagaIterator {
  yield all([
    takeEvery((action: any) => action.type.startsWith('WS/'), handleAssetsWsEvents),
    takeEvery('assets/deleteAssetRequest', deleteAssetSaga),
    takeEvery('assets/createAssetRequest', createAssetSaga),
    takeEvery('assets/openAssetRequest', openAssetSaga),
    takeEvery('assets/fetchAssetRequest', fetchAssetSaga),
    takeEvery('assets/saveAssetRequest', saveAssetSaga),
    takeEvery('assets/fetchLlmProvidersRequest', fetchLlmProvidersSaga),
    takeEvery('assets/fetchLlmRoutesRequest', fetchLlmRoutesSaga),
    takeEvery('assets/fetchCloudModelsRequest', fetchCloudModelsSaga),
    takeEvery('assets/addCloudModelRequest', addCloudModelSaga),
  ]);
}
