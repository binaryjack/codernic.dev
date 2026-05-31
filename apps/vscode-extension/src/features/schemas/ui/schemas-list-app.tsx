import React, { useEffect, useState } from 'react';
import { vscode } from '../../../webview/vscode-api';

interface Schema {
  id: string;
}

interface MessageEvent {
  data: {
    type: string;
    schemas?: Schema[];
    success?: boolean;
    message?: string;
  };
}

/**
 * Erathos schemas list panel - React version
 * Displays list of entity maps with create/open/delete actions
 */
export function SchemasListApp() {
  const [schemas, setSchemas] = useState<Schema[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'list-response') {
        setSchemas(message.schemas || []);
        setLoading(false);
      } else if (message.type === 'response' && !message.success) {
        alert(message.message);
      }
    };

    window.addEventListener('message', handleMessage as any);

    // Initial load
    vscode.postMessage({ type: 'list' });

    return () => {
      window.removeEventListener('message', handleMessage as any);
    };
  }, []);

  const handleCreate = () => {
    vscode.postMessage({ type: 'create', data: {} });
  };

  const handleOpen = (id: string) => {
    vscode.postMessage({ type: 'open', id });
  };

  const handleDelete = (id: string) => {
    vscode.postMessage({ type: 'delete', id });
  };

  return (
    <div style={styles.body}>
      {/* Watermark */}
      <div style={styles.watermark}>ai agencee</div>

      <div style={styles.contentWrapper}>
        <h3 style={styles.h3}>Erathos</h3>

        <div style={{ marginBottom: '20px' }}>
          <button style={styles.btnPrimary} onClick={handleCreate}>
            + Create New Map
          </button>
        </div>

        <ul style={styles.schemaList}>
          {loading ? (
            <li style={styles.loadingText}>Loading maps...</li>
          ) : schemas && schemas.length === 0 ? (
            <li style={styles.emptyText}>No maps found.</li>
          ) : (
            schemas?.map((schema) => (
              <SchemaItem
                key={schema.id}
                schema={schema}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

interface SchemaItemProps {
  schema: Schema;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function SchemaItem({ schema, onOpen, onDelete }: SchemaItemProps) {
  const [isOpenHovered, setIsOpenHovered] = React.useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = React.useState(false);

  return (
    <li style={styles.listItem}>
      <span style={{ fontWeight: 500 }}>{schema.id.replace('.entity', '')}</span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          style={{
            ...styles.btn,
            ...styles.btnOpen,
            ...(isOpenHovered ? styles.btnOpenHover : {}),
          }}
          onClick={() => onOpen(schema.id)}
          onMouseEnter={() => setIsOpenHovered(true)}
          onMouseLeave={() => setIsOpenHovered(false)}
        >
          Open
        </button>
        <button
          style={{
            ...styles.btn,
            ...styles.btnDelete,
            ...(isDeleteHovered ? styles.btnDeleteHover : {}),
          }}
          onClick={() => onDelete(schema.id)}
          onMouseEnter={() => setIsDeleteHovered(true)}
          onMouseLeave={() => setIsDeleteHovered(false)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

const styles = {
  body: {
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    fontFamily: 'var(--vscode-font-family)',
    fontSize: 'var(--vscode-font-size)',
    padding: '16px',
    position: 'relative' as const,
    minHeight: '100vh',
    overflow: 'hidden' as const,
  },
  watermark: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: '3.5rem',
    fontWeight: 800,
    color: 'var(--vscode-editor-foreground)',
    opacity: 0.04,
    pointerEvents: 'none' as const,
    whiteSpace: 'nowrap' as const,
    zIndex: 0,
    userSelect: 'none' as const,
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 1,
  },
  h3: {
    marginBottom: '16px',
    opacity: 0.9,
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  btn: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '4px',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    width: '100%',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '4px',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    fontFamily: 'inherit',
  },
  btnOpen: {
    background: 'transparent',
    color: 'var(--vscode-textLink-foreground)',
    border: '1px solid var(--vscode-textLink-foreground)',
  },
  btnOpenHover: {
    background: 'var(--vscode-textLink-foreground)',
    color: 'var(--vscode-editor-background)',
  },
  btnDelete: {
    background: 'transparent',
    color: 'var(--vscode-errorForeground)',
    border: '1px solid var(--vscode-errorForeground)',
  },
  btnDeleteHover: {
    background: 'var(--vscode-errorForeground)',
    color: 'var(--vscode-editor-background)',
  },
  schemaList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    marginBottom: '8px',
    background: 'var(--vscode-textBlockQuote-background)',
    borderRadius: '6px',
    borderLeft: '3px solid var(--vscode-button-background)',
  },
  loadingText: {
    opacity: 0.6,
    fontSize: '13px',
  },
  emptyText: {
    opacity: 0.6,
    fontSize: '13px',
    textAlign: 'center' as const,
    paddingTop: '10px',
  },
} as const;
