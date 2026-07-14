export class DOMWaiter {
  /**
   * Waits for an element to appear in the DOM using a MutationObserver.
   * This is much more efficient and deterministic than polling with setTimeout.
   */
  static async waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
    const elements = await this.waitForElements([selector], timeout);
    return elements[0];
  }

  /**
   * Waits for multiple elements to appear in the DOM simultaneously.
   */
  static async waitForElements(selectors: string[], timeout = 5000): Promise<HTMLElement[]> {
    return new Promise((resolve, reject) => {
      const checkAll = () => {
        const elements = selectors.map(s => document.querySelector(s));
        if (elements.every(el => el !== null)) {
          return elements as HTMLElement[];
        }
        return null;
      };

      // 1. Check if they already exist
      const existing = checkAll();
      if (existing) {
        requestAnimationFrame(() => resolve(existing));
        return;
      }

      // 2. Setup observer
      const observer = new MutationObserver(() => {
        const found = checkAll();
        if (found) {
          observer.disconnect();
          if (timeoutId) clearTimeout(timeoutId);
          requestAnimationFrame(() => resolve(found));
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // 3. Setup timeout
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`[DOMWaiter] Timeout (${timeout}ms) waiting for elements: ${selectors.join(', ')}`));
      }, timeout);
    });
  }

  /**
   * Dispatches a raw DOM click event that bubbles up, perfectly simulating a user click.
   */
  static async simulateClick(element: HTMLElement): Promise<void> {
    // Smooth scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait for scroll to settle
    await new Promise(r => setTimeout(r, 300));
    
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  /**
   * Simulates typing into an input or textarea
   */
  static async simulateType(element: HTMLElement, text: string): Promise<void> {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 100));

    const isInput = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    if (isInput) {
      (element as HTMLInputElement).value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * Simulates hover (mouseenter, mouseover)
   */
  static async simulateHover(element: HTMLElement): Promise<void> {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 100));

    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
  }
}
