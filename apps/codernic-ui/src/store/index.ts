import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { all, fork } from 'redux-saga/effects';
import kernelReducer, {
  rootKernelSaga,
  rootTelemetrySaga,
  rootGalileusSaga,
} from '../entities/kernel';
import telemetryReducer from '../entities/telemetry/model/telemetry-slice';
import assetsReducer from '../entities/assets/model/assets-slice';

function* rootSaga() {
  yield all([fork(rootKernelSaga), fork(rootTelemetrySaga), fork(rootGalileusSaga)]);
}

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    kernel: kernelReducer,
    telemetry: telemetryReducer,
    assets: assetsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false, serializableCheck: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
(window as any).store = store;
