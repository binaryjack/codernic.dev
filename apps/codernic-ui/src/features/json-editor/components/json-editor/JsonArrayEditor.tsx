import { JsonObjectEditor } from './JsonObjectEditor';
import { IconTrash, IconPlus } from '@ai-agencee/ui';
import type { JsonEditorProps } from './types';
import { useTestId } from '@ai-agencee/ui';

export function JsonArrayEditor({ dataTestId, value, onChange, path = [], schema = {}, parentValue, rootValue, isSplitView }: JsonEditorProps) {
  
  const { rootId, getTestId } = useTestId('json-array-editor', dataTestId);
return (
    <div className="flex flex-col space-y-1 border-l border-zinc-800 pl-2 mt-1 w-full">
      {value.map((item: any, idx: number) => (
        <div key={idx} className="flex flex-col space-y-0.5 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono">[{idx}]</span>
            <button 
              onClick={() => {
                const newArr = [...value];
                newArr.splice(idx, 1);
                onChange(newArr);
              }}
              className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/10 transition-colors"
              title="Remove Item"
            >
              <IconTrash data-testid={`${typeof rootId !== 'undefined' ? rootId : 'value-item'}-icon-trash`} size={12} />
            </button>
          </div>
          <JsonObjectEditor data-testid={`${typeof rootId !== 'undefined' ? rootId : 'value-item'}-json-object-editor`} 
            value={item} 
            onChange={(newItem) => {
              const newArr = [...value];
              newArr[idx] = newItem;
              onChange(newArr);
            }} 
            path={[...path, String(idx)]} 
            schema={schema.items?.properties || {}}
            parentValue={parentValue}
            rootValue={rootValue}
            isSplitView={isSplitView}
          />
        </div>
      ))}
      <button 
        onClick={() => {
          let newItem: any = {};
          if (schema.items?.type === 'string') newItem = '';
          else if (schema.items?.type === 'number') newItem = 0;
          else if (schema.items?.type === 'boolean') newItem = false;
          else if (schema.items?.type === 'array') newItem = [];
          else if (value.length > 0 && typeof value[0] === 'string') newItem = '';
          onChange([...value, newItem]);
        }}
        className="self-start flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 px-1.5 py-0.5 rounded hover:bg-blue-500/10 transition-colors mt-1"
        title="Add Item"
      >
        <IconPlus data-testid={getTestId('icon-plus')} size={12} /> Add Item
      </button>
    </div>
  );
}
