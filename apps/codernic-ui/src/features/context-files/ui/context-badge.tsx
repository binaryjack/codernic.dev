import { vscode } from '../../../shared';

interface ContextBadgeProps {
  id: string;
  filePath: string;
  fileName: string;
  lines?: [number, number];
  onRemove: (id: string) => void;
  'data-testid'?: string;
  'data-demo-desc'?: string;
}

export function ContextBadge({
  id,
  filePath,
  fileName,
  lines,
  onRemove,
  'data-testid': dataTestId,
  'data-demo-desc': dataDemoDesc,
}: ContextBadgeProps) {
  const handleOpen = () => {
    vscode.postMessage({
      type: 'codernic:open-file',
      payload: { filePath, line: lines ? lines[0] : undefined },
    });
  };

  return (
    <div
      data-testid={dataTestId}
      data-demo-desc={dataDemoDesc}
      onClick={handleOpen}
      title="Click to open in editor"
      className="context-file-badge cursor-pointer"
      style={{
        background: '#18181b',
        color: '#e4e4e7',
        border: '1px solid var(--border, #27272a)',
        padding: '3px 8px',
        borderRadius: '16px',
        fontSize: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        userSelect: 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = '#52525b';
        e.currentTarget.style.background = '#27272a';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--border, #27272a)';
        e.currentTarget.style.background = '#18181b';
      }}
    >
      <span style={{ opacity: 0.6 }}>📎</span>
      <span className="truncate" style={{ maxWidth: '140px', fontWeight: 500 }}>
        {fileName}
      </span>
      {lines && (
        <span
          style={{
            fontSize: '8px',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            padding: '1px 4px',
            borderRadius: '4px',
          }}
        >
          {lines[0]}:{lines[1]}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Avoid triggering open-file on remove click!
          onRemove(id);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          padding: '0 2px',
          fontSize: '11px',
          fontWeight: 'bold',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
