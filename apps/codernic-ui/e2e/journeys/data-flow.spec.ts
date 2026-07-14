import { test, expect } from '@playwright/test';

test.describe('E2E Data Flow - UI to Daemon WebSockets', () => {
  test('codernic:request-llms populates the model selector', async ({ page }) => {
    // 1. Mock the WebSocket to simulate the Daemon
    await page.routeWebSocket('**/', ws => {
      ws.onMessage(message => {
        try {
          const payload = JSON.parse(message as string);
          
          if (payload.type === 'codernic:request-llms') {
            // Reply with mock LLMs and Route Profiles
            ws.send(JSON.stringify({
              type: 'ac:llms',
              payload: [
                { value: 'mock-local-llama', label: 'Mock Llama 3', group: 'local-custom' }
              ]
            }));

            ws.send(JSON.stringify({
              type: 'ac:route-profiles',
              payload: [
                { value: 'local-custom', label: 'Local Custom', models: ['mock-local-llama'] }
              ]
            }));
          } else if (payload.type === 'codernic:get-env-check') {
            ws.send(JSON.stringify({
              type: 'codernic:env-check',
              payload: { missing: [], version: '0.6.367' }
            }));
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });
    });

    // 2. Navigate to UI
    await page.goto('/');

    // 3. Verify the mock model is injected into the Redux state and rendered in the UI
    // By default, the first model should be automatically selected or at least visible
    // Wait for the "Loading Models..." to disappear or the selector to be enabled
    const modelSelector = page.locator('button', { hasText: /Llama|Select Model/i });
    
    // We expect our mock model "Mock Llama 3" to eventually be selectable
    await expect(page.locator('body')).toContainText('Mock Llama 3', { timeout: 10000 });
  });
});
