import type { LlmModel } from '../../../../../codernic-ext/src/features/codernic/model/llm.types';
import { Button } from '../../../shared';

interface ModelCardProps {
  model: LlmModel;
  testStatus?: string;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ModelCard({
  model,
  testStatus,
  onTest,
  onEdit,
  onDelete,
}: ModelCardProps) {

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
          <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{model.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
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
    </div>
  );
}
