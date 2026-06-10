import { useEffect, useRef, useState, memo } from 'react';
import { useSelector } from 'react-redux';
// @ts-ignore
import { initializeStructuraWebview } from '@atomos-web/structura/webview';
// @ts-ignore
import '@atomos-web/prime-style/dist/styles.css';

export interface IErathosCanvasProps {
  id?: string;
  readOnly?: boolean;
  onClose?: () => void;
}

export const ErathosCanvas = memo(function ErathosCanvas({ 
  id = 'erathos-canvas-container', 
  readOnly = false,
  onClose
}: IErathosCanvasProps) {
  const [isClosed, setIsClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  // Hook into nodesMap progress
  const nodesMap = useSelector((state: any) => state.kernel?.nodesMap || {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsClosed(true);
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use default local MCP sub-server port 9743
    const mcpServerUrl = (import.meta as any).env.VITE_ERATHOS_MCP_URL || 'http://localhost:9743';

    const init = async () => {
      try {
        const app = await initializeStructuraWebview({
          instanceId: 'codernic-erathos-canvas',
          mcpServerUrl,
          containerId: id,
          workspaceConfig: {
            headless: false,
            allow_multiple_schemas: true,
            read_only: readOnly,
          },
        });
        appRef.current = app;
      } catch (err) {
        console.error('[Erathos] Failed to initialize visual canvas:', err);
      }
    };

    init();

    return () => {
      if (appRef.current && typeof appRef.current.disconnect === 'function') {
        appRef.current.disconnect().catch((e: any) => 
          console.error('[Erathos] Failed to disconnect canvas on cleanup:', e)
        );
      }
    };
  }, []);

  // Effect to sync visual canvas with Redux nodesMap
  useEffect(() => {
    if (appRef.current && appRef.current.updateNodeStatus) {
      // Loop over nodesMap and sync their progress states
      Object.entries(nodesMap).forEach(([nodeId, nodeData]: [string, any]) => {
        appRef.current.updateNodeStatus(nodeId, {
          progress: nodeData.progress,
          status: nodeData.status, // e.g. 'running', 'completed', 'failed'
          message: nodeData.message
        });
      });
    }
  }, [nodesMap]);

  if (isClosed) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: readOnly ? '300px' : '100%' }}>
      {readOnly && (
        <button
          onClick={() => {
            setIsClosed(true);
            if (onClose) onClose();
          }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 50,
            background: 'rgba(24, 24, 27, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a1a1aa',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '10px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
        >
          ✕ Close Snapshot
        </button>
      )}
      <div
        id={id}
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#09090b',
          border: 'none',
          overflow: 'hidden',
        }}
      />
    </div>
  );
});
