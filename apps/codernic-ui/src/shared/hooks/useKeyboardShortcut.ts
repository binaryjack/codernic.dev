import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  ctrlKey: boolean,
  callback: (e: KeyboardEvent) => void,
  active: boolean = true,
  preventIfSelecting: boolean = false
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active) return;
      if (ctrlKey && !e.ctrlKey) return;
      if (e.key.toLowerCase() === key.toLowerCase()) {
        if (preventIfSelecting) {
          const hasSelection = window.getSelection()?.toString().length;
          const target = e.target as HTMLElement;
          const hasInputSelection = (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) 
            && target.selectionStart !== target.selectionEnd;
            
          if (hasSelection || hasInputSelection) {
            return; // User is probably copying text, don't trigger shortcut
          }
        }
        
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [key, ctrlKey, callback, active, preventIfSelecting]);
}
