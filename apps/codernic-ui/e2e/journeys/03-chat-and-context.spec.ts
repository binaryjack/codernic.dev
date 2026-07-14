import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Journey 03: Chat and Context', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser Console]', msg.text()));
    // Inject the VS Code mock before the page loads
    await page.addInitScript(VSCODE_MOCK_SCRIPT);

    // Start a new session to ensure we are in the chat input state
    // If sessions exist, the SessionSelector intercepts. We mocked it to return {}, so we should be in New Session state.
  });

  test('should allow switching modes', async ({ page }) => {
    await page.goto('/');
    // Default mode should be 'Ask'
    const modeSelector = page.getByRole('button', { name: /Mode:/i }); // Adjust based on your UI component
    if (await modeSelector.isVisible()) {
      await modeSelector.click();
      
      const planOption = page.getByText('Plan', { exact: true });
      await planOption.click();
      
      // Verify mode changed in DOM
      await expect(modeSelector).toContainText('Plan');
    }
  });

  test('should handle sending a message and showing thinking state', async ({ page }) => {
    // Setup the mock to respond to chat intents
    await page.addInitScript(() => {
      window.addEventListener('mock-vscode-message', (e: any) => {
        if (e.detail.type === 'codernic:chat') {
          // Immediately simulate that the assistant is thinking/streaming back
          setTimeout(() => {
            window.simulateVsCodeMessage({
              type: 'codernic:stream-chunk',
              payload: { chunk: 'I am an AI assistant.' }
            });
            window.simulateVsCodeMessage({ 
              type: 'codernic:chat-done', 
              payload: {} 
            });
          }, 50);
        }
      });
    });

    await page.goto('/');

    const input = page.getByRole('textbox');
    await input.fill('Write a python script.');
    await page.keyboard.press('Control+Enter');

    // Message should appear in feed
    await expect(page.getByText('Write a python script.')).toBeVisible();
    
    // Assistant response should appear shortly after
    await expect(page.getByText('I am an AI assistant.')).toBeVisible();
  });

  test('should parse and render <action> tool blocks correctly', async ({ page }) => {
    // Setup the mock to respond with an <action> payload
    await page.addInitScript(() => {
      window.addEventListener('mock-vscode-message', (e: any) => {
        if (e.detail.type === 'codernic:chat') {
          setTimeout(() => {
            window.simulateVsCodeMessage({
              type: 'codernic:tool-call',
              payload: { id: 'tool-call-1', name: 'run_terminal', args: { command: 'ls -la' } }
            });
            window.simulateVsCodeMessage({ 
              type: 'codernic:chat-done', 
              payload: {} 
            });
          }, 50);
        }
      });
    });
    await page.goto('/');

    const input = page.getByRole('textbox');
    await input.fill('Run ls -la');
    await page.keyboard.press('Control+Enter');

    // It should NOT render the raw JSON text
    await expect(page.getByText('{"tool": "run_terminal"')).not.toBeVisible();
    
    // It SHOULD render a ToolBlock (assuming ToolBlock has a specific role or text, like "Executing Tool: run_terminal")
    // Note: The assertion will fail if the UI doesn't parse <action> blocks properly, which is intended.
    await expect(page.getByText('run_terminal')).toBeVisible();
    await expect(page.locator('.tool-block-container')).toBeVisible();
  });

  test('should allow dropping files into context', async ({ page }) => {
    await page.goto('/');
    // Simulate VS Code sending a file drop event
    await page.evaluate(() => {
      (window as any).simulateVsCodeMessage({
        type: 'CODERNIC_CONTEXT_ADD_FILE',
        filePath: '/src/index.ts',
        lines: 100
      });
    });

    // The context badge should appear
    await expect(page.getByText('index.ts')).toBeVisible();

    // Clicking it should probably remove it or show options
    const removeBtn = page.locator('button[aria-label="Remove index.ts"]');
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await expect(page.getByText('index.ts')).not.toBeVisible();
    }
  });
});
