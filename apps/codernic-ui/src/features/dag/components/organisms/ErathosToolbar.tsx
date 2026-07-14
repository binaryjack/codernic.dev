import React from 'react';

import { IconZoomIn, IconZoomOut, IconMaximize } from '@ai-agencee/ui';

export function ErathosToolbar() {
  const handleZoomIn = () => {
    (window as any).__STRUCTURA_API__?.zoomIn?.();
  };

  const handleZoomOut = () => {
    (window as any).__STRUCTURA_API__?.zoomOut?.();
  };

  const handleFitToScreen = () => {
    (window as any).__STRUCTURA_API__?.fitToScreen?.();
  };

  return (
    <div className="flex items-center gap-1 bg-zinc-900/80 rounded-md border border-zinc-700/50 p-0.5">
      <button 
        onClick={handleZoomOut} 
        className="p-1 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded transition-colors"
        title="Zoom Out"
      >
        <IconZoomOut size={12} />
      </button>
      <button 
        onClick={handleZoomIn} 
        className="p-1 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded transition-colors"
        title="Zoom In"
      >
        <IconZoomIn size={12} />
      </button>
      <div className="w-px h-3 bg-zinc-700 mx-0.5" />
      <button 
        onClick={handleFitToScreen} 
        className="p-1 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-800 rounded transition-colors"
        title="Fit to Screen"
      >
        <IconMaximize size={12} />
      </button>
    </div>
  );
}
