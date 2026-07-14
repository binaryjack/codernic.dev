import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgnosticJsonEditorWidget, type AgnosticItem } from '../../../features/json-editor/components/agnostic-json-editor/AgnosticJsonEditorWidget';
import { selectJsonEditorSchemas, selectLlmRoutes, selectLlmProviders } from '../../../entities/assets/model/assets-slice';
import { AgnosticSourceDropdown, type AgnosticSourceItem } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export function RoutingWidget({ dataTestId, id = 'routing' }: { id?: string; dataTestId?: string }) {
  const { rootId, getTestId } = useTestId('routing-widget', dataTestId);
  const dispatch = useDispatch();
  
  const routesDict = useSelector(selectLlmRoutes);
  const providersDict = useSelector(selectLlmProviders);
  const schemas = useSelector(selectJsonEditorSchemas);

  const sources = useMemo<AgnosticSourceItem[]>(() => {
    const routes = Object.values(routesDict).map(r => ({ id: r.id, name: r.name, type: 'route' }));
    const providers = Object.values(providersDict).map(p => ({ id: p.id, name: p.name, type: 'provider' }));
    return [...routes, ...providers];
  }, [routesDict, providersDict]);

  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('route');

  useEffect(() => {
    dispatch({ type: 'assets/fetchLlmRoutesRequest' });
    dispatch({ type: 'assets/fetchLlmProvidersRequest' });
  }, [dispatch]);

  useEffect(() => {
    if (!selectedSourceId && sources.length > 0) {
      setSelectedSourceId(sources[0].id);
      setSelectedSourceType(sources[0].type);
    }
  }, [sources, selectedSourceId]);

  const activeDict = selectedSourceType === 'route' ? routesDict : providersDict;
  const items: AgnosticItem[] = Object.values(activeDict);
  
  const schemaKey = selectedSourceType === 'route' ? 'config/llms/routes' : 'config/llms/providers';
  const schema = schemas?.[schemaKey] || {};

  const handleSave = (itemId: string, newContent: any) => {
    const assetId = itemId === 'default' ? (selectedSourceType === 'route' ? 'routes' : 'providers') : `${itemId}.${selectedSourceType}`;
    dispatch({
      type: 'assets/saveAssetRequest',
      payload: {
        type: 'config/llms',
        id: assetId,
        content: JSON.stringify(newContent, null, 2)
      }
    });
  };

  const handleCreate = (name: string, scaffoldedData?: any) => {
    dispatch({ 
      type: 'assets/createAssetRequest', 
      payload: { 
        type: 'config/llms', 
        title: selectedSourceType === 'route' ? 'Route' : 'Provider', 
        id: name || undefined, 
        scaffoldedData 
      } 
    });
    setTimeout(() => {
      dispatch({ type: 'assets/fetchLlmRoutesRequest' });
      dispatch({ type: 'assets/fetchLlmProvidersRequest' });
    }, 800);
  };

  const handleDelete = (item: AgnosticItem) => {
    const assetId = item.id === 'default' ? (selectedSourceType === 'route' ? 'routes' : 'providers') : `${item.id}.${selectedSourceType}`;
    dispatch({
      type: 'assets/deleteAssetRequest',
      payload: { type: 'config/llms', id: assetId }
    });
    setTimeout(() => {
      dispatch({ type: 'assets/fetchLlmRoutesRequest' });
      dispatch({ type: 'assets/fetchLlmProvidersRequest' });
    }, 800);
  };

  const handleOpenVSCode = (item: AgnosticItem) => {
    const assetId = item.id === 'default' ? (selectedSourceType === 'route' ? 'routes' : 'providers') : `${item.id}.${selectedSourceType}`;
    dispatch({
      type: 'assets/openAssetRequest',
      payload: { type: 'config/llms', id: assetId }
    });
  };

  return (
    <div data-testid={getTestId('root')} className="w-full h-full bg-[#09090b] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/80">
        <AgnosticSourceDropdown 
          sources={sources} 
          selectedId={selectedSourceId} 
          onChange={(newId, newType) => {
            setSelectedSourceId(newId);
            setSelectedSourceType(newType);
          }} 
        />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <AgnosticJsonEditorWidget data-testid={getTestId('agnostic-json-editor-widget')}
          id={`${id!}-${selectedSourceType}`}
          title={selectedSourceType === 'route' ? "Routing Profile" : "Provider Settings"}
          items={items}
          schema={schema}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onSave={handleSave}
          onOpenInVSCode={handleOpenVSCode}
        />
      </div>
    </div>
  );
}
