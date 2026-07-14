import React from 'react';
import { createPortal } from 'react-dom';

export function FullScreenPortalOverlay({ children }: { children: React.ReactNode }) {
  const portalRoot = document.getElementById('fullscreen-portal-root') || document.body;

  return createPortal(
    <div 
      className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {children}
    </div>,
    portalRoot
  );
}
