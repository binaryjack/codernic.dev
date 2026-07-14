import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Journey 02: Sessions and Layout', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser Console]', msg.text()));
    // Inject the VS Code mock before the page loads
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    
    await page.goto('/');
    
    // Provide some mock sessions AFTER navigation so localStorage is on the correct origin
    await page.evaluate(() => {
      localStorage.setItem('MOCK_SESSIONS_LIST', JSON.stringify([
        { id: 'sess-1', name: 'Refactor Auth', last_updated: Date.now(), status: 'idle' },
        { id: 'sess-2', name: 'Fix Layout', last_updated: Date.now() - 100000, status: 'idle' }
      ]));
      // Trigger a manual load since the initial get-sessions might have read an empty localStorage
      window.postMessage({ type: 'codernic:get-sessions' }, '*');
    });
  });

  test('should load and display existing sessions', async ({ page }) => {
    // Session selector should appear since we have sessions
    await expect(page.getByRole('main').getByText('Refactor Auth')).toBeVisible();
    await expect(page.getByRole('main').getByText('Fix Layout')).toBeVisible();
  });

  test('should allow creating a new session', async ({ page }) => {
    // Click the New Session button in the header bar
    const newSessionBtn = page.locator('header button[title="New Session"]');
    await expect(newSessionBtn).toBeVisible();
    await newSessionBtn.click();
    
    // Should transition to the empty chat input
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('should toggle layout panels', async ({ page }) => {
    // Left panel should be open by default
    const leftPanel = page.locator('aside').first(); // Adjust selector based on actual DOM
    await expect(leftPanel).toBeVisible();

    // Settings panel should open when clicking the gear icon
    const settingsBtn = page.locator('button[title="Settings"]');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await expect(page.getByText('System Settings')).toBeVisible();
    }
  });
});
