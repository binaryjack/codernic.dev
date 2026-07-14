import type { CodernicContextFile } from '../../../entities/kernel/model/types';
import { ContextBadge } from './context-badge';

interface ContextBadgeListProps {
  files: CodernicContextFile[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  'data-testid'?: string;
  'data-demo-desc'?: string;
}

export function ContextBadgeList({
  'data-testid': dataTestId,
  'data-demo-desc': dataDemoDesc,
  files,
  onRemoveFile,
  onClearAll,
}: ContextBadgeListProps) {
  if (files.length === 0) return null;

  return (
    <div
      data-testid={dataTestId || 'context-badge-list'}
      data-demo-desc={dataDemoDesc}
      className="context-files-area"
      style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--border, #27272a)',
        background: '#131316',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        maxHeight: '80px',
        overflowY: 'auto',
        alignItems: 'center',
      }}
    >
      {files.map((file) => (
        <ContextBadge
          data-testid={`context-badge-${file.id}`}
          key={file.id}
          id={file.id}
          filePath={file.filePath}
          fileName={file.fileName}
          lines={file.lines}
          onRemove={onRemoveFile}
          data-demo-desc={(file as any).demoDesc}
        />
      ))}
      <button
        onClick={onClearAll}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: '#71717a',
          fontSize: '10px',
          fontFamily: 'var(--mono)',
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: '2px 4px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#e4e4e7';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#71717a';
        }}
      >
        Clear All
      </button>
    </div>
  );
}
