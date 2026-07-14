import { useLayoutEngine } from '../context';

export function useWidgetDragDrop(id: string, parentId?: string) {
  const { dispatch } = useLayoutEngine();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/codernic-widget-move', JSON.stringify({ id, parentId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('ring-2', 'ring-amber-500');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('ring-2', 'ring-amber-500');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('ring-2', 'ring-amber-500');
    
    const dragDataRaw = e.dataTransfer.getData('application/codernic-widget-move');
    if (dragDataRaw) {
      const dragData = JSON.parse(dragDataRaw);
      if (dragData.id !== id && dragData.parentId === parentId) {
        dispatch({ type: 'SWAP_BLOCKS', payload: { parentId, id1: dragData.id, id2: id } });
      }
    }
  };

  return { handleDragStart, handleDragEnter, handleDragOver, handleDragLeave, handleDrop };
}
