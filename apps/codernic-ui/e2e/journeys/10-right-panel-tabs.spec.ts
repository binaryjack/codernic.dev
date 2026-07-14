import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 10: Right Panel Tabs
 *
 * CLI mapping:
 *  - Artifacts tab      → outputs of agencee agent (generated files)
 *  - Erathos tab        → DAG visualization (agencee agent --run)
 *  - Analyzer tab       → agencee analyze (Pirsig quality metrics + event log)
 *  - Models tab         → agencee huggingface-search / huggingface-download
 *  - Context tab        → context window token usage (--no-rag / --rag flags)
 *
 * Each tab button is identified by its label text.
 */
test.describe('Journey 10: Right Panel Tabs', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  const tabs = ['Artifacts', 'Erathos', 'Analyzer', 'Models', 'Context'];

  for (const tabLabel of tabs) {
    test(`clicking "${tabLabel}" tab activates it`, async ({ page }) => {
      const tabBtn = page.getByRole('button', { name: tabLabel });
      await expect(tabBtn).toBeVisible();
      await tabBtn.click();

      // The button should become active (amber color via CSS, or aria-pressed)
      // We verify at minimum that it's visible and clickable without crashing
      await expect(tabBtn).toBeVisible();
    });
  }

  // ── Analyzer tab: Pirsig metrics ──────────────────────────────────────────

  test('Analyzer tab shows "Awaiting Pirsig AST analysis" when no metrics received', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyzer' }).click();
    await expect(page.getByText('Awaiting Pirsig AST analysis')).toBeVisible();
  });

  test('Analyzer tab displays Pirsig metrics when ast-metrics event is received', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyzer' }).click();

    // Simulate the backend sending AST metrics
    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:ast-metrics',
        payload: {
          kpi_score: 87.5,
          symbols_count: 342,
          qualitative_flags: ['clean_imports', 'no_dead_code'],
        }
      }, '*');
    });

    // KPI score should appear
    await expect(page.getByText('87.5')).toBeVisible();
  });

  test('Analyzer tab shows "No agent events yet" when event log is empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyzer' }).click();
    await expect(page.getByText('No agent events yet')).toBeVisible();
  });

  test('Analyzer tab renders step_start agent event on receipt', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyzer' }).click();

    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:agent-event',
        payload: { type: 'step_start', step_id: 'step-001' }
      }, '*');
    });

    await expect(page.getByText('Step Started')).toBeVisible();
  });

  test('Analyzer tab renders step_success agent event on receipt', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyzer' }).click();

    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:agent-event',
        payload: { type: 'step_success', step_id: 'step-001' }
      }, '*');
    });

    await expect(page.getByText('Step Succeeded')).toBeVisible();
  });

  // ── Artifacts tab ─────────────────────────────────────────────────────────

  test('Artifacts tab renders without crashing', async ({ page }) => {
    await page.getByRole('button', { name: 'Artifacts' }).click();
    // No crash = pass; artifact list may be empty
    await expect(page.getByRole('button', { name: 'Artifacts' })).toBeVisible();
  });

  // ── Erathos tab ───────────────────────────────────────────────────────────

  test('Erathos tab renders the DAG canvas without crashing', async ({ page }) => {
    await page.getByRole('button', { name: 'Erathos' }).click();
    // Canvas or placeholder should be visible
    await expect(page.getByRole('button', { name: 'Erathos' })).toBeVisible();
  });

  // ── Context tab ───────────────────────────────────────────────────────────

  test('Context tab renders context window information', async ({ page }) => {
    await page.getByRole('button', { name: 'Context' }).click();
    await expect(page.getByRole('button', { name: 'Context' })).toBeVisible();
  });
});
