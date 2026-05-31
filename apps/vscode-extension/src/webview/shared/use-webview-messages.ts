import { useEffect } from 'react';
import { vscode } from '../vscode-api';

export const useWebviewMessages = function <T>(
  handler: (msg: T) => void,
  setup?: () => void,
): void {
  useEffect(() => {
    vscode.postMessage({ type: 'ready' });
    if (setup) setup();

    const listener = (event: MessageEvent) => handler(event.data as T);
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler, setup]);
};
