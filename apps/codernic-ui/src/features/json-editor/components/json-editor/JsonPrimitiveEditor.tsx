import type { JsonEditorProps } from './types';
import { BaseInput, Button } from '@ai-agencee/ui';
import { AgnosticDropdown } from '@ai-agencee/ui';
import { useSelector } from 'react-redux';
import { useTestId } from '@ai-agencee/ui';

export function JsonPrimitiveEditor({ dataTestId, value, onChange, isSplitView, fieldName, fieldSchema, rootValue }: JsonEditorProps) {
  
  const { rootId, getTestId } = useTestId('json-primitive-editor', dataTestId);
  const assets = useSelector((state: any) => state.assets);
  const metadataSources = useSelector((state: any) => state.assets?.metadataSources || {});

  if (fieldSchema?.options?.source) {
    return (
      <AgnosticDropdown
        value={value} 
        onChange={onChange} 
        sources={fieldSchema.options.source} 
        rootValue={rootValue} 
        assets={assets}
        metadataSources={metadataSources}
      />
    );
  }

  if (typeof value === 'boolean') {
    return <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />;
  }
  
  if (typeof value === 'number') {
    return (
      <BaseInput data-testid={getTestId('base-input')} 
        type="number" 
        value={value} 
        onChange={e => onChange(Number(e.target.value))}
        className="h-6 w-full"
      />
    );
  }

  if (typeof value === 'string' && value.startsWith('vault://')) {
    return (
      <div className="flex gap-2 items-center w-full">
        <BaseInput data-testid={getTestId('base-input-1')} 
          type="text" 
          value="******** (Vault Secret)" 
          disabled 
          className="h-6 opacity-50 cursor-not-allowed"
        />
        <Button data-testid={getTestId('button')} 
          variant="secondary"
          size="sm"
          onClick={() => onChange('')}
        >
          Edit
        </Button>
      </div>
    );
  }

  if (typeof value === 'string') {
    const isMultiLine = fieldSchema?.['ui:widget'] === 'textarea' || fieldSchema?.format === 'textarea' || (fieldName && ['description', 'systemContext', 'prompt', 'instructions', 'content', 'rule', 'do', 'doNot'].includes(fieldName));
    
    if (isMultiLine && !isSplitView) {
      return (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full min-h-[120px] p-2 bg-zinc-950/50 border border-zinc-700/50 rounded text-xs text-zinc-300 font-mono focus:border-amber-500/50 focus:outline-none resize-y"
        />
      );
    }
  }

  return (
    <BaseInput data-testid={getTestId('base-input-2')} 
      type="text" 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      className="h-6 w-full"
    />
  );
}
