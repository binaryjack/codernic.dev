import { useState, useCallback } from 'react';

export function useResizable(initialHeight: number, minHeight: number, maxHeight: number) {
  const [height, setHeight] = useState(initialHeight);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      setHeight((prev) => Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [height, minHeight, maxHeight]);

  return { height, handleMouseDown, setHeight };
}
