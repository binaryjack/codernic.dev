import React, { useState, useRef } from 'react';
import { useLayoutEngine } from '../context';
import type { BlockState } from '../types';
import { ResizeHandle } from './ResizeHandle';
import { DockZone } from './DockZone';
import { WidgetContainer } from './WidgetContainer';
import { VBlockContext } from './VBlockContext';
import { createPortal } from 'react-dom';
import { IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight } from '../icons';

// Hooks and UI Components
import { useVBlockResize } from '../hooks/useVBlockResize';
import { useVBlockDragDrop } from '../hooks/useVBlockDragDrop';
import { VBlockHeader } from './VBlockHeader';
import { useTestId } from '../../hooks/useTestId';

export function VBlock({ dataTestId, id, parentId, flexRatio }: { id: string, parentId?: string, flexRatio?: number;  dataTestId?: string;
}) {
  const { rootId, getTestId } = useTestId('vblock', dataTestId);
  const { state, dispatch, sandboxMode } = useLayoutEngine();
  const block = state.blocks[id];
  const containerRef = useRef<HTMLDivElement>(null);
  const headerPortalRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!block || block.type !== 'vblock') return null;

  const childrenIds = block.childrenIds || [];
  const ratios = block.ratios || [];
  const orientation = block.orientation || 'horizontal';
  const isHorizontal = orientation === 'horizontal';
  const isEditMode = state.isEditMode;
  const behavior = block.behavior || 'none';
  const allowFullScreen = block.allowFullScreen || false;
  const hideFrame = block.hideFrame || false;

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const toggleFullScreen = () => setIsFullscreenOpen(!isFullscreenOpen);

  const getWidgetTitle = () => {
    for (const childId of childrenIds) {
      const b = state.blocks[childId];
      if (b && b.type === 'widget' && b.widgetType) return b.widgetType;
    }
    return 'VBLOCK';
  };

  const { contentRef, handleResize, handleResizeEnd } = useVBlockResize(id, ratios, isHorizontal);
  const { handleDrop, handleMove } = useVBlockDragDrop(id, childrenIds, state.blocks);

  const vblockContentNode = (
    <div ref={contentRef} className={`flex-1 flex ${isHorizontal ? 'flex-row' : 'flex-col'} overflow-hidden gap-1.5 ${isEditMode ? 'p-1.5' : ''}`}>
      {childrenIds.length === 0 && isEditMode ? (
          <DockZone onDropWidget={handleDrop} onMoveWidget={handleMove} />
      ) : (
        childrenIds.map((childId, index) => {
          const childRatio = ratios[index] || (1 / childrenIds.length);
          return (
            <React.Fragment key={childId}>
              <BlockRenderer data-testid={getTestId('block-renderer')} id={childId} parentId={id} flexRatio={childRatio * 100} />
              {index < childrenIds.length - 1 && (
                <ResizeHandle data-testid={getTestId('resize-handle')} orientation={orientation} onResize={(d) => handleResize(index, d)} onResizeEnd={handleResizeEnd} />
              )}
            </React.Fragment>
          );
        })
      )}
      
      {/* Trailing drop zone if space allows */}
      {childrenIds.length > 0 && childrenIds.length < 5 && isEditMode && (
          <div className={`shrink-0 transition-opacity ${isHorizontal ? 'w-10 h-full' : 'h-10 w-full'}`}>
            <DockZone onDropWidget={handleDrop} onMoveWidget={handleMove} />
          </div>
      )}
    </div>
  );

  const isPortalMode = isFullscreenOpen && !isEditMode;

  const vblockContent = (
    <VBlockContext.Provider value={{ 
      behavior, 
      allowFullScreen,
      hideFrame,
      isExpanded: isExpanded, 
      isFullscreenOpen: isFullscreenOpen,
      headerPortalRef,
      toggleExpand,
      toggleFullScreen,
      setExpanded: setIsExpanded
    }}>
      <div 
        ref={containerRef} 
        style={flexRatio !== undefined && !isPortalMode ? { flex: `${flexRatio} ${flexRatio} 0%`, minWidth: 0, minHeight: 0 } : undefined}
        onMouseOver={(e) => { if (isEditMode) { e.stopPropagation(); setIsHovered(true); } }}
        onMouseOut={(e) => { if (isEditMode) { setIsHovered(false); } }}
        className={`flex flex-col relative w-full h-full min-h-[50px] min-w-[50px] ${isEditMode ? 'bg-[#111113] transition-all rounded-xl border ' + (isHovered ? 'border-amber-500/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.05)]' : 'border-zinc-800/40') : ''} group/vblock ${!isExpanded && !isEditMode ? 'hidden' : ''} ${isPortalMode ? 'bg-[#09090b] z-[100]' : ''}`}
      >
        <VBlockHeader 
          id={id}
          isEditMode={isEditMode}
          orientation={orientation}
          behavior={behavior}
          locked={block.locked}
          isHovered={isHovered}
          hideFrame={hideFrame}
          allowFullScreen={allowFullScreen}
          parentId={parentId}
          headerPortalRef={headerPortalRef as any}
        />

        {/* VBlock Content Extracted */}
        {vblockContentNode}
      </div>
    </VBlockContext.Provider>
  );

  // If FullScreen is active, portal the entire VBlock content to the layout workspace
  // Removing sandboxMode check based on earlier conversation
  if (allowFullScreen && isFullscreenOpen && !isEditMode) {
    const portalRoot = document.getElementById('fullscreen-portal-root') || document.body;
    return createPortal(
      <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) { setIsFullscreenOpen(false); } }}>
        <div className="w-full h-full flex flex-col">
          {vblockContent}
        </div>
      </div>,
      portalRoot
    );
  }

  // If collapsed in a normal layout flow (not full screen), render just the trigger
  if (!isExpanded && !isEditMode) {
    const isVerticalPanel = behavior === 'panel-left' || behavior === 'panel-right';
    
    const parentBlock = parentId ? state.blocks[parentId] : null;
    const isParentHorizontal = parentBlock ? parentBlock.orientation === 'horizontal' : true; 
    
    let collapsedStyle: React.CSSProperties = {};

    if (isParentHorizontal) {
      if (isVerticalPanel) {
        collapsedStyle = { flexBasis: '24px', flexShrink: 0, flexGrow: 0, alignSelf: 'stretch' };
      } else {
        collapsedStyle = { flex: 'none', height: '24px', minHeight: '24px', maxHeight: '24px', alignSelf: behavior === 'accordion-top' ? 'flex-start' : 'flex-end' };
      }
    } else {
      if (!isVerticalPanel) {
        collapsedStyle = { flexBasis: '24px', flexShrink: 0, flexGrow: 0, alignSelf: 'stretch' };
      } else {
        collapsedStyle = { flex: 'none', width: '24px', minWidth: '24px', maxWidth: '24px', alignSelf: behavior === 'panel-left' ? 'flex-start' : 'flex-end' };
      }
    }

    // Force docking to the correct edge when collapsed
    let marginStyle: React.CSSProperties = {};
    if (behavior === 'panel-right') marginStyle = { marginLeft: 'auto' };
    if (behavior === 'panel-left') marginStyle = { marginRight: 'auto' };
    if (behavior === 'accordion-bottom') marginStyle = { marginTop: 'auto' };
    if (behavior === 'accordion-top') marginStyle = { marginBottom: 'auto' };

    collapsedStyle = { ...collapsedStyle, ...marginStyle };

    return (
      <div 
        className="flex items-center justify-center bg-zinc-900/50 border border-zinc-800/50 cursor-pointer hover:bg-amber-500/10 hover:text-amber-500 transition-colors relative overflow-hidden rounded-lg min-h-[24px] min-w-[24px]" 
        onClick={toggleExpand} 
        style={collapsedStyle}
      >
        <div className={`flex ${isVerticalPanel ? 'flex-col' : 'flex-row'} items-center justify-center gap-2 whitespace-nowrap text-[10px] font-bold tracking-widest uppercase w-full h-full`}>
          {isVerticalPanel ? (
            <>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{getWidgetTitle()}</span>
              <div className="flex items-center justify-center">
                {behavior === 'panel-left' && <IconChevronRight data-testid={getTestId('icon-chevron-right')} size={14} />}
                {behavior === 'panel-right' && <IconChevronLeft data-testid={getTestId('icon-chevron-left')} size={14} />}
              </div>
            </>
          ) : (
            <>
              {behavior === 'accordion-top' && <IconChevronDown data-testid={getTestId('icon-chevron-down')} size={14} />}
              {behavior === 'accordion-bottom' && <IconChevronUp data-testid={getTestId('icon-chevron-up')} size={14} />}
              <span>{getWidgetTitle()}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return vblockContent;
}

function BlockRenderer({ dataTestId, id, parentId, flexRatio }: { id: string, parentId: string, flexRatio?: number;  dataTestId?: string;
}) {
  const { rootId, getTestId } = useTestId('block-renderer', dataTestId);
  const { state, renderWidget } = useLayoutEngine();
  const block = state.blocks[id];
  if (!block) return null;

  if (block.type === 'vblock') {
    return <VBlock data-testid={getTestId('vblock')} id={id} parentId={parentId} flexRatio={flexRatio} />;
  }

  return (
    <WidgetContainer data-testid={getTestId('widget-container')} id={id} parentId={parentId} flexRatio={flexRatio}>
      {renderWidget ? renderWidget(block) : <div className="p-4 text-zinc-500">Widget: {block.widgetType}</div>}
    </WidgetContainer>
  );
}
