import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectDags, selectJsonEditorSchemas } from '../../../entities/assets/model/assets-slice';
import { sendIntent } from '../../../shared/store/intent';
import { AgnosticJsonEditorWidget } from '../../../features/json-editor/components/agnostic-json-editor/AgnosticJsonEditorWidget';

import { ErrorBoundary } from '../../../app/ErrorBoundary';
import { useTestId } from '@ai-agencee/ui';

export function DagsWidget({ dataTestId, id = 'dags' }: { id?: string; dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('dags-widget', dataTestId);
const dispatch = useDispatch();
  const dags = Object.values(useSelector(selectDags) || {}).map((d: any) => ({
    id: d.id,
    name: d.name || d.id,
    content: d
  }));
  const schemas = useSelector(selectJsonEditorSchemas);
  const schema = schemas?.['dags'] || schemas?.['dag'] || {};

  const onAssetDelete = (item: any) => dispatch({ type: 'assets/deleteAssetRequest', payload: { type: 'dag', id: item.id } });
  
  const onAssetCreate = (name: string, scaffoldedData?: any) => {
    const targetId = name ? name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() : undefined;
    const newContent = scaffoldedData && Object.keys(scaffoldedData).length > 0 ? scaffoldedData : {};
    dispatch({ type: 'assets/createAssetRequest', payload: { type: 'dag', id: targetId, scaffoldedData: newContent } });
    setTimeout(() => dispatch(sendIntent({ type: 'codernic:request-assets' }) as any), 800);
  };

  const onAssetSave = (id: string, content: any) => dispatch({ type: 'assets/saveAssetRequest', payload: { type: 'dag', id, content: JSON.stringify(content, null, 2) } });
  const onOpenInVSCode = (item: any) => dispatch({ type: 'assets/openAssetRequest', payload: { type: 'dag', id: item.id } });

  return (
    <ErrorBoundary>
      <div data-testid={getTestId('root')} className="w-full h-full bg-[#09090b] overflow-hidden">
        <AgnosticJsonEditorWidget data-testid={getTestId('agnostic-json-editor-widget')}
        id={id}
        title="DAG"
        items={dags}
        schema={schema}
        onCreate={onAssetCreate}
        onDelete={onAssetDelete}
        onSave={onAssetSave}
        onOpenInVSCode={onOpenInVSCode}
      />
      </div>
    </ErrorBoundary>
  );
}
