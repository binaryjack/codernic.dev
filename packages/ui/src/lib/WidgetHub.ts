/**
 * Represents an event flowing through the WidgetHub
 */
export interface WidgetEvent {
  type: string;
  payload: Record<string, any>;
  // An optional dedup key to crush identical rapid-fire events (e.g. 'scroll_to_123')
  dedupKey?: string;
}

type EventHandler = (event: WidgetEvent) => void | Promise<void>;

/**
 * Intelligent Event Hub for cross-widget communication.
 * Features a FIFO Queue with a 'takeLatest' / 'debounce' mechanism
 * to prevent UI race conditions and jitter.
 */
class WidgetHubCore {
  private queue: WidgetEvent[] = [];
  private isProcessing = false;
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to a specific event type
   */
  subscribe(type: string, handler: EventHandler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  /**
   * Publish an event into the queue.
   * If an event with the same `dedupKey` is already pending in the queue, 
   * it gets overwritten by this newer one (Take Last behavior).
   */
  publish(event: WidgetEvent) {
    if (event.dedupKey) {
      // "Take Last" / Dedup logic: remove existing pending events with the same dedupKey
      this.queue = this.queue.filter(e => e.dedupKey !== event.dedupKey);
    }
    this.queue.push(event);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (!event) continue;

      const handlers = this.listeners.get(event.type);
      if (handlers) {
        // Run handlers concurrently for the same event
        const promises = Array.from(handlers).map(async (handler) => {
          try {
            await handler(event);
          } catch (e) {
            console.error('[WidgetHub] Handler error:', e);
          }
        });
        
        await Promise.all(promises);
      }

      // Small tick to let the UI breathe between separate distinct events
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isProcessing = false;
  }
}

export const WidgetHub = new WidgetHubCore();
