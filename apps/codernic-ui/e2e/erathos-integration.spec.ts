import { test, expect } from '@playwright/test';

test.describe('Erathos Integration E2E Tests', () => {
  test('should display canvas tabs and trigger approval modal flow via mock WS', async ({ page }) => {
    // Listen to console from browser
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    const postedMessages: any[] = [];
    let mockWs: any = null;

    // 1. Mock the WebSocket server on port 47321 with regex matching
    await page.routeWebSocket(/.*47321.*/, ws => {
      console.log('[TEST WS] WebSocket connection intercepted:', ws.url());
      mockWs = ws;
      ws.onMessage(message => {
        try {
          const parsed = JSON.parse(message as string);
          console.log('[TEST WS] Message from client:', parsed);
          postedMessages.push(parsed);
        } catch (e) {
          console.error('[TEST WS] Failed to parse WS message:', e);
        }
      });
    });

    // 2. Go to home page
    await page.goto('/');

    // 3. Wait for the WS connection to establish
    await page.waitForTimeout(3000);

    if (!mockWs) {
      console.log('[TEST WS] mockWs is still null. Retrying wait...');
      await page.waitForTimeout(2000);
    }

    expect(mockWs).not.toBeNull();

    // Send dag_initialized to show tabs
    await mockWs.send(JSON.stringify({
      type: 'kernel_state_update',
      payload: {
        type: 'dag_initialized',
        nodes: [
          {
            id: 'start',
            role: 'Start node',
            status: 'completed',
            dependencies: []
          },
          {
            id: 'test-node-123',
            role: 'Ask node',
            status: 'pending',
            dependencies: ['start']
          }
        ]
      }
    }));

    // 4. Check tabs exist
    const canvasTab = page.locator('button:has-text("Interactive Canvas")');
    const listTab = page.locator('button:has-text("Sequence List")');
    await expect(canvasTab).toBeVisible({ timeout: 5000 });
    await expect(listTab).toBeVisible({ timeout: 5000 });

    // 5. Switch to sequence list tab and verify style change (using force click to bypass canvas overlay intercept)
    await listTab.click({ force: true });
    await page.waitForTimeout(500); // Wait for transition and render

    // 6. Send mock approval request event through WebSocket
    await mockWs.send(JSON.stringify({
      type: 'codernic:await-approval',
      payload: {
        id: 'test-node-123',
        prompt: 'Do you want to run the compiler tests now?'
      }
    }));

    // 7. Verify that the Approval Modal has popped up
    const modalTitle = page.locator('h2:has-text("Validation Approval Gate")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    
    const nodeText = page.locator('text=Node ID: test-node-123');
    await expect(nodeText).toBeVisible();

    const promptText = page.locator('text=Do you want to run the compiler tests now?');
    await expect(promptText).toBeVisible();

    // 8. Write feedback and approve
    const textarea = page.locator('textarea[placeholder*="Type feedback"]');
    await textarea.fill('Yes, run all tests');

    const approveButton = page.locator('button:has-text("Approve & Continue")');
    await approveButton.click();

    // 9. Verify modal has disappeared
    await expect(modalTitle).not.toBeVisible();

    // 10. Verify the correct message was sent back to WS server
    await page.waitForTimeout(500);

    const foundMsg = postedMessages.find(m => m.type === 'codernic:submit-approval');
    expect(foundMsg).toBeDefined();
    
    expect(foundMsg.type).toBe('codernic:submit-approval');
    expect(foundMsg.payload).toEqual({
      id: 'test-node-123',
      verdict: 'approve',
      feedback: 'Yes, run all tests'
    });
  });
});
