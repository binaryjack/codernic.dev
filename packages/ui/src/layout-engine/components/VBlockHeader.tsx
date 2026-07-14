import React from 'react';
import { 
  IconTrash,
  IconLock,
  IconLockOpen,
  IconMenu,
  IconLayers,
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconEye,
  IconEyeOff
} from '../icons';
import { useLayoutEngine } from '../context';
import { VBlockBehavior } from '../types';
import { useTestId } from '../../hooks/useTestId';

interface VBlockHeaderProps {
  id: string;
  isEditMode: boolean;
  orientation: 'horizontal' | 'vertical';
  behavior: VBlockBehavior;
  locked?: boolean;
  isHovered: boolean;
  hideFrame: boolean;
  allowFullScreen: boolean;
  parentId?: string;
  headerPortalRef: React.RefObject<HTMLDivElement>;
}

export function VBlockHeader({ 
  id, 
  isEditMode, 
  orientation, 
  behavior, 
  locked, 
  isHovered,
  hideFrame,
  allowFullScreen,
  parentId,
  headerPortalRef
}: VBlockHeaderProps) {
  const { dispatch } = useLayoutEngine();
  const { rootId, getTestId } = useTestId('vblock-header', id);

  const renderBehaviorIcon = (b: VBlockBehavior, Icon: any, title: string) => {
    const isActive = behavior === b;
    return (
      <button
        data-testid={getTestId('behavior', b)}
        onClick={() => dispatch({ type: 'UPDATE_BLOCK', payload: { id, updates: { behavior: isActive ? 'none' : b, hideFrame: false } } })}
        className={`p-0.5 rounded transition-colors ${isActive ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-amber-400'}`}
        title={title}
      >
        <Icon size={12} />
      </button>
    );
  };

  const toggleHideFrame = () => {
    if (!hideFrame) {
      dispatch({ type: 'UPDATE_BLOCK', payload: { id, updates: { hideFrame: true, behavior: 'none', allowFullScreen: false } } });
    } else {
      dispatch({ type: 'UPDATE_BLOCK', payload: { id, updates: { hideFrame: false } } });
    }
  };

  if (!isEditMode) return null;

  return (
    <div className="flex shrink-0 items-center justify-between px-2 py-1 bg-zinc-900/50 border-b border-zinc-800/50 z-30 opacity-100">
      <div className="flex items-center gap-2">
        <div ref={headerPortalRef} className="flex items-center gap-1 empty:hidden mr-1" />
        {parentId ? (
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/codernic-widget-move', JSON.stringify({ id, parentId }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-amber-500"
            title="Move VBlock"
          >
            <IconMenu size={12} />
          </div>
        ) : (
          <div className="w-3" />
        )}
        <IconLayers size={12} className={parentId ? "text-zinc-500" : "text-amber-500"} />
        <span className={`text-[10px] uppercase font-bold tracking-widest ${parentId ? "text-zinc-500" : "text-amber-500"}`}>
          {parentId ? "VBlock" : "Root VBlock"}
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 ml-auto mr-2 border-r border-zinc-800 pr-2">
         {parentId && (
           <>
             {!hideFrame && (
               <>
                 {renderBehaviorIcon('accordion-top', IconChevronDown, 'Top Accordion')}
                 {renderBehaviorIcon('accordion-bottom', IconChevronUp, 'Bottom Accordion')}
                 {renderBehaviorIcon('panel-left', IconChevronRight, 'Left Panel')}
                 {renderBehaviorIcon('panel-right', IconChevronLeft, 'Right Panel')}
                 <button
                   onClick={() => dispatch({ type: 'UPDATE_BLOCK', payload: { id, updates: { allowFullScreen: !allowFullScreen, hideFrame: false } } })}
                   className={`p-1 rounded transition-colors ${allowFullScreen ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                   title="Allow Full Screen Maximize"
                 >
                   <IconMaximize size={12} />
                 </button>
               </>
             )}
             <button
               onClick={toggleHideFrame}
               className={`p-1 rounded transition-colors ${hideFrame ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
               title={hideFrame ? "Show Frame" : "Hide Frame"}
             >
               {hideFrame ? <IconEyeOff size={12} /> : <IconEye size={12} />}
             </button>
           </>
         )}
       </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => dispatch({ type: 'SET_ORIENTATION', payload: { id, orientation: orientation === 'horizontal' ? 'vertical' : 'horizontal' } })} 
          className="text-zinc-500 hover:text-amber-500 flex items-center justify-center bg-zinc-800/50 p-1 rounded transition-colors"
          title={orientation === 'horizontal' ? "Switch to Vertical Stack" : "Switch to Horizontal Split"}
        >
          {orientation === 'horizontal' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <line x1="12" y1="5" x2="12" y2="19" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
        {parentId && (
          <button 
            onClick={() => dispatch({ type: 'REMOVE_BLOCK', payload: { id, parentId } })}
            className="text-[10px] text-zinc-500 hover:text-red-500 flex items-center justify-center bg-zinc-800/50 px-1 py-0.5 rounded"
            title="Remove VBlock"
          >
            <IconTrash size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
