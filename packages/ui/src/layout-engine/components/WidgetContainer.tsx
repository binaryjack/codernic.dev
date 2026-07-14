import React, { useState } from 'react';
import { useLayoutEngine } from '../context';
import type { BlockState } from '../types';
import { IconAlertTriangle, IconSandbox } from '../icons';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WidgetHeader } from './WidgetHeader';
import { WidgetOfflineOverlay } from './WidgetOfflineOverlay';
import { useWidgetDragDrop } from '../hooks/useWidgetDragDrop';
import { useWidgetEphemeralSync } from '../hooks/useWidgetEphemeralSync';
import { useVBlockContext } from './VBlockContext';
import { useTestId } from '../../hooks/useTestId';

export function WidgetContainer({
  id,
  parentId,
  flexRatio,
  children,
  block
}: {
  id: string;
  parentId?: string;
  flexRatio?: number;
  children?: React.ReactNode;
  block?: BlockState;
}) {
  const { state, sandboxMode, actorStatuses, getRequiredActors } = useLayoutEngine();
  const currentBlock = block || state.blocks[id];
  const { rootId, getTestId } = useTestId('widget-container', (currentBlock as any)?.['data-testid']);
  
  const requiredActors = (getRequiredActors && currentBlock ? getRequiredActors(currentBlock.widgetType || '') : []) || [];
  const unavailableActors = requiredActors.filter(actor => (actorStatuses as any)?.[actor] !== 'online');
  
  if (!currentBlock) return null;

  const locked = !!currentBlock.locked;
  const title = currentBlock.widgetType || 'Widget';
  
  // Grab the parent VBlock context if any
  const vblockCtx = useVBlockContext();
  const hideFrame = vblockCtx.hideFrame;

  // Use the extracted drag and drop hook
  const { handleDragStart, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } = useWidgetDragDrop(id, parentId);

  // Sync with ephemeral states (like shortcut commands) and vblock context
  const isExpanded = vblockCtx.isExpanded ?? true;
  const isMaximized = vblockCtx.isFullscreenOpen ?? false;

  const ephemeralState = useWidgetEphemeralSync({ id, widgetType: currentBlock.widgetType, isExpanded, isMaximized, vblockCtx: vblockCtx.behavior !== 'none' ? vblockCtx as any : undefined });

  const toggleExpand = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (state.isEditMode) return;
    if (vblockCtx.toggleExpand) {
      vblockCtx.toggleExpand();
    }
  };
  
  const toggleMaximize = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (state.isEditMode) return;
    if (vblockCtx.toggleFullScreen) {
      vblockCtx.toggleFullScreen();
    }
  };

  const isActuallyMaximized = isMaximized;

  // We determine if this widget should be visually locked inside a sandbox mode
  const isWidgetSandboxed = !!sandboxMode;

  const contentNode = (
    <div 
      className={`flex flex-col relative overflow-hidden transition-all duration-300 w-full h-full min-h-0 ${
        hideFrame && !state.isEditMode 
          ? 'bg-transparent' 
          : 'bg-[#09090b] ' + (state.isEditMode ? 'ring-1 ring-zinc-800/50 m-0.5 rounded-lg' : 'rounded-lg border border-zinc-800/30')
      } ${
        !isActuallyMaximized && isExpanded ? 'absolute inset-0 z-40' : ''
      } ${
        isActuallyMaximized && !state.isEditMode ? 'z-[100]' : ''
      }`}
      style={!isExpanded && !isActuallyMaximized ? { flex: flexRatio ? `${flexRatio} ${flexRatio} 0%` : '1 1 0%', minWidth: 0, minHeight: 0 } : {}}
      onDragEnter={state.isEditMode ? handleDragEnter : undefined}
      onDragOver={state.isEditMode ? handleDragOver : undefined}
      onDragLeave={state.isEditMode ? handleDragLeave : undefined}
      onDrop={state.isEditMode ? handleDrop : undefined}
    >
      {(!hideFrame || state.isEditMode) && (
        <WidgetHeader 
          id={id}
          parentId={parentId}
          title={title}
          isEditMode={state.isEditMode}
          locked={locked}
          isExpanded={isExpanded}
          isMaximized={isActuallyMaximized}
          onToggleExpand={toggleExpand}
          onToggleMaximize={toggleMaximize}
          onDragStart={handleDragStart}
          sandboxMode={isWidgetSandboxed}
        />
      )}

      <div className={`flex-1 min-h-0 relative ${!isExpanded ? 'hidden' : ''}`}>
         {unavailableActors.length > 0 && !state.isEditMode && !sandboxMode && (
           <WidgetOfflineOverlay data-testid={getTestId('widget-offline-overlay')} title={title} unavailableActors={unavailableActors as any} />
         )}
         
         {ephemeralState?.isDisabled && !state.isEditMode && (
           <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-[1px] flex items-center justify-center cursor-not-allowed">
             <div className="px-3 py-1 bg-black/80 rounded border border-zinc-800 text-zinc-500 text-[10px] font-bold tracking-widest flex items-center gap-2">
               <IconLock data-testid={getTestId('icon-lock-1')} size={12} /> RESTRICTED
             </div>
           </div>
         )}
         {ephemeralState?.isObscured && !state.isEditMode && (
           <div className="absolute inset-0 z-30 bg-black/80 pointer-events-none transition-opacity duration-300"></div>
         )}
         {ephemeralState?.isBlurred && !state.isEditMode && (
           <div className="absolute inset-0 z-30 backdrop-blur-md bg-black/10 pointer-events-none transition-all duration-300"></div>
         )}

         <WidgetErrorBoundary fallback={(error) => (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/20 text-red-500 p-4 text-center">
              <IconAlertTriangle size={24} className="mb-2" />
              <div className="font-bold text-sm">Widget Crashed</div>
              <div className="text-xs mt-2 opacity-80 font-mono break-all line-clamp-3">{error.message}</div>
            </div>
         )}>
           <div className="w-full h-full relative" data-testid={rootId}>
             {children}
           </div>
         </WidgetErrorBoundary>
      </div>
    </div>
  );

  return contentNode;
}
