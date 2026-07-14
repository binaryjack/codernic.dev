import React from 'react';
import { useLayoutEngine } from '../context';
import { IconLayers, IconTrash, IconLock, IconLockOpen, IconMaximize, IconMinimize, IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight } from '../icons';
import { useVBlockContext } from './VBlockContext';
import { useTestId } from '../../hooks/useTestId';

interface WidgetHeaderProps {
  id: string;
  parentId?: string;
  title: string;
  isEditMode: boolean;
  locked: boolean;
  isExpanded: boolean;
  isMaximized: boolean;
  onToggleExpand: () => void;
  onToggleMaximize: () => void;
  onDragStart: (e: React.DragEvent) => void;
  sandboxMode: boolean;
  headerPortalRef?: React.RefObject<HTMLDivElement>;
}

export function WidgetHeader({
  id,
  parentId,
  title,
  isEditMode,
  locked,
  isExpanded,
  isMaximized,
  onToggleExpand,
  onToggleMaximize,
  onDragStart,
  sandboxMode,
  headerPortalRef
}: WidgetHeaderProps) {
  const { dispatch } = useLayoutEngine();
  const vblockCtx = useVBlockContext();
  const { rootId, getTestId } = useTestId('widget-header', id);

  return (
    <div className={`flex shrink-0 items-center justify-between px-2 py-1.5 border-b border-zinc-800/50 bg-[#111113]/90 backdrop-blur ${isMaximized ? 'z-[100]' : 'z-30'}`}>
      <div className="flex flex-1 items-center gap-2">
        <div id={`widget-header-actions-${id}`} ref={headerPortalRef} className="flex items-center gap-1 empty:hidden mr-1" />
        <div 
          {...(isEditMode && !locked ? { 
            draggable: true, 
            onDragStart: onDragStart,
            className: "flex items-center gap-1.5 flex-1 min-w-0 cursor-grab active:cursor-grabbing hover:bg-zinc-800/50 rounded px-1 -ml-1 transition-colors group"
          } : { className: "flex items-center gap-1.5 flex-1 min-w-0" })}
        >
          {isEditMode && !locked && (
            <IconLayers data-testid={getTestId('drag-icon')} size={12} className="text-zinc-600 group-hover:text-amber-500 shrink-0" />
          )}
          <span className={`text-[10px] uppercase font-bold tracking-widest truncate ${isEditMode ? 'text-zinc-500 group-hover:text-amber-500' : 'text-zinc-400'}`}>
            {title}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {vblockCtx.allowFullScreen && !isEditMode && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleMaximize(); }}
            className={`flex items-center justify-center p-1 rounded transition-colors ${isMaximized ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 hover:bg-amber-500/10 hover:text-amber-500'}`}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <IconMinimize data-testid={getTestId('icon-minimize')} size={12} /> : <IconMaximize data-testid={getTestId('icon-maximize')} size={12} />}
          </button>
        )}
        
        {vblockCtx.behavior !== 'none' && !isEditMode && !isMaximized && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="p-1 rounded text-zinc-500 hover:text-amber-500 hover:bg-zinc-800 transition-colors flex items-center justify-center"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {vblockCtx.behavior === 'accordion-top' && <IconChevronUp data-testid={getTestId('icon-chevron-up')} size={14} />}
            {vblockCtx.behavior === 'accordion-bottom' && <IconChevronDown data-testid={getTestId('icon-chevron-down')} size={14} />}
            {vblockCtx.behavior === 'panel-left' && <IconChevronLeft data-testid={getTestId('icon-chevron-left')} size={14} />}
            {vblockCtx.behavior === 'panel-right' && <IconChevronRight data-testid={getTestId('icon-chevron-right')} size={14} />}
          </button>
        )}
        {isEditMode && (
          <>
            <div className="w-px h-3 bg-zinc-800 mx-0.5" />
            <button 
              data-testid={getTestId('lock-btn')}
              onClick={() => dispatch({ type: 'UPDATE_BLOCK', payload: { id, updates: { locked: !locked } } })}
              className={`p-0.5 rounded transition-colors ${locked ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
              title={locked ? "Unlock" : "Lock"}
            >
              {locked ? <IconLock data-testid={getTestId('icon-lock')} size={12} /> : <IconLockOpen data-testid={getTestId('icon-lock-open')} size={12} />}
            </button>
            {!locked && parentId && (
              <button 
                data-testid={getTestId('remove-btn')}
                onClick={() => dispatch({ type: 'REMOVE_BLOCK', payload: { id, parentId } })}
                className="text-[10px] text-zinc-500 hover:text-red-500 flex items-center justify-center bg-zinc-800/50 hover:bg-red-500/10 p-0.5 rounded transition-colors ml-0.5"
                title="Remove Widget"
              >
                <IconTrash data-testid={getTestId('icon-trash')} size={10} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
