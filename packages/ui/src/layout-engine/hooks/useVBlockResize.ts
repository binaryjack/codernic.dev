import { useRef, useEffect } from 'react';
import { useLayoutEngine } from '../context';

export function useVBlockResize(id: string, ratios: number[], isHorizontal: boolean) {
  const { dispatch } = useLayoutEngine();
  const activeRatiosRef = useRef<number[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRatiosRef.current = [...ratios];
  }, [ratios]);

  const handleResize = (index: number, clientPos: number) => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const totalSize = isHorizontal ? rect.width : rect.height;
    if (totalSize === 0) return;
    
    // Calculate desired absolute position of the divider
    let desiredPos = isHorizontal ? clientPos - rect.left : clientPos - rect.top;
    
    // Clamp to minimum sizes (e.g. 50px)
    if (desiredPos < 50) desiredPos = 50;
    if (desiredPos > totalSize - 50) desiredPos = totalSize - 50;

    const desiredCumulativeRatio = desiredPos / totalSize;

    // Cumulative ratio before the active divider
    let cumulativeBefore = 0;
    for (let i = 0; i < index; i++) cumulativeBefore += activeRatiosRef.current[i];

    const currentCumulative = cumulativeBefore + activeRatiosRef.current[index];
    const difference = desiredCumulativeRatio - currentCumulative;
    
    const currentRatios = activeRatiosRef.current;
    if (currentRatios[index] + difference > 0.05 && currentRatios[index + 1] - difference > 0.05) {
       currentRatios[index] += difference;
       currentRatios[index + 1] -= difference;

       // Direct DOM manipulation to avoid React re-renders and fix frame rate issues
       const child1 = contentRef.current.children[index * 2] as HTMLElement;
       const child2 = contentRef.current.children[(index + 1) * 2] as HTMLElement;
       
       if (child1) child1.style.flex = `${currentRatios[index] * 100} ${currentRatios[index] * 100} 0%`;
       if (child2) child2.style.flex = `${currentRatios[index + 1] * 100} ${currentRatios[index + 1] * 100} 0%`;
    }
  };

  const handleResizeEnd = () => {
    if (activeRatiosRef.current.length > 0) {
      dispatch({ type: 'UPDATE_RATIOS', payload: { parentId: id, ratios: [...activeRatiosRef.current] } });
    }
  };

  return { contentRef, handleResize, handleResizeEnd };
}
