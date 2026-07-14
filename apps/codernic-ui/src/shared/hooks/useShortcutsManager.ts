import { useEffect, useState, useCallback } from 'react';
import { getCodernicHttpUrl } from '../config';
import { useSelector } from 'react-redux';
import { selectSandboxMode } from '../../entities/app/model/app-slice';

export function useShortcutsManager(onLayoutChange: (layoutName: string) => void) {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({});
  const sandboxMode = useSelector(selectSandboxMode);

  const fetchShortcuts = useCallback(async () => {
    if (sandboxMode) return;
    try {
      const baseUrl = getCodernicHttpUrl();
      const res = await fetch(`${baseUrl}/api/shortcuts?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setShortcuts(data);
      }
    } catch (e) {
      console.warn('Failed to load shortcuts from API', e);
    }
  }, [sandboxMode]);

  useEffect(() => {
    fetchShortcuts();
  }, [fetchShortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Build key string to match (e.g., "Alt+1", "Ctrl+Shift+K")
      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Meta');
      
      const keyName = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
      
      // Prevent modifier-only events
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
      
      keys.push(keyName);
      const pressedShortcut = keys.join('+');

      // Check if shortcut matches any layout
      for (const [layoutName, shortcut] of Object.entries(shortcuts)) {
        if (shortcut.toUpperCase() === pressedShortcut.toUpperCase()) {
          e.preventDefault();
          onLayoutChange(layoutName);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, onLayoutChange]);

  return { shortcuts, fetchShortcuts };
}
