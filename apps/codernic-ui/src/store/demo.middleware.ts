import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from './index';

export const demoMiddleware: Middleware<{}, RootState> = store => next => action => {
  const state = store.getState();
  
  // Intercept ONLY if we are in demo mode
  if (state.app.sandboxMode) {
    const act = action as any;
    
    // Intercept sendIntent which usually triggers sagas to communicate with backend
    if (act.type === 'system/sendIntent' && act.payload) {
      const { type, payload } = act.payload;
      
      console.log(`[Demo Middleware] Intercepting intent: ${type}`, payload);
      
      switch (type) {
        case 'codernic:get-sessions':
          store.dispatch({
            type: 'chat/setSessions',
            payload: [{ id: 'demo-session', name: 'Sandbox Session', messages: [], mode: 'brainstorm' }]
          });
          return; // Stop propagation
          
        case 'codernic:chat':
          // Simulate chat message processing
          setTimeout(() => {
            store.dispatch({
              type: 'WS/codernic:chat-done',
              payload: { sessionId: payload.sessionId || 'demo-session' }
            });
          }, 500);
          return; // Stop propagation
          
        case 'update_erathos_schema':
          setTimeout(() => {
            store.dispatch({
              type: 'dag/setErathosSchema',
              payload: payload.schema
            });
          }, 100);
          return; // Stop propagation
          
        case 'delete_model':
        case 'delete_model_request':
          // Simulate successful model deletion
          setTimeout(() => {
             // In a real scenario we might dispatch a specific action to refresh models
             // For demo, we just log it and maybe simulate a WS response if needed
             console.log(`[Demo Middleware] Simulating model deletion for ${payload.model_id}`);
          }, 100);
          return; // Stop propagation
      }
    }
  }

  // Pass everything else through
  return next(action);
};
