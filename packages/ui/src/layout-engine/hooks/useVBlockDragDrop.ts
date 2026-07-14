import { useLayoutEngine } from '../context';
import { BlockState } from '../types';

export function useVBlockDragDrop(id: string, childrenIds: string[], stateBlocks: Record<string, BlockState>) {
  const { dispatch } = useLayoutEngine();

  const handleDrop = (type: string) => {
    if (childrenIds.length >= 5) return; // MAX 5
    
    if (type !== 'vblock') {
      const existingEntry = Object.entries(stateBlocks).find(([_, b]) => b.type === 'widget' && b.widgetType === type);
      if (existingEntry) {
        dispatch({ type: 'MOVE_BLOCK_TO_VBLOCK', payload: { blockId: existingEntry[0], targetParentId: id } });
        return;
      }
    }

    const newId = `block-${Date.now()}`;
    const newBlock: BlockState = type === 'vblock' 
      ? { id: newId, type: 'vblock', orientation: 'vertical', childrenIds: [], ratios: [], locked: false }
      : { id: newId, type: 'widget', widgetType: type, locked: false };
    
    dispatch({ type: 'ADD_BLOCK', payload: { parentId: id, block: newBlock } });
  };

  const handleMove = (sourceId: string) => {
    if (childrenIds.length >= 5) return;
    dispatch({ type: 'MOVE_BLOCK_TO_VBLOCK', payload: { blockId: sourceId, targetParentId: id } });
  };

  return { handleDrop, handleMove };
}
