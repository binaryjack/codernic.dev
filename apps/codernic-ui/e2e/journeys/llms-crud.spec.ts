import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('LLMs CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
    
    // Navigate to Settings then LLMs
    const settingsLink = page.getByRole('button', { name: /Settings/i }).or(page.locator('text=Settings'));
    if (await settingsLink.count() > 0) {
      await settingsLink.first().click();
    }

    const llmsLink = page.getByRole('button', { name: /LLMs/i }).or(page.locator('text=LLMs'));
    if (await llmsLink.count() > 0) {
      await llmsLink.first().click();
    }
  });

  test('should display mock LLM Providers', async ({ page }) => {
    // vscode-mock.ts sends 'openai' provider during codernic:get-llm-config
    await expect(page.locator('text=OpenAI')).toBeVisible();
  });

  test('should create a new LLM route via + button', async ({ page }) => {
    // Make sure we are on the Routing Profile tab
    // Assume there is a way to switch between Providers and Routing Profiles in the UI
    const routingTab = page.locator('text=Routing Profile').first();
    if (await routingTab.count() > 0) {
      await routingTab.click();
    }
    
    // The create button for Routing Profile
    // We might have multiple create buttons, we pick the one under Routing Profile
    const createBtn = page.getByTestId('create-new-button').last();
    await createBtn.click();
    
    await expect(page.locator('text=Enter an ID for the new asset:')).toBeVisible();
    await page.locator('input[type="text"]').fill('new-route');
    await page.locator('button:has-text("Create")').click();
    
    await expect(page.locator('text=new-route')).toBeVisible();
  });
});
