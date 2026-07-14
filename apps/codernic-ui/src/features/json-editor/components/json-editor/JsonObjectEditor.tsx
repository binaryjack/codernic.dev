import { JsonPrimitiveEditor } from './JsonPrimitiveEditor';
import { AgnosticDropdown } from '@ai-agencee/ui';
import { useSelector } from 'react-redux';
import { vscode } from '../../../../shared/api/vscode-api';
import { JsonArrayEditor } from './JsonArrayEditor';
import type { JsonEditorProps } from './types';
import { useTestId } from '@ai-agencee/ui';

export function JsonObjectEditor({ dataTestId, value, onChange, path = [], schema = {}, parentValue, rootValue, isSplitView }: JsonEditorProps) {
  
  const { rootId, getTestId } = useTestId('json-object-editor', dataTestId);
  const assets = useSelector((state: any) => state.assets);
  const metadataSources = useSelector((state: any) => state.assets?.metadataSources || {});

if (typeof value !== 'object' || value === null) {
    return <JsonPrimitiveEditor data-testid={getTestId('json-primitive-editor')} value={value} onChange={onChange} rootValue={rootValue} />;
  }

  if (Array.isArray(value)) {
    return <JsonArrayEditor data-testid={getTestId('json-array-editor')} value={value} onChange={onChange} path={path} schema={schema} parentValue={parentValue} rootValue={rootValue} isSplitView={isSplitView} />;
  }

  const allKeys = Array.from(new Set([
    ...Object.keys(value || {}),
    ...Object.keys(schema || {})
  ])).filter(k => k !== '$schema');

  // Sort keys: primitives first, then arrays/objects. Alphabetical fallback.
  allKeys.sort((a, b) => {
    const vA = value?.[a];
    const sA = schema?.[a] || {};
    const isArrayA = Array.isArray(vA) || sA.type === 'array' || sA.type === 'Array';
    const isObjA = (!isArrayA && typeof vA === 'object' && vA !== null) || sA.type === 'object' || sA.type === 'Object';
    const isCollectionA = isArrayA || isObjA;

    const vB = value?.[b];
    const sB = schema?.[b] || {};
    const isArrayB = Array.isArray(vB) || sB.type === 'array' || sB.type === 'Array';
    const isObjB = (!isArrayB && typeof vB === 'object' && vB !== null) || sB.type === 'object' || sB.type === 'Object';
    const isCollectionB = isArrayB || isObjB;

    if (isCollectionA && !isCollectionB) return 1;
    if (!isCollectionA && isCollectionB) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col space-y-1 w-full">
      {allKeys.map((k) => {
        const v = value[k];
        const fieldSchema = schema[k] || {};
        
        // Determine type from value or schema
        const isArray = Array.isArray(v) || fieldSchema.type === 'array' || fieldSchema.type === 'Array';
        const isObj = (!isArray && typeof v === 'object' && v !== null) || fieldSchema.type === 'object' || fieldSchema.type === 'Object';
        
        const handleChange = (newVal: any) => {
          onChange({ ...value, [k]: newVal });
        };

        // Fallback value for nested components if missing
        const childValue = v !== undefined ? v : (isArray ? [] : (isObj ? {} : undefined));

        return (
          <div key={k} className="flex flex-col space-y-0.5 mt-1 w-full">
            {isObj || isArray ? (
              <div className="flex flex-col w-full">
                <span className="text-[10px] text-amber-500/80 font-semibold uppercase tracking-wider mb-1">{k}</span>
                <div className="pl-2 border-l border-zinc-800 ml-1 w-full">
                  {isArray ? (
                    <JsonArrayEditor data-testid={getTestId('json-array-editor')} value={childValue} onChange={handleChange} path={[...path, k]} schema={fieldSchema} parentValue={value} rootValue={rootValue} isSplitView={isSplitView} />
                  ) : (
                    <JsonObjectEditor data-testid={getTestId('json-object-editor')} value={childValue} onChange={handleChange} path={[...path, k]} schema={fieldSchema.properties || {}} parentValue={value} rootValue={rootValue} isSplitView={isSplitView} />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <span className="text-[10px] text-zinc-400 font-mono w-[60px] @md/form:w-[200px] @xl/form:w-[250px] shrink-0 truncate" title={k}>{k}</span>
                <div className="flex-1 min-w-0">
                  {fieldSchema?.type === 'DropDown' ? (
                    <AgnosticDropdown data-testid={getTestId('json-dropdown-editor')} 
                      value={childValue} 
                      onChange={handleChange} 
                      fieldSchema={fieldSchema} 
                      parentValue={value} 
                      placeholder={`Select ${k}...`} 
                      assets={assets}
                      metadataSources={metadataSources}
                      onRequestAsset={(type, id) => {
                        vscode.postMessage({ 
                          type: 'codernic:get-asset', 
                          payload: { type, id, isMetadata: true } 
                        });
                      }}
                    />
                  ) : (
                    <JsonPrimitiveEditor data-testid={getTestId('json-primitive-editor')} value={childValue} onChange={handleChange} isSplitView={isSplitView} fieldName={k} fieldSchema={fieldSchema} rootValue={rootValue} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
