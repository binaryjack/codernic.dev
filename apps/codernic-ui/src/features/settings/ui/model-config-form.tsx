import type { LlmModel, LlmProvider } from '../../../../../codernic-ext/src/features/codernic/model/llm.types';
import { Button, Select } from '../../../shared';

interface ModelConfigFormProps {
  provider: LlmProvider;
  newModel: LlmModel;
  editingModel: (LlmModel & { originalId?: string }) | null;
  onUpdateNewModel: (updates: Partial<LlmModel>) => void;
  onSave: () => void;
  onCancel: () => void;
  onBrowse: (key: string, title: string, filters?: Record<string, string[]>) => void;
}

export function ModelConfigForm({
  provider,
  newModel,
  editingModel,
  onUpdateNewModel,
  onSave,
  onCancel,
  onBrowse,
}: ModelConfigFormProps) {
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
        padding: '12px',
        borderRadius: '6px',
        marginTop: '10px',
        background: '#131316',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={groupStyle}>
          <label style={labelStyle} htmlFor={`name-${provider.id}`}>
            Display Name
          </label>
          <input
            id={`name-${provider.id}`}
            style={inputStyle}
            value={newModel.name}
            onChange={(e) => onUpdateNewModel({ name: e.target.value })}
            placeholder="e.g. Gemma 4 26B"
          />
        </div>

        <div style={groupStyle}>
          <label style={labelStyle} htmlFor={`id-${provider.id}`}>
            Model ID
          </label>
          <input
            id={`id-${provider.id}`}
            style={inputStyle}
            value={newModel.id}
            onChange={(e) => onUpdateNewModel({ id: e.target.value })}
            placeholder="e.g. gemma-4"
          />
        </div>

        {provider.type === 'local-managed-llama' && (
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
              <label style={labelStyle} htmlFor={`modelPath-${provider.id}`}>
                Model Path (.gguf)
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  id={`modelPath-${provider.id}`}
                  style={inputStyle}
                  value={newModel.modelPath || ''}
                  onChange={(e) => onUpdateNewModel({ modelPath: e.target.value })}
                  placeholder="/path/to/model.gguf"
                />
                <Button
                  onClick={() =>
                    onBrowse('modelPath', 'Select GGUF Model', { 'GGUF Models': ['gguf'] })
                  }
                  variant="secondary"
                  size="sm"
                  style={{ padding: '0 8px', borderRadius: '4px' }}
                >
                  ...
                </Button>
              </div>
            </div>

            <div style={groupStyle}>
              <label style={labelStyle} htmlFor={`mmprojPath-${provider.id}`}>
                Vision Projection (mmproj - optional)
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  id={`mmprojPath-${provider.id}`}
                  style={inputStyle}
                  value={newModel.mmprojPath || ''}
                  onChange={(e) => onUpdateNewModel({ mmprojPath: e.target.value })}
                  placeholder="/path/to/mmproj.gguf"
                />
                <Button
                  onClick={() => onBrowse('mmprojPath', 'Select Vision Projection')}
                  variant="secondary"
                  size="sm"
                  style={{ padding: '0 8px', borderRadius: '4px' }}
                >
                  ...
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ ...groupStyle, flex: 1 }}>
                <label style={labelStyle} htmlFor={`ctx-${provider.id}`}>
                  Context Size
                </label>
                <input
                  id={`ctx-${provider.id}`}
                  style={inputStyle}
                  type="number"
                  value={newModel.contextSize}
                  onChange={(e) => onUpdateNewModel({ contextSize: parseInt(e.target.value) })}
                />
              </div>
              <div style={{ ...groupStyle, flex: 1 }}>
                <label style={labelStyle} htmlFor={`threads-${provider.id}`}>
                  Threads
                </label>
                <input
                  id={`threads-${provider.id}`}
                  style={inputStyle}
                  type="number"
                  value={newModel.threads}
                  onChange={(e) => onUpdateNewModel({ threads: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ ...groupStyle, flex: 1 }}>
                <label style={labelStyle} htmlFor={`ctk-${provider.id}`}>
                  KV-Cache (K)
                </label>
                <Select
                  id={`ctk-${provider.id}`}
                  value={newModel.ctk}
                  onChange={(e) => onUpdateNewModel({ ctk: e.currentTarget.value })}
                  variant="full"
                  style={{ height: '23px', padding: '2px 6px' }}
                >
                  <option value="f16" style={{ background: '#18181b' }}>F16</option>
                  <option value="q8_0" style={{ background: '#18181b' }}>Q8_0</option>
                  <option value="q4_0" style={{ background: '#18181b' }}>Q4_0</option>
                </Select>
              </div>
              <div style={{ ...groupStyle, flex: 1 }}>
                <label style={labelStyle} htmlFor={`ctv-${provider.id}`}>
                  KV-Cache (V)
                </label>
                <Select
                  id={`ctv-${provider.id}`}
                  value={newModel.ctv}
                  onChange={(e) => onUpdateNewModel({ ctv: e.currentTarget.value })}
                  variant="full"
                  style={{ height: '23px', padding: '2px 6px' }}
                >
                  <option value="f16" style={{ background: '#18181b' }}>F16</option>
                  <option value="q8_0" style={{ background: '#18181b' }}>Q8_0</option>
                  <option value="q4_0" style={{ background: '#18181b' }}>Q4_0</option>
                </Select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ ...groupStyle, flex: 1 }}>
                <label style={labelStyle} htmlFor={`vram-${provider.id}`}>
                  VRAM Req (GB)
                </label>
                <input
                  id={`vram-${provider.id}`}
                  style={inputStyle}
                  type="number"
                  step="0.1"
                  value={newModel.vramRequiredGb}
                  onChange={(e) => onUpdateNewModel({ vramRequiredGb: parseFloat(e.target.value) })}
                  placeholder="e.g. 20"
                />
              </div>
              <div style={{ ...groupStyle, flex: 1 }}>
                <label style={labelStyle} htmlFor={`port-${provider.id}`}>
                  Port
                </label>
                <input
                  id={`port-${provider.id}`}
                  style={inputStyle}
                  type="number"
                  value={newModel.port}
                  onChange={(e) => onUpdateNewModel({ port: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <input
                type="checkbox"
                checked={newModel.flashAttn}
                onChange={(e) => onUpdateNewModel({ flashAttn: e.target.checked })}
                id={`chk-flash-${provider.id}`}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor={`chk-flash-${provider.id}`} style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
                Flash Attn
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Button onClick={onSave} variant="primary" style={{ flex: 1 }}>
            {editingModel ? 'Update' : 'Save'}
          </Button>
          <Button onClick={onCancel} variant="secondary" style={{ flex: 1 }}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
