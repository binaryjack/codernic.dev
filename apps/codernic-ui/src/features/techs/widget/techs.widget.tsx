import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectTechs, selectJsonEditorSchemas } from '../../../entities/assets/model/assets-slice';
import { sendIntent } from '../../../shared/store/intent';
import { AgnosticJsonEditorWidget } from '../../../features/json-editor/components/agnostic-json-editor/AgnosticJsonEditorWidget';
import { useTestId } from '@ai-agencee/ui';

export function TechsWidget({ dataTestId, id = 'techs' }: { id?: string; dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('techs-widget', dataTestId);
const dispatch = useDispatch();
  const techs = Object.values(useSelector(selectTechs) || {}).map((d: any) => ({
    id: d.id,
    name: d.name || d.id,
    content: d
  }));
  const schemas = useSelector(selectJsonEditorSchemas);
  const schema = schemas?.['techs'] || schemas?.['technology'] || {};

  const onAssetDelete = (item: any) => dispatch({ type: 'assets/deleteAssetRequest', payload: { type: 'technology', id: item.id } });
  
  const onAssetCreate = (name: string, scaffoldedData?: any) => {
    const targetId = name ? name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() : undefined;
    const newContent = scaffoldedData && Object.keys(scaffoldedData).length > 0 ? scaffoldedData : {};
    dispatch({ type: 'assets/createAssetRequest', payload: { type: 'technology', id: targetId, scaffoldedData: newContent } });
    setTimeout(() => dispatch(sendIntent({ type: 'codernic:request-assets' }) as any), 800);
  };

  const onAssetSave = (id: string, content: any) => dispatch({ type: 'assets/saveAssetRequest', payload: { type: 'technology', id, content: JSON.stringify(content, null, 2) } });
  const onOpenInVSCode = (item: any) => dispatch({ type: 'assets/openAssetRequest', payload: { type: 'technology', id: item.id } });

  return (
    <div data-testid={getTestId('root')} className="w-full h-full bg-[#09090b] overflow-hidden">
      <AgnosticJsonEditorWidget data-testid={getTestId('agnostic-json-editor-widget')}
      id={id}
      title="Technology"
      items={techs}
      schema={schema}
      onCreate={onAssetCreate}
      onDelete={onAssetDelete}
      onSave={onAssetSave}
      onOpenInVSCode={onOpenInVSCode}
    />
    </div>
  );
}
