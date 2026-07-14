import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Erathos Communication Latency & Throughput Benchmark', () => {
  test.beforeEach(async ({ page }) => {
    // Inject the VS Code mock before the page loads
    await page.addInitScript(VSCODE_MOCK_SCRIPT);

    // Disable sequencer/onboarding popups by forcing sandbox mode in storage
    await page.addInitScript(() => {
      localStorage.setItem('FORCE_SANDBOX_MODE', 'true');
    });

    page.on('console', msg => {
      console.log(`[Browser] ${msg.type()}: ${msg.text()}`);
    });
  });

  async function waitForAppReady(page: any) {
    // Give it a moment to render and settle
    await page.waitForTimeout(2000);
  }

  test('Benchmark: Validation warnings batching & action propagation', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
    await waitForAppReady(page);

    // Switch layout to Architect programmatically
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('codernic:switch-layout', {
        detail: { layout: 'Architect' }
      }));
    });
    await page.waitForTimeout(2000);

    // Wait for the Erathos Canvas element to render in the DOM
    const canvas = page.locator('[data-testid="erathos-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Step 1: Benchmark vbs-validation-warnings event propagation and Redux ingestion latency
    const perfResults = await page.evaluate(async () => {
      const store = (window as any).store;
      if (!store) {
        return { error: 'Redux store not found on window' };
      }

      // Generate 50 mock validation warnings
      const warnings = Array.from({ length: 50 }, (_, i) => ({
        rule: `Rule-${i}`,
        message: `Cyclic dependency warning number ${i} on the structura canvas diagram.`
      }));

      // Setup state listener to resolve when warnings are batch-inserted into Redux
      const targetMessage = '[Structura Linter] Rule-49: Cyclic dependency warning number 49';
      
      const p = new Promise<number>((resolve) => {
        const unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const logs = state.system?.systemLogs || [];
          if (logs.some((log: string) => log.includes(targetMessage))) {
            unsubscribe();
            resolve(performance.now());
          }
        });
      });

      const startTime = performance.now();
      
      // Dispatch custom event from the webview container context
      const event = new CustomEvent('vbs-validation-warnings', {
        detail: { warnings }
      });
      window.dispatchEvent(event);

      const endTime = await p;
      const latencyMs = endTime - startTime;

      return {
        success: true,
        warningsCount: warnings.length,
        latencyMs
      };
    });

    console.log(`[BENCHMARK RESULT] Validation Warnings Batch Propagation:`, perfResults);
    expect(perfResults.success).toBe(true);
    expect(perfResults.latencyMs).toBeLessThan(150); // Assert propagation is ultra-fast (<150ms)

    // Step 2: Verify warnings format in System Logs Console
    const consoleLogs = page.locator('span:has-text("[Structura Linter]")');
    // Open system logs drawer if closed
    const statusLogsBtn = page.locator('button:has-text("Logs")');
    if (await statusLogsBtn.isVisible()) {
      await statusLogsBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Check that at least some warning logs rendered in the logs console UI
    const count = await consoleLogs.count();
    console.log(`[BENCHMARK RESULT] Rendered Linter Warnings count in DOM: ${count}`);
    expect(count).toBeGreaterThan(0);
  });
});
