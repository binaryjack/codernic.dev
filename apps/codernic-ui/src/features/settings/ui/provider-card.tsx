import type { LlmProvider } from '../../../../../codernic-ext/src/features/codernic/model/llm.types';
import { Button } from '../../../shared';

interface ProviderCardProps {
  provider: LlmProvider;
  testStatus?: string;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProviderCard({
  provider,
  testStatus,
  onTest,
  onEdit,
  onDelete,
}: ProviderCardProps) {
  return (
    <div
      className="provider-card"
      style={{
        border: '1px solid var(--border, #27272a)',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '10px',
        background: '#161618',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        className="provider-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
        }}
      >
        <div className="provider-info-group">
          <strong style={{ color: 'var(--text-h)', fontSize: '12px' }}>{provider.name}</strong>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button onClick={onTest} variant="accent" size="xs">
            {testStatus || 'Test'}
          </Button>
          <Button onClick={onEdit} variant="secondary" size="xs">
            Edit
          </Button>
          <Button onClick={onDelete} variant="secondary" size="xs" style={{ color: '#ef4444' }}>
            Delete
          </Button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
          Type: {provider.type}
        </span>
        <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {provider.baseUrl || provider.llamaCppPath}
        </span>
      </div>
    </div>
  );
}
