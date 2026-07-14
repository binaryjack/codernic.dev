import { test, expect } from '@playwright/test';

test.describe('Erathos Persistence and MCP Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Unset __PLAYWRIGHT__ so the UI connects to the real daemon via WebSocket bridge
    await page.addInitScript(() => {
      delete (window as any).__PLAYWRIGHT__;
    });

    page.on('console', msg => {
        if (msg.type() !== 'log' || !msg.text().includes('SAGA IN:')) {
           // console.log(`[Browser] ${msg.type()}: ${msg.text()}`);
        }
    });
  });

  async function selectValidModel(page: any) {
    console.log("Attempting to select valid model...");
    // Wait for the provider select to appear (it should be the second select)
    const providerSelect = page.locator('select').nth(1);
    try {
      await providerSelect.waitFor({ state: 'attached', timeout: 10000 });
      // Give it extra time to fetch models
      await page.waitForTimeout(2000);
      
      const selects = page.locator('select');
      if (await selects.count() > 1) {
          const providerOptions = providerSelect.locator('option');
          await expect(providerOptions.first()).toBeAttached({ timeout: 5000 }).catch(() => {});
          
          let targetProvider = null;
          for (let i = 0; i < await providerOptions.count(); i++) {
              const val = await providerOptions.nth(i).getAttribute('value');
              if (val && val.toLowerCase().includes('gguf')) {
                  targetProvider = val;
                  break;
              }
          }
          
          if (targetProvider) {
              console.log(`Selecting provider: ${targetProvider}`);
              await providerSelect.selectOption({ value: targetProvider });
              await page.waitForTimeout(2000);
              
              if (await selects.count() > 2) {
                  const modelSelect = selects.nth(2);
                  const modelOptions = modelSelect.locator('option');
                  await expect(modelOptions.first()).toBeAttached({ timeout: 5000 }).catch(() => {});
                  
                  if (await modelOptions.count() > 0) {
                      const firstModel = await modelOptions.nth(0).getAttribute('value');
                      if (firstModel) {
                          console.log(`Selecting model: ${firstModel}`);
                          await modelSelect.selectOption({ value: firstModel });
                          await page.waitForTimeout(1000);
                      }
                  }
              }
          }
      }
    } catch (e) {
      console.log("Failed to select valid model:", e);
    }
  }

  async function waitForAppReady(page: any) {
    try {
      await page.waitForFunction(() => {
        return !document.body.innerText.includes('Loading Models');
      }, { timeout: 15000 });
    } catch(e) {
      console.log('Timeout waiting for Loading Models... to disappear');
    }
    await page.waitForTimeout(2000); // Give it a sec to settle
  }

  test('Scenario 1: Schema creation, persistence, and artifact generation', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER]', msg.text()));

    test.setTimeout(60000); // 1 minute
    await page.goto('/');
    await waitForAppReady(page);

    // 1. Create a new session
    const sessionsTab = page.locator('button:has-text("Sessions")').first();
    if (await sessionsTab.isVisible()) {
      await sessionsTab.click();
    }
    const newSessionBtn = page.locator('button[title="New Session"]');
    await expect(newSessionBtn).toBeVisible();
    await newSessionBtn.click();
    await page.waitForTimeout(1000);

    // Ensure we are in Architect layout to mount the Erathos Canvas
    const layoutSelect = page.locator('select[title="Select Layout"]');
    if (await layoutSelect.isVisible()) {
      await layoutSelect.selectOption("Architect");
      await page.waitForTimeout(1000);
    }

    // Select a valid model to prevent silent background LLM task failures
    await selectValidModel(page);

    // Wait for API to be injected
    await page.waitForFunction(() => !!(window as any).__STRUCTURA_API__, undefined, { timeout: 10000 });

    // Use test API to directly manipulate canvas, bypassing complex DOM simulated clicks
    await page.evaluate(() => {
        if ((window as any).__STRUCTURA_API__) {
            console.log('State before:', (window as any).__STRUCTURA_API__.getState?.());
            // id, name, position
            (window as any).__STRUCTURA_API__.createEntity('node_1', 'Test Node', { x: 300, y: 300 });
            console.log('State after:', (window as any).__STRUCTURA_API__.getState?.());
        } else {
            console.warn('__STRUCTURA_API__ not found on window');
        }
    });
    
    // User changes session without saving
    await page.waitForTimeout(1000);

    // Switch back to Coder mode to access sessions
    if (await layoutSelect.isVisible()) {
      await layoutSelect.selectOption("Coder");
      await page.waitForTimeout(1000);
    }

    if (await sessionsTab.isVisible()) {
      await sessionsTab.click();
    }
    await newSessionBtn.click(); // This attempts to change session context
    
    // Erathos warns user about data is dirty and propose to save it
    const saveContinueBtn = page.locator('button:has-text("Save & Continue")');
    await expect(saveContinueBtn).toBeVisible({ timeout: 10000 });
    
    // User accepts to save it manually
    await saveContinueBtn.click();
    await page.waitForTimeout(2000); // Give time for save & artifact gen

    // User comes back to the previous session
    // We expect the first session to be index 1 because the new one is index 0
    const sessionItems = page.locator('[data-testid="session-item"]');
    console.log("Found session items:", await sessionItems.count());
    if (await sessionItems.count() > 1) {
        console.log("Clicking second session item");
        await sessionItems.nth(1).click();
        await page.waitForTimeout(1000);
    }

    // It creates an Artifact available in the artifacts panel
    // Switch to Artifacts tab
    const artifactsTab = page.locator('button:has-text("Artifacts")').first();
    if (await artifactsTab.isVisible()) {
      await artifactsTab.click();
    } else {
      // If Artifacts is already a visible widget, we just need to refresh its content
      await page.waitForTimeout(3000); // Give backend more time to save the artifact
      const refreshBtn = page.getByRole('button').filter({ hasText: 'Refresh' }).first();
      if (await refreshBtn.isVisible()) {
          await refreshBtn.click();
      }
      await page.waitForTimeout(1000); // Wait for the list to update
    }

    // Verify artifact is listed
    // The ArtifactsPanel only fetches on mount or session change, so we must refresh manually
    await page.getByRole('button', { name: 'Refresh' }).first().click();
    await page.waitForTimeout(1000); // Give it time to fetch

    try {
      await expect(page.getByText('_schema.md').first()).toBeVisible({ timeout: 15000 });
    } catch (e) {
      console.log("Failed to find _schema.md. Here is the HTML of the artifacts widget:");
      const html = await page.locator('body').innerHTML().catch(() => 'could not get html');
      console.log(html);
      await page.screenshot({ path: 'test-results/artifacts-panel-failure.png' });
      throw e;
    }
  });

  test('Scenario 2: Codernic uses MCP to read schema', async ({ page }) => {
    test.setTimeout(120000); // Allow LLM time to reply
    await page.goto('/');
    await waitForAppReady(page);
    
    // Create new session
    const newSessionBtn = page.locator('button[title="New Session"]');
    if (await newSessionBtn.isVisible()) {
        await newSessionBtn.click();
        await page.waitForTimeout(1000);
    }

    // Ensure we are in Architect layout to mount the Erathos Canvas
    const layoutSelect2 = page.locator('select[title="Select Layout"]');
    if (await layoutSelect2.isVisible()) {
      await layoutSelect2.selectOption("Architect");
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(1000);

    // Wait for API to be injected
    await page.waitForFunction(() => !!(window as any).__STRUCTURA_API__, undefined, { timeout: 10000 });

    // Add a node to make sure there's a schema
    await page.evaluate(() => {
        if ((window as any).__STRUCTURA_API__) {
            (window as any).__STRUCTURA_API__.createEntity('node_alpha', 'My Architecture Node', { x: 100, y: 100 });
        }
    });
    await page.waitForTimeout(1000);

    // Save the schema so MCP can read it
    const saveChangesBtn = page.locator('button[title="Save Changes"]');
    if (await saveChangesBtn.isVisible()) {
        await saveChangesBtn.click();
    }
    await page.waitForTimeout(1000);

    // Select a valid model before prompt to avoid configuration errors
    await selectValidModel(page);

    // Prompt Codernic
    const chatInput = page.getByRole('textbox');
    await expect(chatInput).toBeVisible();
    await chatInput.fill("I have drawn a schema. Use structura_get_schema to read it and tell me the node count.");
    await page.keyboard.press('Control+Enter');

    // Wait for LLM to reply or execution to finish
    await page.waitForTimeout(40000);

    // Check last assistant message
    const messages = page.locator('.markdown-content');
    const lastMessage = messages.last();
    const text = await lastMessage.innerText();
    
    console.log("LLM Response:", text);
    expect(text.length).toBeGreaterThan(0);
    
    // Basic heuristics to see if it answered properly
    expect(text.toLowerCase()).toContain('node');
  });
});
