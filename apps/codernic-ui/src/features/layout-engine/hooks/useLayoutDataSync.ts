import { useState, useEffect, useCallback } from 'react';
import type { BlockState } from '@ai-agencee/ui/layout-engine';
import { DEFAULT_LAYOUTS } from '../model/default-layouts';
import { getCodernicHttpUrl } from '../../../shared/config';
import { useSelector } from 'react-redux';
import { selectSandboxMode } from '../../../entities/app/model/app-slice';

export function useLayoutDataSync() {
  const getInitialLayout = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('layout') || 'Coder';
  };

  const [savedLayouts, setSavedLayouts] = useState<Record<string, Record<string, BlockState>>>(DEFAULT_LAYOUTS);
  const [activeLayoutName, setActiveLayoutName] = useState<string | null>(getInitialLayout);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync URL when active layout changes
  useEffect(() => {
    if (activeLayoutName) {
      const url = new URL(window.location.href);
      url.searchParams.set('layout', activeLayoutName);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeLayoutName]);

  // Listen to browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const layout = params.get('layout');
      if (layout) setActiveLayoutName(layout);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const sandboxMode = useSelector(selectSandboxMode);

  // Fetch layouts from API
  useEffect(() => {
    if (sandboxMode) {
      setIsLoaded(true);
      return;
    }
    const fetchLayouts = async () => {
      try {
        const baseUrl = getCodernicHttpUrl();
        const res = await fetch(`${baseUrl}/api/layouts?t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        if (res.ok) {
          const layouts = await res.json();
          setSavedLayouts((prev) => ({ ...prev, ...layouts }));
        }
      } catch (e) {
        // Suppress warning if backend is unreachable and we expect it to be
        console.warn('Failed to load layouts from API:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchLayouts();
  }, [sandboxMode]);

  const handleSelectLayout = useCallback((layoutName: string, forceDefault: boolean = false) => {
    const url = new URL(window.location.href);
    url.searchParams.set('layout', layoutName);
    if (forceDefault) {
      url.searchParams.set('forceDefault', 'true');
    } else {
      url.searchParams.delete('forceDefault');
    }
    window.history.replaceState({}, '', url.toString());
    setActiveLayoutName(layoutName);
  }, []);

  return {
    savedLayouts,
    setSavedLayouts,
    activeLayoutName,
    setActiveLayoutName,
    isLoaded,
    handleSelectLayout
  };
}
