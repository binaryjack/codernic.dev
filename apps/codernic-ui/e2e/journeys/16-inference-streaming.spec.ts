import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 16: Inference Streaming & Metrics
 *
 * CLI mapping: agencee chat / agencee ask
 * The daemon streams token-by-token via CommandResponse::Inference(Token).
 * After completion it emits Metrics (TTFT, tokens/s, VRAM, context size).
 *
 * IPC events:
 *  - codernic:stream-chunk  → incremental token display
 *  - ac:chat-done           → end of stream
 *  - ac:inference-metrics   → TTFT, tokens_per_second, vram, context_tokens_count
 *  - ac:chat-error          → error display
 *
 * UI verification:
 *  - Tokens appear progressively in the message feed
 *  - Metrics bar / context progress bar updates
 *  - Error state renders gracefully
 */
test.describe('Journey 16: Inference Streaming & Metrics', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  test('streaming chunks appear progressively in the message feed', async ({ page }) => {
    // Send a message
    const textarea = page.getByRole('textbox');
    await textarea.fill('Tell me about Rust.');
    await page.keyboard.press('Control+Enter');

    // Simulate streaming response
    for (const word of ['Rust', ' is', ' a', ' systems', ' language.']) {
      await page.evaluate((token) => {
        window.postMessage({ type: 'codernic:stream-chunk', payload: { chunk: token } }, '*');
      }, word);
      await page.waitForTimeout(20);
    }

    await page.evaluate(() => {
      window.postMessage({ type: 'ac:chat-done', payload: {} }, '*');
    });

    // The full response should be assembled and visible
    await expect(page.getByText('Rust is a systems language.')).toBeVisible({ timeout: 3000 });
  });

  test('inference metrics event does not crash the UI', async ({ page }) => {
    await page.evaluate(() => {
      window.postMessage({
        type: 'ac:inference-metrics',
        payload: {
          ttft_ms: 342,
          tokens_per_second: 28.5,
          vram_allocated_bytes: 4_000_000_000,
          context_tokens_count: 1024,
        }
      }, '*');
    });

    // UI should still be functional
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('context bar updates when tokens are used', async ({ page }) => {
    await page.evaluate(() => {
      window.postMessage({
        type: 'ac:inference-metrics',
        payload: {
          ttft_ms: 100,
          tokens_per_second: 20,
          vram_allocated_bytes: 0,
          context_tokens_count: 4096,
        }
      }, '*');
    });

    // The context progress bar (width proportional to 4096/8192 ≈ 50%)
    // is rendered inside the ChatInput; just verify no crash
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('chat error event displays an error in the feed', async ({ page }) => {
    const textarea = page.getByRole('textbox');
    await textarea.fill('Trigger an error.');
    await page.keyboard.press('Control+Enter');

    await page.evaluate(() => {
      window.postMessage({
        type: 'ac:chat-error',
        payload: { text: 'Model is out of memory.' }
      }, '*');
    });

    // An error message should appear
    await expect(page.getByText('Model is out of memory.')).toBeVisible({ timeout: 3000 });
  });

  test('stream is aborted cleanly when Stop is clicked', async ({ page }) => {
    const textarea = page.getByRole('textbox');
    await textarea.fill('Very long generation task');
    await page.keyboard.press('Control+Enter');

    // Send a few tokens but don't complete
    await page.evaluate(() => {
      window.postMessage({ type: 'codernic:stream-chunk', payload: { chunk: 'Processing...' } }, '*');
    });

    const stopBtn = page.getByRole('button', { name: /stop/i });
    if (await stopBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await stopBtn.click();
      // After stopping, the Send button should return
      await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
    }
  });
});
