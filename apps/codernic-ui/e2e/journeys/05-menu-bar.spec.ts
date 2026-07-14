import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 05: Menu Bar
 *
 * CLI mapping:
 *  - "New Session"       → agencee chat (starts a new stateful session)
 *  - "Recent Sessions"   → agencee chat --session <id> (session persistence)
 *  - "Export Session"    → not a direct CLI command, UI-only convenience
 *  - "Refresh"           → window.location.reload() – UI-only
 *  - "Toggle Left Panel" → layout control – UI-only
 *  - "Toggle Right Panel"→ layout control – UI-only
 *  - "Stop current Run"  → Ctrl-C / agencee daemon stop (abort signal)
 *  - "Clear Introspection" → UI-only display reset
 *  - "Documentation"     → opens https://github.com/binaryjack/codernic.dev
 *  - "About"             → UI-only modal
 */
test.describe('Journey 05: Menu Bar', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  // ── File menu ─────────────────────────────────────────────────────────────

  test('File > New Session triggers a new blank session', async ({ page }) => {
    // Open File menu
    await page.getByText('File').first().click();
    await expect(page.getByText('New Session')).toBeVisible();
    await page.getByText('New Session').click();

    // Menu should have closed
    await expect(page.getByText('New Session')).not.toBeVisible();
    // Chat textarea should be visible (we are in an active session)
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('File > Recent Sessions opens the sessions panel (left panel)', async ({ page }) => {
    await page.getByText('File').first().click();
    await page.getByText('Recent Sessions').click();

    // The left panel / sessions list should now be visible
    await expect(page.getByText('Sessions', { exact: true }).first()).toBeVisible();
  });

  test('File > Export Session dispatches codernic:export-session intent', async ({ page }) => {
    // Capture intents sent to VS Code mock
    const intents: string[] = [];
    await page.addInitScript(() => {
      window.addEventListener('mock-vscode-message', (e: any) => {
        intents.push(e.detail.type);
      });
    });
    // Re-navigate so the listener is registered before page logic runs
    await page.reload();
    await page.addInitScript(VSCODE_MOCK_SCRIPT);

    await page.evaluate(() => {
      (window as any).__capturedIntents = [];
      window.addEventListener('mock-vscode-message', (e: any) => {
        (window as any).__capturedIntents.push(e.detail.type);
      });
    });

    await page.getByText('File').first().click();
    await page.getByText('Export Session').click();

    const captured = await page.evaluate(() => (window as any).__capturedIntents ?? []);
    expect(captured).toContain('codernic:export-session');
  });

  // ── View menu ─────────────────────────────────────────────────────────────

  test('View > Toggle Left Panel hides and shows the left panel', async ({ page }) => {
    const leftPanel = page.locator('aside').first();
    const initiallyVisible = await leftPanel.isVisible();

    await page.getByText('View').first().click();
    await page.getByText('Toggle Left Panel').click();

    if (initiallyVisible) {
      await expect(leftPanel).not.toBeVisible();
      // Toggle back
      await page.getByText('View').first().click();
      await page.getByText('Toggle Left Panel').click();
      await expect(leftPanel).toBeVisible();
    } else {
      await expect(leftPanel).toBeVisible();
    }
  });

  test('View > Toggle Right Panel hides and shows the right panel', async ({ page }) => {
    // Locate right panel by its tab bar containing "Artifacts" tab
    const rightPanelTab = page.getByRole('button', { name: /Artifacts/i });

    await page.getByText('View').first().click();
    await page.getByText('Toggle Right Panel').click();
    // After toggle, check visibility changed
    // (depending on initial state it may show or hide)
    const visibleAfter = await rightPanelTab.isVisible();

    await page.getByText('View').first().click();
    await page.getByText('Toggle Right Panel').click();
    // Should return to previous state
    const visibleRestored = await rightPanelTab.isVisible();
    expect(visibleRestored).toBe(!visibleAfter);
  });

  // ── Agent menu ────────────────────────────────────────────────────────────

  test('Agent > Stop current Run dispatches codernic:stop-run intent', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedIntents = [];
      window.addEventListener('mock-vscode-message', (e: any) => {
        (window as any).__capturedIntents.push(e.detail.type);
      });
    });

    await page.getByText('Agent').first().click();
    await page.getByText('Stop current Run').click();

    const captured = await page.evaluate(() => (window as any).__capturedIntents ?? []);
    expect(captured).toContain('codernic:stop-run');
  });

  test('Agent > Clear Introspection dispatches codernic:clear-introspection intent', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedIntents = [];
      window.addEventListener('mock-vscode-message', (e: any) => {
        (window as any).__capturedIntents.push(e.detail.type);
      });
    });

    await page.getByText('Agent').first().click();
    await page.getByText('Clear Introspection').click();

    const captured = await page.evaluate(() => (window as any).__capturedIntents ?? []);
    expect(captured).toContain('codernic:clear-introspection');
  });

  // ── Help menu ─────────────────────────────────────────────────────────────

  test('Help > About opens the About modal', async ({ page }) => {
    await page.getByText('Help').first().click();
    await page.getByText('About', { exact: true }).click();

    // The About modal should appear
    await expect(page.getByText(/Codernic/i).first()).toBeVisible();
    // Close the modal
    const closeBtn = page.getByRole('button', { name: /close|✕|×/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('Help > Documentation navigates to external URL in new tab', async ({ page, context }) => {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      (async () => {
        await page.getByText('Help').first().click();
        await page.getByText('Documentation').click();
      })(),
    ]);
    expect(newPage.url()).toContain('github.com');
    await newPage.close();
  });

  // ── Click-outside closes active menu ──────────────────────────────────────

  test('clicking outside closes the open dropdown', async ({ page }) => {
    await page.getByText('File').first().click();
    await expect(page.getByText('New Session')).toBeVisible();

    // Click the body (outside the menu)
    await page.mouse.click(500, 300);
    await expect(page.getByText('New Session')).not.toBeVisible();
  });
});
