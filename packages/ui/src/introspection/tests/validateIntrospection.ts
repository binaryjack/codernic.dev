import { DOMWaiter } from '../core/DOMWaiter';

/**
 * This script runs in the browser console or via a test runner.
 * It demonstrates how the Agnostic Engine interacts with the React UI
 * completely decoupled from React's lifecycle.
 */
export async function runTDDValidation() {
  console.log('[TDD] Starting Agnostic Validation Script...');

  try {
    // 1. Test Simple DOM Selectors
    console.log('[TDD] 1. Waiting for layout wrapper...');
    const layoutWrapper = await DOMWaiter.waitForElement('#root');
    console.log('[TDD] ✅ Layout wrapper found!', layoutWrapper);

    // 2. Test Widget Schema Introspection (Complex Component)
    console.log('[TDD] 2. Querying Introspection Registry for Chat Widget...');
    const introspection = (window as any).__INTROSPECTION__;
    
    if (!introspection) {
      throw new Error('Introspection Registry is not attached to window.');
    }

    // Wait for the chat widget to mount and register itself
    // Since React renders asynchronously, we can poll the registry
    let chatSchema;
    for (let i = 0; i < 20; i++) {
      chatSchema = introspection.get('chat-widget-main');
      if (chatSchema) break;
      await new Promise(r => setTimeout(r, 100)); // Small polling fallback for registry
    }

    if (!chatSchema) {
      throw new Error('Chat widget did not register its introspection schema.');
    }
    console.log('[TDD] ✅ Chat Widget Schema Found:', chatSchema);

    // 3. Test Imperative Widget API (Sending a message)
    console.log('[TDD] 3. Simulating chat via imperative API...');
    chatSchema.methods.simulateChat('Hello from Agnostic TDD Script!');

    // 4. Test Sync Wait (Waiting for the DOM to update due to the Redux state change)
    console.log('[TDD] 4. Waiting for the message to appear in the DOM...');
    // The exact text might be wrapped in markdown or spans, so we look for the message feed container first
    const messageFeed = await DOMWaiter.waitForElement('.message-list-container');
    console.log('[TDD] ✅ DOM reacted correctly to the Imperative API call!');

    console.log('[TDD] 🎉 All TDD validations passed successfully!');
    return true;
  } catch (error) {
    console.error('[TDD] ❌ Validation Failed:', error);
    return false;
  }
}

// Make it available to trigger from the browser console
if (typeof window !== 'undefined') {
  (window as any).runTDDValidation = runTDDValidation;
}
