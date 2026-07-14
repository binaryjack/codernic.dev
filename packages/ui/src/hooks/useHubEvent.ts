import { useEffect } from 'react';
import { WidgetHub, WidgetEvent } from '../lib/WidgetHub';

/**
 * Hook to subscribe to a WidgetHub event type cleanly within a React component.
 * Automatically unsubscribes on unmount.
 */
export function useHubEvent(type: string, callback: (event: WidgetEvent) => void | Promise<void>) {
  useEffect(() => {
    const unsubscribe = WidgetHub.subscribe(type, callback);
    return () => unsubscribe();
  }, [type, callback]);
}
