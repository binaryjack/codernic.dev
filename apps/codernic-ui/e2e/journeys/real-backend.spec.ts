import { test, expect } from '@playwright/test';

test.describe('Real Backend Diagnostics', () => {
  test('Verify real UI loading', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[CONSOLE] ${msg.text()}`);
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    
    // Do NOT mock the WebSocket here! Let it connect to the real Daemon.
    await page.goto('/');
    
    // Wait to see if "Loading Models..." goes away.
    try {
      await page.waitForFunction(() => {
        return !document.body.innerText.includes('Loading Models');
      }, { timeout: 10000 });
    } catch(e) {
      console.log('Timeout waiting for Loading Models... to disappear');
    }

    const text = await page.evaluate(() => document.body.innerText);
    console.log('\n--- DOM TEXT DUMP ---');
    console.log(text.substring(0, 1500));
    console.log('---------------------\n');

    // Dump all network websocket frames?
    // We just rely on console logs for now.

    const hasLoading = text.includes('Loading Models...');
    console.log('Still Loading Models?', hasLoading);

    // Expect not to be loading
    expect(hasLoading).toBe(false);
  });
});
