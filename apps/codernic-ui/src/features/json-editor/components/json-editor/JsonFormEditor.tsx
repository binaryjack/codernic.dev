import React from 'react';
import { IconTrash, IconPlus } from '@ai-agencee/ui';
import type { JsonEditorSchema } from './types';
import { BaseInput, FormField, SelectDropdown, Button } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export interface JsonFormEditorProps {
  value: any;
  onChange: (newValue: any) => void;
  schema?: JsonEditorSchema;
}



function StringInput({ dataTestId, value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string; dataTestId?: string;
}) {
  
  const { rootId, getTestId } = useTestId('string-input', dataTestId);
return (
    <BaseInput data-testid={getTestId('base-input')}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function NumberInput({ dataTestId, value, onChange }: { value: number; onChange: (v: number) => void; dataTestId?: string;
}) {
  
  const { rootId, getTestId } = useTestId('number-input', dataTestId);
return (
    <BaseInput data-testid={getTestId('base-input')}
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function BooleanSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-amber-500' : 'bg-[#27272a]'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

function DropdownInput({ dataTestId, value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[]; dataTestId?: string;
}) {
  
  const { rootId, getTestId } = useTestId('dropdown-input', dataTestId);
return (
    <SelectDropdown data-testid={getTestId('select-dropdown')}
      value={value}
      onChange={onChange}
      options={options.map(opt => ({ value: opt, label: opt }))}
      width="w-full"
    />
  );
}

export function JsonFormEditor({ value, onChange, schema = {} }: JsonFormEditorProps) {
  if (typeof value !== 'object' || value === null) {
    return <div className="text-red-400 text-xs">Root value must be an object.</div>;
  }

  const renderField = (key: string, val: any, fieldSchema: any, path: string[]) => {
    
  const rootId = key['data-testid'] ? `${key['data-testid']}-render-field` : 'render-field';
const handleChange = (newVal: any) => {
      // Create a deep copy of the original value to avoid mutating state directly
      const newValue = JSON.parse(JSON.stringify(value));
      let current = newValue;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = newVal;
      onChange(newValue);
    };

    const label = key;
    const description = fieldSchema?.description;

    if (fieldSchema?.type === 'DropDown' && fieldSchema.options) {
      return (
        <FormField data-testid={getTestId('form-field')} key={key} label={label} description={description}>
          <DropdownInput data-testid={getTestId('dropdown-input')} value={val as string} onChange={handleChange} options={fieldSchema.options} />
        </FormField>
      );
    }

    if (typeof val === 'string') {
      return (
        <FormField data-testid={getTestId('form-field-1')} key={key} label={label} description={description}>
          <StringInput data-testid={getTestId('string-input')} value={val} onChange={handleChange} />
        </FormField>
      );
    }

    if (typeof val === 'number') {
      return (
        <FormField data-testid={getTestId('form-field-2')} key={key} label={label} description={description}>
          <NumberInput data-testid={getTestId('number-input')} value={val} onChange={handleChange} />
        </FormField>
      );
    }

    if (typeof val === 'boolean') {
      return (
        <FormField data-testid={getTestId('form-field-3')} key={key} label={label} description={description}>
          <BooleanSwitch data-testid={getTestId('boolean-switch')} value={val} onChange={handleChange} />
        </FormField>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div key={key} className="mb-6">
          <label className="text-xs font-semibold text-[#f1f5f9] tracking-wide uppercase mb-2 block">{label}</label>
          <div className="bg-[#111111] border border-[#27272a] rounded p-3 flex flex-col gap-2">
            {val.length === 0 ? (
              <div className="text-xs text-[#a1a1aa] italic">Empty array</div>
            ) : (
              val.map((item, idx) => (
                <div key={idx} className="bg-[#18181b] border border-[#27272a] rounded p-2 text-sm flex justify-between items-center">
                   {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                   <Button data-testid={`${typeof rootId !== 'undefined' ? rootId : 'val-item'}-button`} 
                     variant="ghost"
                     size="icon"
                     onClick={() => {
                        const newArr = [...val];
                        newArr.splice(idx, 1);
                        handleChange(newArr);
                     }}
                     className="text-red-400 hover:text-red-300 ml-2"
                     title="Remove Item"
                   ><IconTrash data-testid={`${typeof rootId !== 'undefined' ? rootId : 'val-item'}-icon-trash`} size={12}/></Button>
                </div>
              ))
            )}
            {/* Simple add button for array of strings currently, complex arrays need more logic */}
            {(!fieldSchema?.items || fieldSchema.items.type === 'string') && (
              <Button data-testid={getTestId('button')} 
                variant="ghost"
                size="icon"
                onClick={() => handleChange([...val, 'new-item'])}
                className="text-amber-500 hover:text-amber-400 self-start mt-2"
                title="Add Item"
              >
                <IconPlus data-testid={getTestId('icon-plus')} size={14} />
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (typeof val === 'object' && val !== null) {
      return (
        <div key={key} className="mb-6 bg-[#09090b] border border-[#27272a] rounded overflow-hidden">
          <div className="bg-[#111111] border-b border-[#27272a] p-3 text-xs font-semibold text-amber-500 tracking-wide uppercase">
            {label}
          </div>
          <div className="p-4">
            {Object.entries(val).map(([subK, subV]) => 
              renderField(subK, subV, schema?.[key]?.[subK] || {}, [...path, subK])
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col w-full max-w-3xl">
      {Object.entries(value).map(([k, v]) => renderField(k, v, schema[k], [k]))}
    </div>
  );
}
