import { Button } from '@ai-agencee/ui/atoms';

type Props = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const OVERLAY: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
};

const BOX: React.CSSProperties = {
  background: 'var(--vscode-editor-background)',
  border: '1px solid var(--vscode-panel-border)',
  borderRadius: 4,
  padding: '18px 20px',
  maxWidth: 340,
  width: '90%',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export const ConfirmDialog = function ({ message, onConfirm, onCancel }: Props) {
  return (
    <div style={OVERLAY} onClick={onCancel}>
      <div style={BOX} onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: 10, fontWeight: 600, fontSize: '0.9rem' }}>
          Confirm deletion
        </div>
        <div style={{ marginBottom: 18, fontSize: '0.85rem', opacity: 0.85, lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
