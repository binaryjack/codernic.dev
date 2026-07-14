import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { all, fork } from 'redux-saga/effects';
import { demoMiddleware } from './demo.middleware';

// Features
import chatReducer from '../features/chat/store/chat.slice';
import { chatSaga } from '../features/chat/store/chat.saga';
import modelsReducer from '../features/models/store/models.slice';
import { modelsSaga } from '../features/models/store/models.saga';
import sessionsReducer from '../features/sessions/store/sessions.slice';
import { sessionsSaga } from '../features/sessions/store/sessions.saga';
import dagReducer from '../features/dag/store/dag.slice';
import { dagSaga } from '../features/dag/store/dag.saga';
import systemReducer from '../features/system/store/system.slice';
import { systemSaga } from '../features/system/store/system.saga';
import uiCommandsReducer from '../features/layout-engine/store/ui-commands.slice';
import { uiCommandsSaga } from '../features/layout-engine/store/ui-commands.saga';
import enterpriseChatbotReducer from '../features/enterprise-chatbot/store/enterprise-chatbot.slice';
import { enterpriseChatbotSaga } from '../features/enterprise-chatbot/store/enterprise-chatbot.saga';

// Entities
import { rootTelemetrySaga } from '../entities/kernel/model/telemetry-saga';
import { rootGalileusSaga } from '../entities/kernel/model/galileus-saga';
import telemetryReducer from '../entities/telemetry/model/telemetry-slice';
import assetsReducer from '../entities/assets/model/assets-slice';
import modalReducer from '../features/modal/store/modal.slice';
import { rootAssetsSaga } from '../entities/assets/model/assets-saga';
import appReducer from '../entities/app/model/app-slice';
import introspectionReducer from '../entities/introspection/model/introspection-slice';
import artifactsReducer from '../entities/artifacts/model/artifacts-slice';
import { rootArtifactsSaga } from '../entities/artifacts/model/artifacts-saga';
import notificationsReducer from '../entities/notifications/model/notifications-slice';
import { watchNotificationsSaga } from '../entities/notifications/model/notifications-saga';

function* rootSaga() {
  yield all([
    fork(chatSaga),
    fork(modelsSaga),
    fork(sessionsSaga),
    fork(dagSaga),
    fork(systemSaga),
    fork(uiCommandsSaga),
    fork(rootTelemetrySaga), 
    fork(rootGalileusSaga),
    fork(rootAssetsSaga),
    fork(rootArtifactsSaga),
    fork(watchNotificationsSaga),
    fork(enterpriseChatbotSaga)
  ]);
}

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    app: appReducer,
    chat: chatReducer,
    models: modelsReducer,
    sessions: sessionsReducer,
    dag: dagReducer,
    system: systemReducer,
    uiCommands: uiCommandsReducer,
    telemetry: telemetryReducer,
    assets: assetsReducer,
    modal: modalReducer,
    introspection: introspectionReducer,
    artifacts: artifactsReducer,
    notifications: notificationsReducer,
    enterpriseChatbot: enterpriseChatbotReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false, serializableCheck: false }).concat(demoMiddleware, sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
(window as any).store = store;
