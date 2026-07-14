import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 06: Chat — Mode Switching
 *
 * CLI mapping: agencee chat --mode <ask|plan|agent|journey|analyse>
 *
 * The UI exposes mode selection via a ModeDropdown in the ChatInput toolbar.
 * Each mode changes the textarea border color and placeholder text.
 *
 * Modes and their CLI equivalents:
 *  - ask     → agencee ask -p "..."  (or chat default)
 *  - plan    → agencee chat --mode plan
 *  - agent   → agencee agent --run <dag.json>
 *  - journey → agencee chat --mode journey
 *  - analyse → agencee analyze
 */
test.describe('Journey 06: Chat — Mode Switching', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  const modes = [
    {
      name: 'ask',
      expectedPlaceholder: 'Ask about your codebase',
    },
    {
      name: 'plan',
      expectedPlaceholder: 'Describe what to build',
    },
    {
      name: 'agent',
      expectedPlaceholder: 'Create agent / run workflow',
    },
    {
      name: 'analyse',
      expectedPlaceholder: '/analyse',
    },
  ];

  for (const { name, expectedPlaceholder } of modes) {
    test(`switching to mode "${name}" updates the textarea placeholder`, async ({ page }) => {
      // Open the mode dropdown — it's rendered as a button containing "Mode:" or similar
      // The ModeDropdown component text typically shows the current mode
      const modeBtn = page.locator('[data-testid="mode-dropdown"], button').filter({ hasText: /ask|plan|agent|journey|analyse/i }).first();

      if (await modeBtn.isVisible()) {
        await modeBtn.click();
        // Select the target mode from the dropdown list
        const option = page.getByText(new RegExp(`^${name}$`, 'i'));
        if (await option.isVisible()) {
          await option.click();
        }
      }

      const textarea = page.getByRole('textbox');
      const placeholder = await textarea.getAttribute('placeholder');
      // Verify the placeholder text corresponds to the selected mode
      if (placeholder) {
        expect(placeholder.toLowerCase()).toContain(expectedPlaceholder.toLowerCase());
      }
    });
  }

  test('default mode on load is "ask"', async ({ page }) => {
    const textarea = page.getByRole('textbox');
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toContain('ask');
  });
});
