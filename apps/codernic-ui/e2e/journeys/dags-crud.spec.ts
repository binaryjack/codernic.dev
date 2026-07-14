import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('DAGs CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.addInitScript(() => {
      localStorage.setItem('MOCK_ASSETS_PAYLOAD', JSON.stringify({
        agents: [],
        dags: [{ id: 'test-dag-1', name: 'Test DAG 1' }],
        techs: [],
        rules: [],
        prompts: [],
        providers: []
      }));
    });
    await page.goto('/');
    
    const link = page.getByRole('button', { name: /DAGs/i }).or(page.locator('text=DAGs'));
    if (await link.count() > 0) {
      await link.first().click();
    }
  });

  test('should create a new DAG via + button', async ({ page }) => {
    await page.getByTestId('create-new-button').click();
    await expect(page.locator('text=Enter an ID for the new asset:')).toBeVisible();
    
    await page.locator('input[type="text"]').fill('new-dag');
    await page.locator('button:has-text("Create")').click();
    
    await expect(page.locator('text=new-dag')).toBeVisible();
  });

  test('should edit and save an existing DAG', async ({ page }) => {
    await page.locator('text=Test DAG 1').click();
    await expect(page.getByTestId('tab-json')).toBeVisible();
    
    await page.getByTestId('tab-json').click();
    await page.locator('textarea').fill(JSON.stringify({ id: 'test-dag-1', name: 'Updated DAG Name' }, null, 2));
    await page.getByTestId('save-button').click();
    
    await expect(page.locator('text=Updated DAG Name')).toBeVisible();
  });

  test('should delete a DAG', async ({ page }) => {
    await page.getByTestId('delete-item-test-dag-1').click({ force: true });
    await expect(page.locator('text=Are you sure you want to delete test-dag-1?')).toBeVisible();
    await page.locator('button:has-text("Delete")').click();
    
    await expect(page.locator('text=Test DAG 1')).toBeHidden();
  });
});
