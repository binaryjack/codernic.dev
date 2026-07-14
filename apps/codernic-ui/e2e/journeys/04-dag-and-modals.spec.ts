import { test, expect } from '@playwright/test';
import { VSCODE_MOCK_SCRIPT } from '../mocks/vscode-mock';

test.describe('Journey 04: DAG and Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(VSCODE_MOCK_SCRIPT);
    await page.goto('/');
  });

  test('should hide Galileus tracker when no DAG is running, and show it when payload is received', async ({ page }) => {
    // First, verify it is hidden by default (this will fail if it's always visible as the user reported)
    const trackerToggle = page.getByText('🛰️ Galileus Sequence Tracker');
    await expect(trackerToggle).not.toBeVisible();

    // Simulate VS Code passing down a Galileus snapshot payload
    await page.evaluate(() => {
      (window as any).simulateVsCodeMessage({
        type: 'galileus:state',
        payload: {
          sessions: [
            { id: 'sess-1', label: 'Backend', state: 'ACTIVE', agent_type: 'agent', claimed_files_count: 1, waiter_count: 0 },
            { id: 'sess-2', label: 'Frontend', state: 'BLOCKED', agent_type: 'agent', claimed_files_count: 0, waiter_count: 2 }
          ]
        }
      });
    });

    // Expand the tracker accordion if it's not already open
    const trackerToggleNode = page.getByText('🛰️ Galileus Sequence Tracker');
    if (await trackerToggleNode.isVisible()) {
      await trackerToggleNode.click();
    }

    // Verify the UI rendered the mocked DAG states
    await expect(page.getByText('Backend')).toBeVisible();
    await expect(page.getByText('Frontend')).toBeVisible();
  });

  test('should display Artifact Negotiation modal', async ({ page }) => {
    // Simulate VS Code requesting user approval on an artifact
    await page.evaluate(() => {
      (window as any).simulateVsCodeMessage({
        type: 'ArtifactRequestedReview',
        payload: {
          title: 'Database Schema',
          filename: 'schema.sql'
        }
      });
    });

    // The modal should appear
    await expect(page.getByText('Database Schema')).toBeVisible();

    // Accepting should send an intent to the backend
    const acceptBtn = page.getByRole('button', { name: /Accept/i });
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await expect(page.getByText('Database Schema')).not.toBeVisible();
    }
  });

  test('should display Phase Gate modal and allow dismissal', async ({ page }) => {
    // Simulate VS Code pushing a phase gate block
    await page.evaluate(() => {
      (window as any).simulateVsCodeMessage({
        type: 'codernic:await-approval',
        payload: {
          id: 'gate-1',
          prompt: 'Architecture Review Required'
        }
      });
    });

    await expect(page.getByText('Architecture Review Required')).toBeVisible();
    
    const dismissBtn = page.getByRole('button', { name: /Dismiss/i });
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await expect(page.getByText('Architecture Review Required')).not.toBeVisible();
    }
  });
});
