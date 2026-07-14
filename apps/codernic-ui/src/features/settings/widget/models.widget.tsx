import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgnosticJsonEditorWidget, type AgnosticItem } from '../../../features/json-editor/components/agnostic-json-editor/AgnosticJsonEditorWidget';
import { getOllamaUrl } from '../../../shared/config';
import { selectJsonEditorSchemas, selectLlmProviders } from '../../../entities/assets/model/assets-slice';
import { useTestId } from '@ai-agencee/ui';

export function ModelsWidget({ dataTestId, id }: { id?: string; dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('models-widget', dataTestId);
const dispatch = useDispatch();
  const providersDict = useSelector(selectLlmProviders);
  const items: AgnosticItem[] = Object.values(providersDict);
  
  const schemas = useSelector(selectJsonEditorSchemas);
  const schema = schemas?.['config/llms/providers'] || {};

  useEffect(() => {
    dispatch({ type: 'assets/fetchLlmProvidersRequest' });
  }, [dispatch]);

  const handleSave = (itemId: string, newContent: any) => {
    const assetId = `${itemId}.provider`;
    dispatch({
      type: 'assets/saveAssetRequest',
      payload: {
        type: 'config/llms',
        id: assetId,
        content: JSON.stringify(newContent, null, 2)
      }
    });
    // Trigger config reload after save completes
    setTimeout(() => dispatch({ type: 'assets/fetchLlmProvidersRequest' }), 800);
  };

  const handleCreate = (name: string, scaffoldedData?: any) => {
    dispatch({ type: 'assets/createAssetRequest', payload: { type: 'config/llms', title: 'Provider', id: name || undefined, scaffoldedData } });
    setTimeout(() => dispatch({ type: 'assets/fetchLlmProvidersRequest' }), 800);
  };

  const handleDelete = (item: AgnosticItem) => {
    dispatch({
      type: 'assets/deleteAssetRequest',
      payload: { type: 'config/llms', id: `${item.id}.provider` }
    });
    setTimeout(() => dispatch({ type: 'assets/fetchLlmProvidersRequest' }), 800);
  };

  const handleOpenVSCode = (item: AgnosticItem) => {
    dispatch({
      type: 'assets/openAssetRequest',
      payload: { type: 'config/llms', id: `${item.id}.provider` }
    });
  };

  return (
    <div data-testid={getTestId('root')} className="h-full w-full">
      <AgnosticJsonEditorWidget data-testid={getTestId('agnostic-json-editor-widget')}
        id={id!}
        title="Provider"
        items={items}
        schema={schema}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onSave={handleSave}
        onOpenInVSCode={handleOpenVSCode}
      />
    </div>
  );
}
