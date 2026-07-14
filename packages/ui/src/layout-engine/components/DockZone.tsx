import React, { useState } from 'react';
import { IconPlus } from '../icons';
import { useTestId } from '../../hooks/useTestId';

interface DockZoneProps {
  onDropWidget: (type: string) => void;
  onMoveWidget?: (sourceId: string) => void;
  dataTestId?: string;
}

export function DockZone({ dataTestId, onDropWidget, onMoveWidget }: DockZoneProps) {
  
  const { rootId, getTestId } = useTestId('dock-zone', dataTestId);
const [isOver, setIsOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOver) setIsOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    const type = e.dataTransfer.getData('application/codernic-widget');
    if (type) {
      onDropWidget(type);
      return;
    }

    const moveData = e.dataTransfer.getData('application/codernic-widget-move');
    if (moveData && onMoveWidget) {
      try {
        const source = JSON.parse(moveData);
        if (source.id) {
          onMoveWidget(source.id);
        }
      } catch (err) {}
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-full min-h-[100px] rounded-xl flex items-center justify-center border-2 border-dashed transition-all duration-200 ${
        isOver ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isOver ? 'bg-amber-500 text-zinc-900 scale-110' : 'bg-zinc-800 text-zinc-500'}`}>
        <IconPlus data-testid={getTestId('icon-plus')} size={20} />
      </div>
    </div>
  );
}
