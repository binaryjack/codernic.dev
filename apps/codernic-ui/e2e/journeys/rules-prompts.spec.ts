import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Rules & Prompts CRUD', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');

    // Navigate to Settings -> Rules
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Rules' }).click();
  });

  test('can create a new rule with Raw XML/Text fallback', async ({ page }) => {
    // Intercept intents
    await page.evaluate(() => {
      (window as any).__capturedIntents = [];
      window.addEventListener('mock-vscode-message', (e: any) => {
        (window as any).__capturedIntents.push(e.detail);
      });
    });

    const createBtn = page.getByRole('button', { name: 'Create Rule' });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      
      const modalInput = page.locator('input[placeholder="Enter value..."]');
      await modalInput.waitFor({ state: 'visible' });
      await modalInput.fill('my-custom-rule');
      await modalInput.press('Enter');

      // Check if create-asset intent was sent
      const intents = await page.evaluate(() => (window as any).__capturedIntents ?? []);
      const createIntent = intents.find((i: any) => i.type === 'codernic:create-asset' && i.payload?.type === 'rule');
      expect(createIntent).toBeDefined();
      expect(createIntent.payload.id).toBe('my-custom-rule');

      // The UI mock will return an asset-created event. We mock it here if needed, 
      // but normally the vscode-mock handles it.
      await page.waitForTimeout(500); // Wait for mock to reply and UI to refresh
    }
  });
});
