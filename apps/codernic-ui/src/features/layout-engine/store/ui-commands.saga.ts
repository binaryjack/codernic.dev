import { all, put, takeEvery } from 'redux-saga/effects';
import { applyUICommand } from './ui-commands.slice';

interface UICommandWsAction {
  type: string;
  payload?: {
    action: 'expand' | 'collapse' | 'maximize' | 'minimize' | 'enable' | 'disable' | 'refresh' | 'blink' | 'unblink' | 'highlight' | 'unhighlight' | 'obscure' | 'unobscure' | 'blur' | 'unblur' | 'fade' | 'unfade';
    target: { widgetType: string; blockId?: string };
  };
}

function* handleUICommandEvents(action: UICommandWsAction) {
  if (action.type === 'WS/codernic:ui-command' && action.payload) {
    const { action: cmd, target } = action.payload;
    // Combine widgetType and blockId (if provided) or use just widgetType
    const targetId = target.blockId ? `${target.widgetType}_${target.blockId}` : target.widgetType;
    
    if (cmd === 'refresh') {
      // Dispatch a generic WIDGET_REFRESH action for the component to intercept via sagas/listeners
      yield put({ type: 'WIDGET_REFRESH', payload: { id: targetId, action: 'refresh' } });
    }
    
    // Always update the slice state (including refresh which updates lastRefreshed timestamp)
    yield put(applyUICommand({ id: targetId, command: cmd }));
  }
}

export function* uiCommandsSaga(): Generator {
  yield all([
    takeEvery('WS/codernic:ui-command', handleUICommandEvents),
  ]);
}
