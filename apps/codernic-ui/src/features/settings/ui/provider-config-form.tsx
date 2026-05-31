import type { LlmProvider, LlmProviderType } from '../../../../../vscode-extension/src/features/codernic/model/llm.types';
import { Button, Select } from '../../../shared';

interface ProviderConfigFormProps {
  newProvider: LlmProvider;
  isEditing: boolean;
  onUpdate: (updates: Partial<LlmProvider>) => void;
  onSave: () => void;
  onCancel: () => void;
  onBrowse: (key: string, title: string) => void;
}

export function ProviderConfigForm({
  newProvider,
  isEditing,
  onUpdate,
  onSave,
  onCancel,
  onBrowse,
}: ProviderConfigFormProps) {
  const inputStyle: React.CSSProperties = {
    background: 'var(--vscode-input-background, #1e1e1e)',
    color: 'var(--vscode-input-foreground, #cccccc)',
    border: '1px solid var(--border, #27272a)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '2px',
    display: 'block',
  };

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginBottom: '8px',
  };

  return (
    <div
      style={{
        border: '1px solid var(--border, #27272a)',
        padding: '16px',
        borderRadius: '6px',
        marginTop: '16px',
        background: '#131316',
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-h)' }}>
        Provider Configuration
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={groupStyle}>
          <label style={labelStyle} htmlFor="prov-name">
            Name
          </label>
          <input
            id="prov-name"
            style={inputStyle}
            value={newProvider.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g. My Local Ollama"
          />
        </div>

        <div style={groupStyle}>
          <label style={labelStyle} htmlFor="prov-type">
            Type
          </label>
          <Select
            id="prov-type"
            value={newProvider.type}
            onChange={(e) => onUpdate({ type: e.currentTarget.value as LlmProviderType })}
            variant="full"
            style={{ height: '23px', padding: '2px 6px' }}
          >
            <option value="cloud-openai" style={{ background: '#18181b' }}>OpenAI Compatible (Cloud)</option>
            <option value="local-ollama" style={{ background: '#18181b' }}>Ollama (Local)</option>
            <option value="local-managed-llama" style={{ background: '#18181b' }}>Llama.cpp Server (Managed)</option>
            <option value="local-custom" style={{ background: '#18181b' }}>Custom (Local)</option>
          </Select>
        </div>

        {newProvider.type === 'local-managed-llama' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderLeft: '2px solid var(--vscode-button-background, #2563eb)',
              paddingLeft: '12px',
              marginTop: '6px',
            }}
          >
            <div style={groupStyle}>
              <label style={labelStyle} htmlFor="llama-path">
                Llama.cpp Server Path
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  id="llama-path"
                  style={inputStyle}
                  value={newProvider.llamaCppPath || ''}
                  onChange={(e) => onUpdate({ llamaCppPath: e.target.value })}
                  placeholder="/path/to/llama-server"
                />
                <Button
                  onClick={() => onBrowse('llamaCppPath', 'Select llama-server binary')}
                  variant="secondary"
                  size="sm"
                  style={{ padding: '0 8px', borderRadius: '4px' }}
                >
                  ...
                </Button>
              </div>
            </div>
            <div style={groupStyle}>
              <label style={labelStyle} htmlFor="llama-host">
                Host
              </label>
              <input
                id="llama-host"
                style={inputStyle}
                value={newProvider.host}
                onChange={(e) => onUpdate({ host: e.target.value })}
                placeholder="e.g. 127.0.0.1"
              />
            </div>
          </div>
        ) : (
          <div style={groupStyle}>
            <label style={labelStyle} htmlFor="base-url">
              Base URL
            </label>
            <input
              id="base-url"
              style={inputStyle}
              value={newProvider.baseUrl}
              onChange={(e) => onUpdate({ baseUrl: e.target.value })}
              placeholder="e.g. http://localhost:11434/v1"
            />
          </div>
        )}

        <div style={groupStyle}>
          <label style={labelStyle} htmlFor="api-key">
            API Key
          </label>
          <input
            id="api-key"
            style={inputStyle}
            type="password"
            value={newProvider.apiKey}
            onChange={(e) => onUpdate({ apiKey: e.target.value })}
            placeholder="••••••••••••"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Button onClick={onSave} variant="primary" style={{ flex: 1 }}>
            {isEditing ? 'Update' : 'Save'}
          </Button>
          <Button onClick={onCancel} variant="secondary" style={{ flex: 1 }}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
