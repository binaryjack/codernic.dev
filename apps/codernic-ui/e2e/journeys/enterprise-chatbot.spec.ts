import { test, expect } from '@playwright/test';

test.describe('Enterprise Chatbot Widget', () => {
  test('should render layout and send query to headless API endpoint', async ({ page }) => {
    // 1. Intercept the headless API to verify the request payload and headers
    await page.route('**/api/v1/chatbot/query', async route => {
      const request = route.request();
      expect(request.method()).toBe('POST');
      
      const postData = JSON.parse(request.postData() || '{}');
      expect(postData.text).toBe('Show me Q3 Financials');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: 'Authorized RAG response for Q3 Financials.' }),
      });
    });

    // 2. Load the App with the EnterpriseChatbot layout 
    // We append the `layout=EnterpriseChatbot` query param which LayoutEnginePOC consumes
    await page.goto('/?layout=EnterpriseChatbot');

    // 3. Verify the chat input renders (proving the layout successfully loaded the widget)
    const chatInput = page.locator('textarea');
    await expect(chatInput).toBeVisible();

    // 4. Send a query
    await chatInput.fill('Show me Q3 Financials');
    await page.keyboard.press('Control+Enter');

    // 5. Assert the mock response is appended to the message feed
    const responseMsg = page.locator('text=Authorized RAG response for Q3 Financials.');
    await expect(responseMsg).toBeVisible();
  });
});
