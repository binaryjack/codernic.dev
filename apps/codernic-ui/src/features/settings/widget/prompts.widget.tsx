import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectPrompts, selectJsonEditorSchemas } from '../../../entities/assets/model/assets-slice';
import { sendIntent } from '../../../shared/store/intent';
import { AgnosticJsonEditorWidget } from '../../../features/json-editor/components/agnostic-json-editor/AgnosticJsonEditorWidget';
import { useTestId } from '@ai-agencee/ui';

export function PromptsWidget({ dataTestId, id = 'prompts' }: { id?: string; dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('prompts-widget', dataTestId);
const dispatch = useDispatch();
  const promptsMap = useSelector(selectPrompts) || {};
  const prompts = Object.values(promptsMap).map((d: any) => ({
    id: d.id,
    name: d.name || d.id,
    content: typeof d.content === 'string' ? d.content : JSON.stringify(d, null, 2)
  }));
  
  const schemas = useSelector(selectJsonEditorSchemas);
  const schema = schemas?.['prompts'] || schemas?.['prompt'] || {};

  const onAssetDelete = (item: any) => dispatch({ type: 'assets/deleteAssetRequest', payload: { type: 'prompt', id: item.id } });
  
  const onAssetCreate = (name: string, scaffoldedData?: any) => {
    const targetId = name ? name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() : undefined;
    const newContent = scaffoldedData && Object.keys(scaffoldedData).length > 0 ? scaffoldedData : {};
    dispatch({ type: 'assets/createAssetRequest', payload: { type: 'prompt', id: targetId, scaffoldedData: newContent } });
    setTimeout(() => dispatch(sendIntent({ type: 'codernic:request-assets' }) as any), 800);
  };

  const onAssetSave = (itemId: string, content: any) => dispatch({ type: 'assets/saveAssetRequest', payload: { type: 'prompt', id: itemId, content: typeof content === 'string' ? content : JSON.stringify(content, null, 2) } });
  const onOpenInVSCode = (item: any) => dispatch({ type: 'assets/openAssetRequest', payload: { type: 'prompt', id: item.id } });

  return (
    <div data-testid={getTestId('root')} className="w-full h-full bg-[#09090b] overflow-hidden">
      <AgnosticJsonEditorWidget data-testid={getTestId('agnostic-json-editor-widget')}
        id={id}
        title="Prompt"
        items={prompts}
        schema={schema}
        onCreate={onAssetCreate}
        onDelete={onAssetDelete}
        onSave={onAssetSave}
        onOpenInVSCode={onOpenInVSCode}
      />
    </div>
  );
}
