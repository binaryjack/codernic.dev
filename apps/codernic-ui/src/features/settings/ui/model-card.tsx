import type { LlmModel, LlmProvider } from '../../../../../vscode-extension/src/features/codernic/model/llm.types';
import { Button } from '../../../shared';

interface ModelCardProps {
  provider: LlmProvider;
  model: LlmModel;
  status: string;
  error?: string;
  testStatus?: string;
  onStart: () => void;
  onKill: () => void;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ModelCard({
  provider,
  model,
  status,
  error,
  testStatus,
  onStart,
  onKill,
  onTest,
  onEdit,
  onDelete,
}: ModelCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return '#10b981';
      case 'loading':
      case 'starting':
        return '#3b82f6';
      case 'failed':
      case 'error':
        return '#ef4444';
      default:
        return '#a1a1aa';
    }
  };

  return (
    <div
      className="model-container-vertical"
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '10px',
        borderBottom: '1px solid var(--border, #27272a)',
        paddingBottom: '10px',
      }}
    >
      <div
        className="model-row-styled"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          padding: '4px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {provider.type === 'local-managed-llama' && (
            <span
              style={{
                fontSize: '8px',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: `${getStatusColor()}1a`,
                color: getStatusColor(),
                border: `1px solid ${getStatusColor()}33`,
              }}
              title={error}
            >
              {status === 'loading' ? '⌛' : status.toUpperCase()}
            </span>
          )}
          {provider.type === 'local-managed-llama' && (
            <span style={{ fontFamily: 'var(--mono)', opacity: 0.6 }}>:{model.port}</span>
          )}
          <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{model.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {provider.type === 'local-managed-llama' && (
            <>
              <Button
                onClick={onStart}
                disabled={status === 'loading' || status === 'starting'}
                variant="accent"
                size="xs"
              >
                {status === 'running' ? 'Retry' : 'Start'}
              </Button>
              <Button
                onClick={onKill}
                disabled={status !== 'running'}
                variant="danger"
                size="xs"
              >
                Kill
              </Button>
            </>
          )}
          <Button onClick={onTest} variant="secondary" size="xs">
            {testStatus || 'Test'}
          </Button>
          <Button onClick={onEdit} variant="secondary" size="xs">
            Edit
          </Button>
          <button
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '12px',
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {error && status === 'error' && (
        <div
          style={{
            fontSize: '10px',
            color: '#ef4444',
            marginTop: '6px',
            padding: '6px 10px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '4px',
            borderLeft: '2px solid #ef4444',
          }}
        >
          ❌ {error}
        </div>
      )}
    </div>
  );
}
