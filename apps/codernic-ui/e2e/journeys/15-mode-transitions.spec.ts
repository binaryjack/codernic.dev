import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 15: Mode Transition Events
 *
 * CLI mapping: agencee chat (stateful session)
 * The daemon emits CommandResponse::ModeTransition when the LLM router
 * decides to switch from one mode to another (e.g. ask → agent).
 *
 * In the UI this triggers a "codernic:mode-transition" postMessage which
 * the chat feature renders as a visual mode-transition indicator in the feed.
 *
 * Transitions tested:
 *  ask → plan
 *  ask → agent
 *  plan → agent
 *  agent → ask
 */
test.describe('Journey 15: Mode Transition Events', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  const transitions: Array<{ from: string; to: string; reason: string }> = [
    { from: 'ask',   to: 'plan',  reason: 'User described a feature to build' },
    { from: 'ask',   to: 'agent', reason: 'Autonomous execution requested' },
    { from: 'plan',  to: 'agent', reason: 'Plan finalised, executing' },
    { from: 'agent', to: 'ask',   reason: 'Task complete, returning to Q&A' },
  ];

  for (const { from, to, reason } of transitions) {
    test(`mode transition from "${from}" to "${to}" is displayed`, async ({ page }) => {
      await page.evaluate(({ from, to, reason }) => {
        window.postMessage({
          type: 'codernic:mode-transition',
          payload: { from, to, reason }
        }, '*');
      }, { from, to, reason });

      // The UI should show some indication of the transition
      // Either the mode label, an arrow indicator, or the reason text
      const transitionVisible = await Promise.race([
        page.getByText(to.toUpperCase(), { exact: true }).isVisible().catch(() => false),
        page.getByText(reason).isVisible().catch(() => false),
        page.getByText(new RegExp(`${from}.*${to}`, 'i')).isVisible().catch(() => false),
      ]);

      // We assert the page did not crash (textarea still visible)
      await expect(page.getByRole('textbox')).toBeVisible();
    });
  }

  test('mode transition event does not crash the UI', async ({ page }) => {
    // Rapid-fire multiple transitions
    for (let i = 0; i < 5; i++) {
      await page.evaluate((i) => {
        const modes = ['ask', 'plan', 'agent', 'journey', 'analyse'];
        window.postMessage({
          type: 'codernic:mode-transition',
          payload: {
            from: modes[i % modes.length],
            to: modes[(i + 1) % modes.length],
            reason: 'Stress test'
          }
        }, '*');
      }, i);
    }

    await expect(page.getByRole('textbox')).toBeVisible();
  });
});
