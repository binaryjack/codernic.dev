import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectJsonEditorSchemas, selectLlmRoutes, selectActiveRouteProfile } from '../../../entities/assets/model/assets-slice';
import { JsonAccordionEditor } from '../../../features/json-editor/components/json-editor/JsonAccordionEditor';
import { sendIntent } from '../../../shared/store/intent';
import { useTestId } from '@ai-agencee/ui';

export function RoutesTab() {
  const { rootId, getTestId } = useTestId('routes-tab', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
  const dispatch = useDispatch();
  const llmRoutes = useSelector(selectLlmRoutes);
  const activeProfile = useSelector(selectActiveRouteProfile);

  const [localContent, setLocalContent] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schemas = useSelector(selectJsonEditorSchemas);
  const schema = schemas?.['config/llms/routes'] || {};

  // Fetch routes and active profile on mount
  useEffect(() => {
    dispatch({ type: 'assets/fetchLlmRoutesRequest' });
    dispatch(sendIntent({ type: 'codernic:get-route-profile' }));
  }, [dispatch]);

  // Sync Redux state to local editable state
  useEffect(() => {
    const route = llmRoutes[activeProfile];
    if (route && route.content) {
      setLocalContent(route.content);
      setError(null);
    } else {
      setLocalContent(null);
    }
  }, [activeProfile, llmRoutes]);

  const handleSave = () => {
    if (!localContent) return;
    setIsSaving(true);
    
    const assetId = activeProfile === 'default' ? 'routes' : `${activeProfile}.route`;
    dispatch({
      type: 'assets/saveAssetRequest',
      payload: {
        type: 'config/llms',
        id: assetId,
        content: JSON.stringify(localContent, null, 2)
      }
    });

    setTimeout(() => setIsSaving(false), 800);
  };

  const handleProfileChange = (profile: string) => {
    dispatch(sendIntent({ type: 'codernic:set-route-profile', payload: { profile } }));
    // Immediately dispatch so UI feels snappy
    dispatch({ type: 'assets/setActiveRouteProfile', payload: profile });
  };

  if (error) {
    return <div className="p-4 text-red-400">{error}</div>;
  }

  if (localContent === null) {
    return (
      <div className="p-4 text-[#a1a1aa]">
        <div className="animate-pulse mb-4">Loading routes.json...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="text-xs text-[#a1a1aa] mb-4">
        Configure specialized routing for specific tasks. Select an active profile below.
      </div>
      
      {/* Segmented Control for Route Profiles */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-md w-fit border border-[#27272a]">
          {[
            { id: 'default', label: 'Base' },
            { id: 'local', label: 'Local' },
            { id: 'cloud', label: 'Cloud' },
            { id: 'hybrid', label: 'Hybrid' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handleProfileChange(p.id)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                activeProfile === p.id 
                  ? 'bg-[#27272a] text-white font-medium' 
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            dispatch(sendIntent({ type: 'codernic:sync-aggregator-models' }));
          }}
          className="px-3 py-1.5 text-xs rounded transition-colors bg-[#007acc] text-white hover:bg-[#005a9e]"
        >
          Sync Cloud Providers
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <JsonAccordionEditor data-testid={getTestId('json-accordion-editor')} 
          value={localContent} 
          onChange={setLocalContent} 
          onSave={handleSave} 
          isSaving={isSaving}
          schema={schema}
        />
      </div>
    </div>
  );
}
