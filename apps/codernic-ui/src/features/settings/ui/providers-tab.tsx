import { useEffect, useState } from 'react';
import type { LlmProvider } from '../../../../../vscode-extension/src/features/codernic/model/llm.types';
import { CONFIG } from '../../../../../vscode-extension/src/shared/config';
import { Button, vscode } from '../../../shared';
import { ProviderCard } from './provider-card';
import { ProviderConfigForm } from './provider-config-form';

const DEFAULT_PROVIDER: LlmProvider = {
  id: '',
  name: '',
  type: 'local-ollama',
  baseUrl: '',
  apiKey: '',
  host: CONFIG.DEFAULT_LLAMA_HOST,
  models: [],
};

export function ProvidersTab() {
  const [providers, setProviders] = useState<LlmProvider[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState<LlmProvider>(DEFAULT_PROVIDER);
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    vscode.postMessage({ type: 'codernic:get-llm-config' });
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'codernic:llm-config')
        setProviders(e.data.payload.providers as LlmProvider[]);
      if (
        e.data.type === 'codernic:llm-provider-saved' ||
        e.data.type === 'codernic:llm-provider-deleted'
      ) {
        vscode.postMessage({ type: 'codernic:get-llm-config' });
        setIsAdding(false);
        setEditingProviderId(null);
        setNewProvider(DEFAULT_PROVIDER);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSave = () => {
    if (!newProvider.name) return;
    const providerObj = {
      ...newProvider,
      id: editingProviderId || newProvider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    vscode.postMessage({
      type: 'codernic:save-llm-provider',
      payload: { provider: providerObj, apiKey: newProvider.apiKey },
    });
  };

  const handleTestConnection = async (p: LlmProvider) => {
    if (p.type === 'local-managed-llama') {
      setTestStatus((prev) => ({ ...prev, [p.id]: 'Binary OK' }));
      return;
    }
    setTestStatus((prev) => ({ ...prev, [p.id]: 'Testing...' }));
    try {
      const isOllama = p.type === 'local-ollama';
      const endpoint = isOllama ? '/api/tags' : '/models';
      const baseUrl = p.baseUrl || '';
      const cleanBaseUrl = isOllama ? baseUrl.replace(/\/v1\/?$/, '') : baseUrl;

      const res = await fetch(`${cleanBaseUrl.replace(/\/chat\/completions$/, '')}${endpoint}`, {
        headers: { Authorization: `Bearer test` },
      });
      setTestStatus((prev) => ({
        ...prev,
        [p.id]: res.ok ? '✅ Connected' : `❌ Error: ${res.status}`,
      }));
    } catch {
      setTestStatus((prev) => ({ ...prev, [p.id]: '❌ Unreachable' }));
    }
    setTimeout(
      () =>
        setTestStatus((prev) => {
          const next = { ...prev };
          delete next[p.id];
          return next;
        }),
      3000,
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ opacity: 0.7, fontSize: '11px', color: '#a1a1aa' }}>
        Configure custom LLM providers (e.g., Ollama, Managed Llama-Server).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {providers.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            testStatus={testStatus[p.id]}
            onKillAll={() =>
              vscode.postMessage({
                type: 'codernic:managed-llm-command',
                payload: { providerId: p.id, action: 'kill' },
              })
            }
            onTest={() => handleTestConnection(p)}
            onEdit={() => {
              setNewProvider({ ...p, apiKey: '' });
              setEditingProviderId(p.id);
              setIsAdding(true);
            }}
            onDelete={() => {
              if (confirm('Delete this provider?')) {
                vscode.postMessage({
                  type: 'codernic:delete-llm-provider',
                  payload: { providerId: p.id },
                });
              }
            }}
          />
        ))}
      </div>

      {isAdding ? (
        <ProviderConfigForm
          newProvider={newProvider}
          isEditing={!!editingProviderId}
          onUpdate={(u) => setNewProvider((prev) => ({ ...prev, ...u }))}
          onSave={handleSave}
          onCancel={() => {
            setIsAdding(false);
            setEditingProviderId(null);
            setNewProvider(DEFAULT_PROVIDER);
          }}
          onBrowse={(key, title) =>
            vscode.postMessage({ type: 'codernic:browse-file', payload: { key, title } })
          }
        />
      ) : (
        <Button
          onClick={() => {
            setIsAdding(true);
            setEditingProviderId(null);
            setNewProvider(DEFAULT_PROVIDER);
          }}
          variant="primary"
          style={{ marginTop: '8px' }}
        >
          + Add Provider
        </Button>
      )}
    </div>
  );
}
