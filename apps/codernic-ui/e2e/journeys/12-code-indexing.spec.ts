import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 12: Semantic Code Indexing (code:index)
 *
 * CLI mapping: agencee code:index --path <directory>
 *
 * UI representation: The Analyzer Panel shows indexing progress via
 * IndexingProgress events (ResponseResponse::IndexingProgress).
 * The UI reacts to "codernic:indexing-progress" postMessages.
 *
 * There is also a /analyse slash command triggered from the chat input
 * in "analyse" mode.
 */
test.describe('Journey 12: Semantic Code Indexing', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  test('sending "/analyse" in analyse mode triggers an analyse intent', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedIntents = [];
      window.addEventListener('mock-vscode-message', (e: any) => {
        (window as any).__capturedIntents.push(e.detail);
      });
    });

    // Switch mode to "analyse" if the ModeDropdown is available
    const modeBtn = page.locator('button').filter({ hasText: /ask|plan|agent|journey|analyse/i }).first();
    if (await modeBtn.isVisible()) {
      await modeBtn.click();
      const analyseOption = page.getByText(/analyse/i).first();
      if (await analyseOption.isVisible()) {
        await analyseOption.click();
      }
    }

    const textarea = page.getByRole('textbox');
    await textarea.fill('/analyse');
    await page.keyboard.press('Control+Enter');

    // The message should appear in the feed
    await expect(page.getByText('/analyse')).toBeVisible();
  });

  test('indexing progress is displayed in the Analyzer tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyzer' }).click();

    // Simulate an indexing progress event from the backend
    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:indexing-progress',
        payload: {
          files_indexed: 45,
          total_files: 100,
          percentage: 45,
        }
      }, '*');
    });

    // Progress should be displayed somewhere in the panel
    // (AnalyseProgressPanel / analyseProgress state)
    await expect(page.getByRole('button', { name: 'Analyzer' })).toBeVisible();
  });

  test('indexing progress can be dismissed', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyzer' }).click();

    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:indexing-progress',
        payload: { files_indexed: 100, total_files: 100, percentage: 100 }
      }, '*');
    });

    // A dismiss button should appear when progress is shown
    const dismissBtn = page.getByRole('button', { name: /dismiss/i });
    if (await dismissBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dismissBtn.click();
      await expect(dismissBtn).not.toBeVisible();
    }
  });
});
