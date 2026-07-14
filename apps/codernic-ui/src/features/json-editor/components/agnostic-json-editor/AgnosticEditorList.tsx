import React from 'react';
import { Button } from '@ai-agencee/ui';
import { IconEdit, IconTrash, IconPlus } from '@ai-agencee/ui';
import type { AgnosticItem } from './AgnosticJsonEditorWidget';
import { useTestId } from '@ai-agencee/ui';

export interface AgnosticEditorListProps {
  title: string;
  items: AgnosticItem[];
  filteredItems: AgnosticItem[];
  selectedItem: AgnosticItem | null;
  isSplitView: boolean;
  handleSelectItem: (item: AgnosticItem) => void;
  onDelete: (item: AgnosticItem) => void;
  onCreate?: () => void;
  dataTestId?: string;
}

export function AgnosticEditorList({ dataTestId,
  title,
  items,
  filteredItems,
  selectedItem,
  isSplitView,
  handleSelectItem,
  onDelete,
  onCreate
}: AgnosticEditorListProps) {
  
  const { rootId, getTestId } = useTestId('agnostic-editor-list', dataTestId);
return (
    <div data-testid={rootId} className={`flex flex-col h-full bg-zinc-950 ${isSplitView ? 'w-1/3 min-w-[250px] max-w-[350px] border-r border-zinc-800' : 'w-full'}`}>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 h-full text-zinc-500 bg-zinc-900/50 rounded border border-dashed border-zinc-800 m-2">
            <p className="text-sm text-center mb-4">
              {items.length === 0 ? `No ${title} configured yet.` : 'No items match your search.'}
            </p>
            {items.length === 0 && onCreate && (
              <Button data-testid={getTestId('button')} variant="primary" onClick={onCreate} className="w-full justify-center">
                <IconPlus data-testid={getTestId('icon-plus')} size={14} className="mr-2" />
                Create First {title}
              </Button>
            )}
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group border ${selectedItem?.id === item.id ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'border-transparent hover:bg-zinc-800/80 text-zinc-300'}`}
            >
                <span className="text-sm truncate mr-2">{item.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleSelectItem(item); }}
                    className="text-zinc-400 hover:text-blue-400"
                    title="Edit"
                    data-testid={`edit-item-${item.id}`}
                  >
                    <IconEdit data-testid={`${typeof rootId !== 'undefined' ? rootId : 'filtered-items-item'}-icon-edit`} size={12} />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                    className="text-zinc-400 hover:text-red-400"
                    title="Delete"
                    data-testid={`delete-item-${item.id}`}
                  >
                    <IconTrash data-testid={`${typeof rootId !== 'undefined' ? rootId : 'filtered-items-item'}-icon-trash`} size={12} />
                  </Button>
                </div>
              </div>
          ))
        )}
      </div>
    </div>
  );
}
