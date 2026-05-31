import { useEffect, useState } from 'react';
import type { LlmModel, LlmProvider, ManagedLlmStatus } from '../../../../../vscode-extension/src/features/codernic/model/llm.types';
import { CONFIG } from '../../../../../vscode-extension/src/shared/config';
import { vscode } from '../../../shared';
import { ModelCard } from './model-card';
import { ModelConfigForm } from './model-config-form';

const DEFAULT_MODEL: LlmModel = {
  name: '',
  id: '',
  port: CONFIG.DEFAULT_LOCAL_PORT,
  gpuLayers: 99,
  contextSize: 32768,
  threads: 8,
  flashAttn: true,
  ctk: 'q4_0',
  ctv: 'q4_0',
  vramRequiredGb: 20,
};

export function ModelsTab() {
  const [providers, setProviders] = useState<LlmProvider[]>([]);
  const [isAddingTo, setIsAddingTo] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<(LlmModel & { originalId?: string }) | null>(
    null,
  );
  const [newModel, setNewModel] = useState<LlmModel>(DEFAULT_MODEL);
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});
  const [serverStatus, setServerStatus] = useState<Record<string, ManagedLlmStatus>>({});

  useEffect(() => {
    const pollInterval = setInterval(() => {
      providers.forEach((p) => {
        if (p.type === 'local-managed-llama') {
          p.models?.forEach((m) => {
            const status = serverStatus[`${p.id}:${m.id}`]?.status;
            if (status === 'loading' || status === 'starting') {
              vscode.postMessage({
                type: 'codernic:managed-llm-command',
                payload: { providerId: p.id, modelId: m.id, action: 'status' },
              });
            }
          });
        }
      });
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [providers, serverStatus]);

  useEffect(() => {
    vscode.postMessage({ type: 'codernic:get-llm-config' });
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'codernic:llm-config') {
        const configProviders = e.data.payload.providers as LlmProvider[];
        setProviders(configProviders);
        configProviders.forEach((p) => {
          if (p.type === 'local-managed-llama') {
            p.models?.forEach((m) => {
              vscode.postMessage({
                type: 'codernic:managed-llm-command',
                payload: { providerId: p.id, modelId: m.id, action: 'status' },
              });
            });
          }
        });
      }
      if (e.data.type === 'codernic:managed-llm-status') {
        const { providerId, modelId, status, error } = e.data.payload;
        setServerStatus((prev) => ({ ...prev, [`${providerId}:${modelId}`]: { status, error } }));
      }
      if (e.data.type === 'codernic:file-selected') {
        const { path, key } = e.data.payload;
        setNewModel((prev) => ({ ...prev, [key]: path }));
      }
      if (
        e.data.type === 'codernic:llm-provider-saved' ||
        e.data.type === 'codernic:llm-provider-deleted'
      ) {
        vscode.postMessage({ type: 'codernic:get-llm-config' });
        vscode.postMessage({ type: 'codernic:request-llms' });
        setIsAddingTo(null);
        setEditingModel(null);
        setNewModel(DEFAULT_MODEL);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSaveModel = (provider: LlmProvider) => {
    if (!newModel.name || !newModel.id) return;

    let updatedModels: LlmModel[];
    const modelToSave = { ...newModel, isCustom: true };
    const originalId = editingModel?.originalId;

    if (editingModel && originalId) {
      updatedModels = (provider.models || []).filter((m) => m.id !== originalId);
      updatedModels = [...updatedModels, modelToSave];
    } else {
      updatedModels = [...(provider.models || []), modelToSave];
    }

    const updatedProvider = { ...provider, models: updatedModels };
    vscode.postMessage({
      type: 'codernic:save-llm-provider',
      payload: { provider: updatedProvider },
    });
  };

  const handleEditModel = (providerId: string, model: LlmModel) => {
    setIsAddingTo(providerId);
    setEditingModel({ ...model, originalId: model.id });
    setNewModel({ ...model });
  };

  const handleLlmCommand = (
    providerId: string,
    modelId: string,
    action: 'start' | 'kill' | 'status',
  ) => {
    if (action === 'start') {
      setServerStatus((prev) => ({ ...prev, [`${providerId}:${modelId}`]: { status: 'loading' } }));
    }
    vscode.postMessage({
      type: 'codernic:managed-llm-command',
      payload: { providerId, modelId, action },
    });
  };

  const handleTestConnection = async (p: LlmProvider, m: LlmModel) => {
    const key = `${p.id}:${m.id}`;
    if (p.type === 'local-managed-llama') {
      setTestStatus((prev) => ({ ...prev, [key]: 'Checking...' }));
      try {
        const res = await fetch(
          `http://${p.host || CONFIG.DEFAULT_LLAMA_HOST}:${m.port}/v1/models`,
        );
        setTestStatus((prev) => ({ ...prev, [key]: res.ok ? '✅ OK' : `❌ Err ${res.status}` }));
      } catch {
        setTestStatus((prev) => ({ ...prev, [key]: '❌ Down' }));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ opacity: 0.7, fontSize: '11px', color: '#a1a1aa' }}>
        Add models linked to your providers.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {providers.map((p) => (
          <div
            key={p.id}
            className="provider-models-box"
            style={{
              border: '1px solid var(--border, #27272a)',
              padding: '12px',
              borderRadius: '6px',
              background: '#161618',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                borderBottom: '1px solid var(--border, #27272a)',
                paddingBottom: '4px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '11px', color: 'var(--text-h)' }}>{p.name}</h4>
              <button
                onClick={() => setIsAddingTo(p.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                + Add Model
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p.models?.map((m) => {
                const key = `${p.id}:${m.id}`;
                const status = serverStatus[key]?.status || 'stopped';
                return (
                  <ModelCard
                    key={m.id}
                    provider={p}
                    model={m}
                    status={status}
                    error={serverStatus[key]?.error}
                    testStatus={testStatus[key]}
                    onStart={() => handleLlmCommand(p.id, m.id, 'start')}
                    onKill={() => handleLlmCommand(p.id, m.id, 'kill')}
                    onTest={() => handleTestConnection(p, m)}
                    onEdit={() => handleEditModel(p.id, m)}
                    onDelete={() => {
                      if (confirm('Delete model?')) {
                        const updated = { ...p, models: p.models.filter((x) => x.id !== m.id) };
                        vscode.postMessage({
                          type: 'codernic:save-llm-provider',
                          payload: { provider: updated },
                        });
                      }
                    }}
                  />
                );
              })}
            </div>

            {isAddingTo === p.id && (
              <ModelConfigForm
                provider={p}
                newModel={newModel}
                editingModel={editingModel}
                onUpdateNewModel={(u) => setNewModel((prev) => ({ ...prev, ...u }))}
                onSave={() => handleSaveModel(p)}
                onCancel={() => {
                  setIsAddingTo(null);
                  setEditingModel(null);
                }}
                onBrowse={(key, title, filters) =>
                  vscode.postMessage({
                    type: 'codernic:browse-file',
                    payload: { key, title, filters },
                  })
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
