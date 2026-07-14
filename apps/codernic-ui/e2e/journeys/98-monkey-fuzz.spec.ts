import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Journey 98: UI Monkey Fuzz Tester', () => {
  let consoleErrors: string[] = [];
  let pageErrors: Error[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected/benign network errors or Monaco editor source map warnings
        const isBenign = 
          text.includes('Failed to load resource') || 
          text.includes('source map') || 
          text.includes('Failed to fetch') ||
          text.includes('fetch');
          
        if (!isBenign) {
          consoleErrors.push(text);
          console.error(`[Fuzz Console Error] ${text}`);
        }
      }
    });

    // Capture uncaught page exceptions
    page.on('pageerror', err => {
      pageErrors.push(err);
      console.error(`[Fuzz Uncaught Exception] ${err.message}\nStack:\n${err.stack}`);
    });

    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should survive 150 random user monkey interactions without throwing exceptions or logging critical errors', async ({ page }) => {
    // Wait for the app to load
    await expect(page.getByTestId('chat-textarea').first()).toBeVisible({ timeout: 15_000 });

    const executedActions: string[] = [];
    const numSteps = 150;

    for (let i = 0; i < numSteps; i++) {
      // 1. Fail immediately if an uncaught exception has occurred
      if (pageErrors.length > 0) {
        const trace = executedActions.map((act, idx) => `${idx + 1}. ${act}`).join('\n');
        throw new Error(
          `Monkey test failed due to uncaught exception: ${pageErrors[0].message}\n` +
          `Exception Stack:\n${pageErrors[0].stack}\n\n` +
          `Execution Action Trace leading to failure:\n${trace}`
        );
      }

      // 2. Fail immediately if critical console errors occurred
      if (consoleErrors.length > 0) {
        const trace = executedActions.map((act, idx) => `${idx + 1}. ${act}`).join('\n');
        throw new Error(
          `Monkey test failed due to console error: ${consoleErrors[0]}\n\n` +
          `Execution Action Trace leading to failure:\n${trace}`
        );
      }

      // Randomly pick one action strategy
      const actionType = Math.floor(Math.random() * 5);
      let actionDescription = '';

      try {
        switch (actionType) {
          case 0: {
            // Action 0: Click a random visible clickable element
            // Locate buttons, checkboxes, role=button, text inputs, etc.
            const clickables = page.locator('button:visible, [role="button"]:visible, input[type="checkbox"]:visible, a:visible, [data-testid]:visible');
            const count = await clickables.count();
            if (count > 0) {
              const randomIndex = Math.floor(Math.random() * count);
              const target = clickables.nth(randomIndex);
              const testId = await target.getAttribute('data-testid');
              const tagName = await target.evaluate(el => el.tagName.toLowerCase());
              const textContent = (await target.textContent() || '').trim().substring(0, 20);

              actionDescription = `Click element: <${tagName}> [testid="${testId || ''}"] text="${textContent}"`;
              // Click with force: true to bypass actionability checks (since a monkey user clicks rapidly/erratically!)
              await target.click({ force: true, timeout: 1000 }).catch(() => {});
            } else {
              actionDescription = 'No clickable elements found';
            }
            break;
          }
          case 1: {
            // Action 1: Fuzz text input injection
            const inputs = page.locator('input[type="text"]:visible, textarea:visible');
            const count = await inputs.count();
            if (count > 0) {
              const randomIndex = Math.floor(Math.random() * count);
              const target = inputs.nth(randomIndex);
              const testId = await target.getAttribute('data-testid');

              // Choose a random fuzz payload
              const payloads = [
                'A'.repeat(5000), // Massive string
                '<script>alert("fuzz")</script>', // XSS Injection
                'SELECT * FROM users WHERE id = 1; --', // SQL Injection
                '{}', // JSON boundary
                '\\u0000\\u0007\\u0008\\u001b', // Bad unicode control chars
                '   \n\t   ' // Blank whitespace spam
              ];
              const payload = payloads[Math.floor(Math.random() * payloads.length)];

              actionDescription = `Fill input [testid="${testId || ''}"] with fuzz payload (length: ${payload.length})`;
              await target.fill(payload, { timeout: 1000 }).catch(() => {});
            } else {
              actionDescription = 'No text inputs found';
            }
            break;
          }
          case 2: {
            // Action 2: Switch layout rapidly via custom event
            const layouts = ['Coder', 'Architect', 'Settings', 'Integrator', 'Analyst', 'Admin', 'EnterpriseChatbot'];
            const randomLayout = layouts[Math.floor(Math.random() * layouts.length)];
            actionDescription = `Dispatch codernic:switch-layout for layout [${randomLayout}]`;
            
            await page.evaluate((layoutName) => {
              window.dispatchEvent(new CustomEvent('codernic:switch-layout', { detail: { layout: layoutName } }));
            }, randomLayout);
            break;
          }
          case 3: {
            // Action 3: Extreme Viewport Resizing
            const widths = [320, 768, 1024, 1440, 1920, 3840];
            const heights = [480, 1024, 768, 900, 1080, 2160];
            const w = widths[Math.floor(Math.random() * widths.length)];
            const h = heights[Math.floor(Math.random() * heights.length)];

            actionDescription = `Resize viewport to ${w}x${h}`;
            await page.setViewportSize({ width: w, height: h });
            break;
          }
          case 4: {
            // Action 4: Keyboard spamming
            const keys = ['Escape', 'Enter', 'Tab', 'Backspace', 'ArrowDown', 'ArrowUp'];
            const key = keys[Math.floor(Math.random() * keys.length)];
            actionDescription = `Spam keyboard key [${key}]`;
            await page.keyboard.press(key);
            break;
          }
        }
      } catch (e) {
        actionDescription += ` (Action error: ${(e as Error).message})`;
      }

      executedActions.push(actionDescription);
      console.log(`[Fuzz Step ${i + 1}/${numSteps}] ${actionDescription}`);

      // Small delay between monkey actions to let the UI react
      await page.waitForTimeout(50);
    }

    console.log(`🎉 Success! Codernic UI survived all ${numSteps} monkey interactions!`);
  });
});
