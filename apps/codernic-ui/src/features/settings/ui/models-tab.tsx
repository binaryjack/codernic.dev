import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoraTrainerWidget } from '../../lora-trainer/components/organisms/lora-trainer-widget';
import { selectJsonEditorSchemas, selectLlmProviders } from '../../../entities/assets/model/assets-slice';
import { JsonAccordionEditor } from '../../../features/json-editor/components/json-editor/JsonAccordionEditor';
import { vscode } from '../../../shared';
import { Button } from '../../../shared/ui/button';
import { getOllamaUrl } from '../../../shared/config';
import { useTestId } from '@ai-agencee/ui';

export function ModelsTab() {
  const { rootId, getTestId } = useTestId('models-tab', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
  const dispatch = useDispatch();
  const llmProviders = useSelector(selectLlmProviders);
  const providers = Object.values(llmProviders);

  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schemas = useSelector(selectJsonEditorSchemas);
  const schema = schemas?.['config/llms/providers'] || {};

  // Fetch providers list on mount
  useEffect(() => {
    dispatch({ type: 'assets/fetchLlmProvidersRequest' });
  }, [dispatch]);

  // Set initial active provider
  useEffect(() => {
    if (providers.length > 0 && !activeProviderId) {
      setActiveProviderId(providers[0].id);
    }
  }, [providers, activeProviderId]);

  // Sync Redux state to local editable state
  useEffect(() => {
    if (!activeProviderId) return;

    if (activeProviderId === 'new_provider_draft') {
      setLocalContent({
        type: 'local-ollama',
        apiKey: '',
        baseUrl: getOllamaUrl(),
        models: []
      });
      setError(null);
      return;
    }

    const provider = llmProviders[activeProviderId];
    if (provider && provider.content) {
      // It's possible provider.content is still empty object '{}' if just initialized
      setLocalContent(provider.content);
      setError(null);
    } else {
      setLocalContent(null); // Loading state
    }
  }, [activeProviderId, llmProviders]);

  const handleSave = () => {
    if (!localContent) return;
    setIsSaving(true);
    
    let targetId = activeProviderId;
    if (targetId === 'new_provider_draft') {
      const input = window.prompt("Enter a unique ID for this new provider (e.g., 'my-custom-llm'):", "new-provider");
      if (!input) {
        setIsSaving(false);
        return;
      }
      targetId = input.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    }

    const assetId = `${targetId}.provider`;
    dispatch({
      type: 'assets/saveAssetRequest',
      payload: {
        type: 'config/llms',
        id: assetId,
        content: JSON.stringify(localContent, null, 2)
      }
    });
    
    // Simulate save finish since Saga handles the real loading state via app/loading
    setTimeout(() => {
      setIsSaving(false);
      dispatch({ type: 'assets/fetchLlmProvidersRequest' });
      if (targetId !== activeProviderId) {
        setActiveProviderId(targetId);
      }
    }, 800);
  };

  const handleTestConnection = () => {
    if (!localContent) return;
    const providerObj = { ...localContent, id: activeProviderId };
    vscode.postMessage({
      type: 'codernic:test-connection',
      payload: { provider: providerObj, reqId: activeProviderId },
    });
  };

  return (
    <div className="flex flex-col h-full w-full gap-4">
      <div className="text-xs text-[#a1a1aa]">
        Select a provider to configure its settings and link models. You can also add custom providers.
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={activeProviderId || ''}
          onChange={(e) => setActiveProviderId(e.target.value)}
          className="bg-[#18181b] text-white text-xs border border-[#27272a] rounded px-2 py-1.5 focus:outline-none focus:border-amber-400"
          style={{ minWidth: '200px' }}
        >
          {providers.map(p => (
            <option key={p.id} value={p.id}>
              {p.name || p.id} ({p.id})
            </option>
          ))}
          {activeProviderId === 'new_provider_draft' && (
            <option value="new_provider_draft">-- New Provider --</option>
          )}
        </select>
        
        <Button data-testid={getTestId('button')}
          onClick={() => setActiveProviderId('new_provider_draft')}
          variant="secondary"
        >
          + Add
        </Button>
        
        {localContent && activeProviderId !== 'new_provider_draft' && (
          <Button data-testid={getTestId('button-1')} onClick={handleTestConnection} variant="secondary">
            Test Connection
          </Button>
        )}
      </div>

      {error ? (
        <div className="p-4 text-red-400">{error}</div>
      ) : localContent === null ? (
        <div className="p-4 text-[#a1a1aa]">
          <div className="animate-pulse mb-4">Loading provider configuration...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4">
          <JsonAccordionEditor data-testid={getTestId('json-accordion-editor')} 
            value={localContent} 
            onChange={setLocalContent} 
            onSave={handleSave} 
            isSaving={isSaving}
            schema={schema}
          />
        </div>
      )}

      {/* LoRA Trainer Dashboard */}
      <div className="mt-4 pt-4 border-t border-[#27272a]">
        <LoraTrainerWidget data-testid={getTestId('lora-trainer-widget')} />
      </div>
    </div>
  );
}
