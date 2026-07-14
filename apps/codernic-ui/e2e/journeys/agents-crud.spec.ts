import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Agents CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    // Setting up mock data for initial load
    await page.addInitScript(() => {
      localStorage.setItem('MOCK_ASSETS_PAYLOAD', JSON.stringify({
        agents: [{ id: 'test-agent-1', name: 'Test Agent 1' }],
        dags: [],
        techs: [],
        rules: [],
        prompts: [],
        providers: []
      }));
    });
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('text=Codernic', { state: 'visible' });
    
    // Navigate to Agents if not already there
    // Assuming there's a sidebar navigation link for Agents
    const agentsLink = page.getByRole('button', { name: /Agents/i }).or(page.locator('text=Agents'));
    if (await agentsLink.count() > 0) {
      await agentsLink.first().click();
    }
  });

  test('should display initial agent', async ({ page }) => {
    await expect(page.locator('text=Test Agent 1')).toBeVisible();
  });

  test('should create a new agent via + button', async ({ page }) => {
    // Click the create button
    await page.getByTestId('create-new-button').click();
    
    // The prompt modal should appear
    await expect(page.locator('text=Enter an ID for the new asset:')).toBeVisible();
    
    // Fill the prompt
    await page.locator('input[type="text"]').fill('new-agent');
    await page.locator('button:has-text("Create")').click();
    
    // The modal should close and a spinner might appear briefly
    await expect(page.locator('text=Enter an ID for the new asset:')).toBeHidden();
    
    // The new agent should be added to the list (mock triggers WS event which triggers refresh)
    // Wait for new agent to appear
    await expect(page.locator('text=new-agent')).toBeVisible();
  });

  test('should edit and save an existing agent', async ({ page }) => {
    // Select the existing agent
    await page.locator('text=Test Agent 1').click();
    
    // Wait for editor to appear
    await expect(page.getByTestId('tab-json')).toBeVisible();
    
    // Switch to JSON tab to edit
    await page.getByTestId('tab-json').click();
    
    // Edit the text area
    const textarea = page.locator('textarea');
    await textarea.fill(JSON.stringify({ id: 'test-agent-1', name: 'Updated Agent Name' }, null, 2));
    
    // Save
    await page.getByTestId('save-button').click();
    
    // Verify it updated in the list or at least no errors
    await expect(page.locator('text=Updated Agent Name')).toBeVisible();
  });

  test('should delete an agent', async ({ page }) => {
    // Click delete on the item
    // The delete button is usually hidden until hover, but playwright can force click it
    await page.getByTestId('delete-item-test-agent-1').click({ force: true });
    
    // Confirmation modal should appear
    await expect(page.locator('text=Are you sure you want to delete test-agent-1?')).toBeVisible();
    
    // Click Delete
    await page.locator('button:has-text("Delete")').click();
    
    // The item should disappear
    await expect(page.locator('text=Test Agent 1')).toBeHidden();
  });
});
