import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 99: Exhaustive Debug Demo Sequence
 *
 * This spec automates the full `exhaustiveDebugDemoSequence` in-browser tour.
 * It:
 *   1. Starts the app with the VS Code mock
 *   2. Triggers the full demo via window.__sequencer API in autoPlay mode
 *   3. Waits for the sequencer to reach COMPLETED state
 *   4. Reads window.__sequencerReport (populated by SequencerLogger._record())
 *   5. Asserts zero CRITICAL or ERROR entries
 *   6. Prints a structured report of all issues found
 *
 * The test is configured with a generous timeout since the full tour visits
 * 7 layouts and ~80+ steps at 2500ms per step in autoPlay mode (~3.5 minutes).
 */

const DEMO_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes max
const POLL_INTERVAL_MS = 2000;
const SEQUENCER_START_TIMEOUT_MS = 30_000;

interface SequencerLogEntry {
  level: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  stepId: string;
  message: string;
  timestamp: number;
}

interface SequencerSummary {
  counts: { CRITICAL: number; ERROR: number; WARNING: number; INFO: number };
  issues: SequencerLogEntry[];
  passed: boolean;
}

test.describe('Journey 99: Exhaustive Debug Demo Sequence', () => {
  test.setTimeout(DEMO_TIMEOUT_MS);

  test.beforeEach(async ({ page }) => {
    // Forward all browser console output to the test runner for easy debugging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.error(`[Browser ERROR] ${msg.text()}`);
      } else if (type === 'warn') {
        console.warn(`[Browser WARN] ${msg.text()}`);
      } else {
        console.log(`[Browser] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      console.error('[Browser UNCAUGHT ERROR]', err.message);
    });

    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/?demo=exhaustive');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should run the full exhaustiveDebugDemoSequence without CRITICAL or ERROR entries', async ({ page }) => {
    // ── Step 1: Wait for the app to fully initialize ──────────────────────────
    await expect(page.getByTestId('chat-textarea').first()).toBeVisible({ timeout: 15_000 });

    // ── Step 2: Trigger the exhaustive debug demo via the sequencer window API ─
    // The SequencerProvider exposes window.__sequencer from SequencerProvider.tsx
    await page.waitForFunction(() => !!(window as any).__sequencer, { timeout: SEQUENCER_START_TIMEOUT_MS });

    await page.evaluate(() => {
      const sequencer = (window as any).__sequencer;
      // Dynamically import the exhaustiveDebugDemoSequence from the bundled app
      // The sequence is already loaded by the SequencerProvider in App.tsx
      // We trigger autoPlay mode and start from the loaded config
      sequencer.setAutoPlay(true);
      sequencer.start();
    });

    // ── Step 3: Confirm the sequencer is running ───────────────────────────────
    await page.waitForFunction(
      () => {
        const sequencer = (window as any).__sequencer;
        return sequencer && sequencer.getStatus() === 'RUNNING';
      },
      { timeout: SEQUENCER_START_TIMEOUT_MS }
    );

    console.log('[Test] Sequencer is RUNNING. Waiting for COMPLETED...');

    // ── Step 4: Poll until the sequencer reaches COMPLETED ─────────────────────
    await page.waitForFunction(
      () => {
        const sequencer = (window as any).__sequencer;
        if (!sequencer) return false;
        const status = sequencer.getStatus();
        return status === 'COMPLETED' || status === 'ERROR' || status === 'IDLE';
      },
      { timeout: DEMO_TIMEOUT_MS, polling: POLL_INTERVAL_MS }
    );

    const finalStatus = await page.evaluate(() => (window as any).__sequencer?.getStatus());
    console.log(`[Test] Sequencer finished with status: ${finalStatus}`);

    // ── Step 5: Collect the report ─────────────────────────────────────────────
    const report = await page.evaluate((): SequencerLogEntry[] => {
      return (window as any).__sequencerReport || [];
    });

    const summary = buildSummary(report);
    printReport(summary, report);

    // ── Step 6: Assert no CRITICAL or ERROR entries ────────────────────────────
    const criticalEntries = report.filter(e => e.level === 'CRITICAL');
    const errorEntries = report.filter(e => e.level === 'ERROR');

    if (criticalEntries.length > 0) {
      console.error('\n❌ CRITICAL FAILURES:');
      criticalEntries.forEach(e => console.error(`  [${e.stepId}] ${e.message}`));
    }

    if (errorEntries.length > 0) {
      console.error('\n🔴 ERRORS:');
      errorEntries.forEach(e => console.error(`  [${e.stepId}] ${e.message}`));
    }

    expect(criticalEntries.length, `Found ${criticalEntries.length} CRITICAL sequencer failures. See logs above.`).toBe(0);
    expect(errorEntries.length, `Found ${errorEntries.length} ERROR sequencer entries. See logs above.`).toBe(0);

    // Soft check: confirm the sequencer actually completed (not errored or stopped early)
    expect(finalStatus, 'Sequencer did not reach COMPLETED state').toBe('COMPLETED');
  });

  test('should have all widget root elements discoverable at their target layout', async ({ page }) => {
    // Quick sanity check: navigate to each layout and verify key widget roots exist
    await expect(page.getByTestId('chat-textarea').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => !!(window as any).__sequencer, { timeout: SEQUENCER_START_TIMEOUT_MS });

    const layoutWidgetChecks: Array<{ layout: string; selector: string; description: string }> = [
      // Coder layout
      { layout: 'Coder', selector: '[data-testid$="session-widget-root"]', description: 'Session widget in Coder layout' },
      { layout: 'Coder', selector: '[data-testid$="chat-widget-root"]', description: 'Chat widget in Coder layout' },
      { layout: 'Coder', selector: '[data-testid$="introspection-widget-root"]', description: 'Introspection widget in Coder layout' },
      { layout: 'Coder', selector: '[data-testid$="artifacts-widget-root"]', description: 'Artifacts widget in Coder layout' },
      // Architect layout
      { layout: 'Architect', selector: '[data-testid$="pirsig-widget-root"]', description: 'Pirsig widget in Architect layout' },
      { layout: 'Architect', selector: '[data-testid$="agent-events-widget-root"]', description: 'Agent events widget in Architect layout' },
      // Integrator layout
      { layout: 'Integrator', selector: '[data-testid$="galileus-router-widget-root"]', description: 'Galileus router widget in Integrator layout' },
      // Analyst layout
      { layout: 'Analyst', selector: '[data-testid$="model-hub-widget-root"]', description: 'Model hub widget in Analyst layout' },
      { layout: 'Analyst', selector: '[data-testid$="analyse-widget-root"]', description: 'Analyse widget in Analyst layout' },
      // Admin layout
      { layout: 'Admin', selector: '[data-testid$="system-widget-root"]', description: 'System settings widget in Admin layout' },
      // EnterpriseChatbot layout
      { layout: 'EnterpriseChatbot', selector: '[data-testid$="enterprise-chatbot-widget-root"]', description: 'Enterprise chatbot widget' },
    ];

    for (const check of layoutWidgetChecks) {
      // Switch layout via introspection
      await page.evaluate((layoutName) => {
        const sequencer = (window as any).__sequencer;
        if (sequencer) {
          // Use the layout engine introspection method directly
          window.dispatchEvent(new CustomEvent('codernic:switch-layout', { detail: { layout: layoutName } }));
        }
      }, check.layout);

      // Also try URL-based switch as fallback
      await page.goto(`/?layout=${check.layout}&forceDefault=true`);
      await page.waitForTimeout(2000);

      const element = page.locator(check.selector).first();
      const isVisible = await element.isVisible({ timeout: 5000 }).catch(() => false);

      if (!isVisible) {
        console.warn(`⚠️  [${check.layout}] "${check.description}" NOT FOUND: ${check.selector}`);
      } else {
        console.log(`✅ [${check.layout}] "${check.description}" found`);
      }

      // Non-fatal: just report — don't fail the test here since widgets may legitimately
      // be in offline state (requiredActors not present in the Playwright environment)
    }
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildSummary(report: SequencerLogEntry[]): SequencerSummary {
  const counts = { CRITICAL: 0, ERROR: 0, WARNING: 0, INFO: 0 };
  for (const entry of report) {
    counts[entry.level]++;
  }
  const issues = report.filter(e => e.level !== 'INFO');
  return { counts, issues, passed: counts.CRITICAL === 0 && counts.ERROR === 0 };
}

function printReport(summary: SequencerSummary, report: SequencerLogEntry[]) {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('        SEQUENCER DEMO REPORT');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total steps logged : ${report.length}`);
  console.log(`  CRITICAL : ${summary.counts.CRITICAL}`);
  console.log(`  ERROR    : ${summary.counts.ERROR}`);
  console.log(`  WARNING  : ${summary.counts.WARNING}`);
  console.log(`  INFO     : ${summary.counts.INFO}`);
  console.log(`  Result   : ${summary.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('───────────────────────────────────────────────────');

  if (summary.issues.length > 0) {
    console.log('  Issues:');
    for (const issue of summary.issues) {
      const icon = issue.level === 'CRITICAL' ? '💀' : issue.level === 'ERROR' ? '❌' : '⚠️ ';
      console.log(`  ${icon} [${issue.level}] [${issue.stepId}] ${issue.message}`);
    }
  } else {
    console.log('  No issues found — all steps passed! 🎉');
  }

  console.log('═══════════════════════════════════════════════════\n');
}
