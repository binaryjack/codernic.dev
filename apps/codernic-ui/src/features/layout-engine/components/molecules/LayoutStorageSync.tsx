import React, { useEffect } from 'react';
import { useLayoutEngine } from '@ai-agencee/ui/layout-engine';

export function LayoutStorageSync({ activeLayoutName }: { activeLayoutName: string | null }) {
  const { state } = useLayoutEngine();

  useEffect(() => {
    if (activeLayoutName && state.blocks) {
      localStorage.setItem(`codernic_layout_${activeLayoutName}`, JSON.stringify(state.blocks));
    }
  }, [state.blocks, activeLayoutName]);

  return null;
}
