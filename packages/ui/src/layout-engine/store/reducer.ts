import type { BlockState, LayoutState, Orientation } from '../types';

export type LayoutAction =
  | { type: 'TOGGLE_EDIT_MODE' }
  | { type: 'ADD_BLOCK'; payload: { parentId: string; index?: number; block: BlockState } }
  | { type: 'REMOVE_BLOCK'; payload: { id: string; parentId: string } }
  | { type: 'UPDATE_RATIOS'; payload: { parentId: string; ratios: number[] } }
  | { type: 'TOGGLE_LOCK'; payload: string }
  | { type: 'SET_ORIENTATION'; payload: { id: string; orientation: Orientation } }
  | { type: 'SWAP_BLOCKS'; payload: { sourceId: string; targetId: string } }
  | { type: 'MOVE_BLOCK_TO_VBLOCK'; payload: { blockId: string; targetParentId: string } }
  | { type: 'SET_BEHAVIOR'; payload: { id: string; behavior: any } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; updates: Partial<BlockState> } }
  | { type: 'SET_LAYOUT'; payload: { blocks: Record<string, BlockState> } }
  | { type: 'RESET_LAYOUT' };

const deleteBlockRecursively = (blocks: Record<string, BlockState>, id: string) => {
  const block = blocks[id];
  if (!block) return;
  if (block.type === 'vblock' && block.childrenIds) {
    for (const childId of block.childrenIds) {
      deleteBlockRecursively(blocks, childId);
    }
  }
  delete blocks[id];
};

export const defaultInitialState: LayoutState = {
  isEditMode: true,
  rootId: 'root',
  blocks: {
    'root': {
      id: 'root',
      type: 'vblock',
      orientation: 'horizontal',
      childrenIds: [],
      ratios: [],
      locked: false,
    }
  }
};

export function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case 'TOGGLE_EDIT_MODE':
      return { ...state, isEditMode: !state.isEditMode };

    case 'SET_LAYOUT':
      return { ...state, blocks: action.payload.blocks };

    case 'RESET_LAYOUT':
      return { ...state, blocks: defaultInitialState.blocks };

    case 'ADD_BLOCK': {
      const { parentId, index, block } = action.payload;
      const parent = state.blocks[parentId];
      if (!parent || parent.type !== 'vblock') return state;

      const newBlocks = { ...state.blocks, [block.id]: { ...block, parentId } };
      const newParent = { ...parent, childrenIds: [...(parent.childrenIds || [])] };
      
      const targetIndex = index !== undefined ? index : newParent.childrenIds.length;
      newParent.childrenIds.splice(targetIndex, 0, block.id);

      const len = newParent.childrenIds.length;
      if (len > 0) newParent.ratios = Array(len).fill(1 / len);

      newBlocks[parentId] = newParent;
      return { ...state, blocks: newBlocks };
    }

    case 'REMOVE_BLOCK': {
      const { id, parentId } = action.payload;
      const parent = state.blocks[parentId];
      if (!parent || !parent.childrenIds) return state;

      const newParent = { ...parent, childrenIds: [...parent.childrenIds] };
      const idx = newParent.childrenIds.indexOf(id);
      if (idx === -1) return state;

      newParent.childrenIds.splice(idx, 1);
      const len = newParent.childrenIds.length;
      newParent.ratios = len > 0 ? Array(len).fill(1 / len) : [];

      const newBlocks = { ...state.blocks, [parentId]: newParent };
      
      // We must mutate a copy for recursive deletion
      const blocksCopy = { ...newBlocks };
      deleteBlockRecursively(blocksCopy, id);
      
      return { ...state, blocks: blocksCopy };
    }

    case 'UPDATE_RATIOS': {
      const { parentId, ratios } = action.payload;
      const parent = state.blocks[parentId];
      if (!parent) return state;
      return {
        ...state,
        blocks: { ...state.blocks, [parentId]: { ...parent, ratios } }
      };
    }

    case 'TOGGLE_LOCK': {
      const id = action.payload;
      const block = state.blocks[id];
      if (!block) return state;
      return {
        ...state,
        blocks: { ...state.blocks, [id]: { ...block, locked: !block.locked } }
      };
    }

    case 'SET_ORIENTATION': {
      const { id, orientation } = action.payload;
      const block = state.blocks[id];
      if (!block || block.type !== 'vblock') return state;
      return {
        ...state,
        blocks: { ...state.blocks, [id]: { ...block, orientation } }
      };
    }

    case 'SET_BEHAVIOR': {
      const { id, behavior } = action.payload;
      const block = state.blocks[id];
      if (!block || block.type !== 'vblock') return state;
      return {
        ...state,
        blocks: { ...state.blocks, [id]: { ...block, behavior } }
      };
    }

    case 'UPDATE_BLOCK': {
      const { id, updates } = action.payload;
      const block = state.blocks[id];
      if (!block) return state;
      return {
        ...state,
        blocks: { ...state.blocks, [id]: { ...block, ...updates } }
      };
    }

    case 'SWAP_BLOCKS': {
      const { sourceId, targetId } = action.payload;
      const source = state.blocks[sourceId];
      const target = state.blocks[targetId];
      if (!source || !target || !source.parentId || !target.parentId) return state;

      const sourceParentId = source.parentId;
      const targetParentId = target.parentId;
      const sourceParent = state.blocks[sourceParentId];
      const targetParent = state.blocks[targetParentId];

      if (!sourceParent?.childrenIds || !targetParent?.childrenIds) return state;

      const newBlocks = { ...state.blocks };
      
      const newSourceParent = { ...sourceParent, childrenIds: [...sourceParent.childrenIds] };
      const newTargetParent = sourceParentId === targetParentId ? newSourceParent : { ...targetParent, childrenIds: [...targetParent.childrenIds] };

      const sourceIdx = newSourceParent.childrenIds.indexOf(sourceId);
      const targetIdx = newTargetParent.childrenIds.indexOf(targetId);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        newSourceParent.childrenIds[sourceIdx] = targetId;
        newTargetParent.childrenIds[targetIdx] = sourceId;

        newBlocks[sourceId] = { ...source, parentId: targetParentId };
        newBlocks[targetId] = { ...target, parentId: sourceParentId };
        
        newBlocks[sourceParentId] = newSourceParent;
        if (sourceParentId !== targetParentId) {
          newBlocks[targetParentId] = newTargetParent;
        }
      }
      return { ...state, blocks: newBlocks };
    }

    case 'MOVE_BLOCK_TO_VBLOCK': {
      const { blockId, targetParentId } = action.payload;
      const block = state.blocks[blockId];
      const targetParent = state.blocks[targetParentId];
      if (!block || !block.parentId || !targetParent || targetParent.type !== 'vblock') return state;

      const sourceParentId = block.parentId;
      const sourceParent = state.blocks[sourceParentId];
      if (!sourceParent || !sourceParent.childrenIds) return state;

      const newBlocks = { ...state.blocks };
      
      const newSourceParent = { ...sourceParent, childrenIds: sourceParent.childrenIds.filter((id: string) => id !== blockId) };
      const sourceLen = newSourceParent.childrenIds.length;
      newSourceParent.ratios = sourceLen > 0 ? Array(sourceLen).fill(1 / sourceLen) : [];

      const newTargetParent = sourceParentId === targetParentId ? newSourceParent : { ...targetParent, childrenIds: [...(targetParent.childrenIds || [])] };
      if (sourceParentId !== targetParentId) {
        newTargetParent.childrenIds.push(blockId);
      }
      
      const targetLen = newTargetParent.childrenIds.length;
      newTargetParent.ratios = targetLen > 0 ? Array(targetLen).fill(1 / targetLen) : [];

      newBlocks[blockId] = { ...block, parentId: targetParentId };
      newBlocks[sourceParentId] = newSourceParent;
      newBlocks[targetParentId] = newTargetParent;

      return { ...state, blocks: newBlocks };
    }

    default:
      return state;
  }
}
