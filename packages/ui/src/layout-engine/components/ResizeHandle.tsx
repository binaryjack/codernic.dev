import React, { useRef, useState, useEffect } from 'react';
import type { Orientation } from '../types';

interface ResizeHandleProps {
  orientation: Orientation;
  onResize: (clientPos: number) => void;
  onResizeEnd?: () => void;
}

export function ResizeHandle({ orientation, onResize, onResizeEnd }: ResizeHandleProps) {
  const isHorizontal = orientation === 'horizontal';
  const [isResizing, setIsResizing] = useState(false);

  const rafRef = useRef<number | null>(null);

  // Mouse move handler attached to document while resizing
  const handleMouseMove = (e: MouseEvent) => {
    if (rafRef.current !== null) return;
    
    rafRef.current = requestAnimationFrame(() => {
      const currentPos = isHorizontal ? e.clientX : e.clientY;
      onResize(currentPos);
      rafRef.current = null;
    });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (onResizeEnd) {
        onResizeEnd();
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Cleanup in case component unmounts while resizing
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);


  return (
    <div
      onMouseDown={handleMouseDown}
      className={`group z-20 flex items-center justify-center transition-colors ${
        isHorizontal ? 'w-2 h-full cursor-col-resize hover:bg-amber-500/20' : 'h-2 w-full cursor-row-resize hover:bg-amber-500/20'
      } ${isResizing ? 'bg-amber-500/10' : ''}`}
      style={{
        margin: isHorizontal ? '0 -4px' : '-4px 0',
      }}
    >
      <div className={`bg-zinc-800/80 group-hover:bg-amber-500 transition-colors ${isHorizontal ? 'w-[2px] h-12 rounded' : 'h-[2px] w-12 rounded'}`} />
    </div>
  );
}
