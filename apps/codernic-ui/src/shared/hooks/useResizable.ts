import { useState, useEffect, useCallback } from 'react';

export interface IUseResizableProps {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  direction: 'left' | 'right';
}

export interface IUseResizableReturn {
  width: number;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  resetWidth: () => void;
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
  direction,
}: IUseResizableProps): IUseResizableReturn {
  const [width, setWidth] = useState<number>(initialWidth);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const resetWidth = useCallback(() => {
    setWidth(initialWidth);
  }, [initialWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const targetWidth = direction === 'left' 
        ? e.clientX 
        : window.innerWidth - e.clientX;

      if (targetWidth >= minWidth && targetWidth <= maxWidth) {
        setWidth(targetWidth);
      } else if (targetWidth < minWidth) {
        setWidth(minWidth);
      } else if (targetWidth > maxWidth) {
        setWidth(maxWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, width, minWidth, maxWidth, direction]);

  return { width, isDragging, onMouseDown, resetWidth };
}
