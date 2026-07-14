import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Journey 01: Bootstrap & Environment', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser Console]', msg.text()));
    // Inject the VS Code mock before the page loads
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should show missing dependencies screen if env-check fails', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('MOCK_ENV_MISSING', JSON.stringify(['@playwright/test']));
    });
    
    await page.goto('/');

    // Assert the missing dependencies warning is displayed
    await expect(page.getByText('Missing Dependencies')).toBeVisible();
    await expect(page.getByText('npm install @playwright/test -D')).toBeVisible();
    
    // Assert clicking "Check Again" sends the request again
    const checkAgainBtn = page.getByRole('button', { name: 'Check Again' });
    await expect(checkAgainBtn).toBeVisible();
  });

  test('should load normal UI if dependencies are present', async ({ page }) => {
    // Relies on the default VSCODE_MOCK_SCRIPT which returns missing: []
    await page.goto('/');

    await expect(page.getByRole('textbox')).toBeVisible();
    
    // Assert that the LLM was loaded successfully from the mock
    await expect(page.getByText('Claude 3.5 Sonnet')).toBeAttached();
  });
});
