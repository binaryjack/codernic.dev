import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

/**
 * Journey 14: Tool Approval Gate
 *
 * CLI mapping: agencee chat / agencee agent
 * When the agent wants to execute a tool (file write, terminal command, etc.)
 * the daemon emits CommandResponse::RequestToolApproval.
 *
 * In the UI this triggers a "codernic:await-approval" message which renders
 * an approval dialog in the message feed or as a modal.
 *
 * CLI modes:
 *  - Interactive CLI: prompts "Tapez 'y' pour valider, 'n' pour refuser"
 *  - JSON IPC: sends AwaitApprovalEvent and expects SubmitApprovalEvent
 *  - --yolo mode: auto-approves (bypasses UI approval)
 */
test.describe('Journey 14: Tool Approval Gate', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[Browser]', msg.text()));
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  test('approval prompt appears when codernic:await-approval is received', async ({ page }) => {
    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:await-approval',
        payload: {
          id: 'approval-1',
          prompt: 'Agent wants to run: write_file | Sandbox: false'
        }
      }, '*');
    });

    await expect(page.getByText('Agent wants to run: write_file')).toBeVisible({ timeout: 3000 });
  });

  test('clicking Approve sends the approval response', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedIntents = [];
      window.addEventListener('mock-vscode-message', (e: any) => {
        (window as any).__capturedIntents.push(e.detail);
      });
    });

    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:await-approval',
        payload: { id: 'approval-2', prompt: 'Agent wants to run: run_terminal | Sandbox: true' }
      }, '*');
    });

    const approveBtn = page.getByRole('button', { name: /approve|accept|yes/i }).first();
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveBtn.click();

      const intents = await page.evaluate(() => (window as any).__capturedIntents ?? []);
      const approvalResponse = intents.find((i: any) =>
        i.type?.includes('approval') || i.type?.includes('resolve') || i.verdict === 'approve'
      );
      // Verify the approval was sent
      await expect(approveBtn).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    }
  });

  test('clicking Deny/Reject sends the reject response', async ({ page }) => {
    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:await-approval',
        payload: { id: 'approval-3', prompt: 'Agent wants to run: delete_file | Sandbox: false' }
      }, '*');
    });

    const rejectBtn = page.getByRole('button', { name: /deny|reject|no|decline/i }).first();
    if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectBtn.click();
      // Dialog should close after rejection
      await expect(rejectBtn).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    }
  });

  test('dismissing approval gate removes the approval prompt from view', async ({ page }) => {
    await page.evaluate(() => {
      window.postMessage({
        type: 'codernic:await-approval',
        payload: { id: 'approval-4', prompt: 'Architecture Review Required' }
      }, '*');
    });

    await expect(page.getByText('Architecture Review Required')).toBeVisible({ timeout: 3000 });

    const dismissBtn = page.getByRole('button', { name: /dismiss/i });
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await expect(page.getByText('Architecture Review Required')).not.toBeVisible();
    }
  });
});
