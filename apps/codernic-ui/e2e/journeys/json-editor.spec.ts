import { test, expect } from '@playwright/test';

test.describe('JSON Editor Dropdowns', () => {
  test('should display and cascade dropdowns in the routing settings', async ({ page }) => {
    let mockWs: any = null;

    // Mock WebSocket Server
    await page.routeWebSocket(/.*9999.*/, ws => {
      mockWs = ws;
      ws.onMessage(message => {
        try {
          const msg = JSON.parse(message as string);
          if (msg.type === 'codernic:ready') {
            ws.send(JSON.stringify({
              type: 'codernic:json-schemas',
              payload: {
                "config/llms/routes": {
                  "provider": {
                    "type": "DropDown",
                    "sourceCollection": "providers",
                    "sourceFile": "providers.json",
                    "sourceAssetType": "config/llms",
                    "sourceAssetId": "providers",
                    "labelField": "name",
                    "valueField": "id"
                  },
                  "model": {
                    "type": "DropDown",
                    "behavior": "cascading",
                    "sourceCollection": "models",
                    "sourceFile": "providers.json",
                    "sourceAssetType": "config/llms",
                    "sourceAssetId": "providers",
                    "dependsOn": "provider",
                    "dependsOnType": "collection",
                    "fromFile": "providers.json",
                    "fromField": "id",
                    "onField": "providerId"
                  }
                }
              }
            }));
          }

          if (msg.type === 'codernic:get-asset') {
            if (msg.payload?.id === 'providers' && msg.payload?.isMetadata) {
               ws.send(JSON.stringify({ 
                 type: 'codernic:asset-content', 
                 payload: { 
                   id: 'providers.json', 
                   isMetadata: true, 
                   content: JSON.stringify([
                     { id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-4o', name: 'GPT-4o' }] },
                     { id: 'anthropic', name: 'Anthropic', models: [{ id: 'claude-3-5', name: 'Claude 3.5' }] }
                   ]) 
                 } 
               }));
            } else if (msg.payload?.id === 'routes') {
               ws.send(JSON.stringify({ 
                 type: 'codernic:asset-content', 
                 payload: { 
                   id: 'routes', 
                   content: JSON.stringify({
                     "planning": { "provider": "openai", "model": "gpt-4o" }
                   }) 
                 } 
               }));
            }
          }
        } catch (e) {}
      });
    });

    await page.goto('/');

    // Open the left panel menu using the Settings icon title
    await page.getByTitle('Settings').click();

    // Click on the Routing tab
    await page.getByRole('button', { name: 'Routing' }).click();

    // Wait for the JSON editor to render the planning section
    await expect(page.getByText('planning')).toBeVisible({ timeout: 10000 });

    // The mock should load providers.json and display Dropdowns for provider and model
    const providerSelect = page.locator('select').filter({ hasText: 'Select provider...' }).first();
    const modelSelect = page.locator('select').filter({ hasText: 'Select model...' }).first();

    // Initially, it should be set to "openai" and "gpt-4o"
    await expect(providerSelect).toHaveValue('openai');
    await expect(modelSelect).toHaveValue('gpt-4o');

    // Change provider to Anthropic
    await providerSelect.selectOption('anthropic');

    // Model dropdown should update its options and become empty (or invalid) because gpt-4o is not in Anthropic
    // Wait for the cascading logic to filter options
    await expect(modelSelect.locator('option')).toHaveCount(2); // 1 disabled placeholder + 1 claude-3-5
    
    // Select Claude 3.5
    await modelSelect.selectOption('claude-3-5');
    await expect(modelSelect).toHaveValue('claude-3-5');
  });
});
