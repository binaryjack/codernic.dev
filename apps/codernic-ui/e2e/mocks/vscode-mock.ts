export const VSCODE_MOCK_SCRIPT = `
  console.log('MOCK INJECTED IN', window.location.href, window.name, !!window.acquireVsCodeApi);
  window.mockVsCodeState = {};
  if (typeof window.MOCK_ENV_MISSING === 'undefined') window.MOCK_ENV_MISSING = [];
  if (typeof window.MOCK_SESSIONS_LIST === 'undefined') window.MOCK_SESSIONS_LIST = [];
  
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg && msg.type) {
      if (msg.type.startsWith('codernic:')) {
        console.trace('[Mock VS Code listener] RECEIVED:', msg.type);
      }
    }
  });

  window.addEventListener('codernic-mock-override', (e) => {
    Object.assign(window, e.detail);
  });
  
  window.acquireVsCodeApi = function() {
    return {
      postMessage: function(msg) {
        console.log('[Mock VS Code received]', msg.type);
        window.dispatchEvent(new CustomEvent('mock-vscode-message', { detail: msg }));

        if (msg.type === 'codernic:get-env-check') {
          setTimeout(() => {
            const stored = localStorage.getItem('MOCK_ENV_MISSING');
            const missing = stored ? JSON.parse(stored) : [];
            window.postMessage({ type: 'codernic:env-check', payload: { missing, version: '1.0.0-mock' } }, '*');
          }, 10);
        }
        if (msg.type === 'codernic:request-llms') {
          setTimeout(() => {
            window.postMessage({ type: 'ac:llms', payload: [{ value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' }] }, '*');
          }, 10);
        }
        if (msg.type === 'codernic:get-sessions') {
          setTimeout(() => {
            const stored = localStorage.getItem('MOCK_SESSIONS_LIST');
            const sessions = stored ? JSON.parse(stored) : [];
            window.postMessage({ type: 'codernic:sessions-list', payload: sessions }, '*');
          }, 10);
        }
        if (msg.type === 'codernic:ready') {
          setTimeout(() => {
            window.postMessage({ type: 'codernic:json-schemas', payload: {
              "config/llms/routes": {
                "provider": {
                  "type": "DropDown",
                  "sourceCollection": "providers",
                  "sourceFile": "providers.json",
                  "sourceAssetType": "config/llms",
                  "labelField": "name",
                  "valueField": "id"
                },
                "model": {
                  "type": "DropDown",
                  "behavior": "cascading",
                  "sourceCollection": "models",
                  "sourceFile": "providers.json",
                  "sourceAssetType": "config/llms",
                  "dependsOn": "provider",
                  "dependsOnType": "field",
                  "fromFile": "providers.json",
                  "fromField": "id",
                  "onField": "providerId"
                }
              }
            }}, '*');
          }, 10);
        }
        if (msg.type === 'codernic:get-asset') {
          setTimeout(() => {
            if (msg.payload?.id === 'providers' && msg.payload?.isMetadata) {
               window.postMessage({ type: 'codernic:asset-content', payload: { id: 'providers.json', isMetadata: true, content: JSON.stringify([
                 { id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-3.5', name: 'GPT-3.5' }] },
                 { id: 'anthropic', name: 'Anthropic', models: [{ id: 'claude-3-5', name: 'Claude 3.5' }] }
               ]) } }, '*');
            } else if (msg.payload?.id === 'routes') {
               window.postMessage({ type: 'codernic:asset-content', payload: { id: 'routes', content: JSON.stringify({
                 "planning": { "provider": "openai", "model": "gpt-4o" }
               }) } }, '*');
            } else if (msg.payload?.assetType === 'agent') {
               window.postMessage({ type: 'codernic:asset-content', payload: { id: msg.payload.id, content: JSON.stringify({ id: msg.payload.id, name: msg.payload.id }), assetType: 'agent' } }, '*');
            }
          }, 10);
        }
        if (msg.type === 'codernic:request-assets') {
          setTimeout(() => {
            const stored = localStorage.getItem('MOCK_ASSETS_PAYLOAD');
            const payload = stored ? JSON.parse(stored) : {
              agents: [{ id: 'test-agent-1', name: 'Test Agent 1' }],
              dags: [{ id: 'test-dag-1', name: 'Test DAG 1' }],
              techs: [{ id: 'test-tech-1', name: 'Test Tech 1' }],
              rules: [],
              prompts: [],
              providers: []
            };
            window.postMessage({ type: 'WS/codernic:assets-payload', payload }, '*');
          }, 10);
        }
        if (msg.type === 'codernic:create-asset') {
          setTimeout(() => {
            window.postMessage({ type: 'codernic:asset-created', payload: { transactionId: msg.payload.transactionId, type: msg.payload.type, fileName: msg.payload.id } }, '*');
            // Simulate the websocket broadcast
            window.postMessage({ type: 'WS/codernic:asset-created', payload: { type: msg.payload.type, id: msg.payload.id } }, '*');
          }, 10);
        }
        if (msg.type === 'codernic:save-asset') {
          setTimeout(() => {
            window.postMessage({ type: 'codernic:asset-saved', payload: { transactionId: msg.payload.transactionId, id: msg.payload.id } }, '*');
          }, 10);
        }
        if (msg.type === 'codernic:delete-asset') {
          setTimeout(() => {
            window.postMessage({ type: 'codernic:asset-deleted', payload: { transactionId: msg.payload.transactionId, type: msg.payload.type, id: msg.payload.id } }, '*');
            window.postMessage({ type: 'WS/codernic:asset-deleted', payload: { type: msg.payload.type, id: msg.payload.id } }, '*');
          }, 10);
        }
        if (msg.type === 'codernic:get-llm-config') {
          setTimeout(() => {
            window.postMessage({ type: 'WS/codernic:llm-config', payload: { providers: [
              { id: 'openai', name: 'OpenAI' }
            ]} }, '*');
          }, 10);
        }
      },
      getState: function() {
        return window.mockVsCodeState;
      },
      setState: function(state) {
        window.mockVsCodeState = state;
      }
    };
  };

  window.simulateVsCodeMessage = function(msg) {
    window.postMessage(msg, '*');
  };
`;
