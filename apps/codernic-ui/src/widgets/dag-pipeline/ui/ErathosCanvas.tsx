import type { RootState } from '../../../store';
import { useEffect, useRef, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentSessionId } from '../../../features/sessions/store/sessions.slice';
import { setErathosSchema, selectGalileusSnapshot, selectErathosSchema, selectIsErathosDirty, sendSchemaToCodernic, saveSchemaLocal } from '../../../features/dag/store/dag.slice';
import { setErathosSnapshot } from '../../../features/sessions/store/sessions.slice';
import { confirmUnsavedChanges } from '../../../features/dag/store/confirmUnsavedChanges';
import { IconCheck } from '@ai-agencee/ui';
import { appendSystemLogsBatch } from '../../../features/system/store/system.slice';
// @ts-expect-error
import { initializeStructuraWebview } from '@atomos-web/structura/webview';
// @ts-expect-error
import '@atomos-web/prime-style/dist/styles.css';
import '../../../features/dag/styles/erathos-theme.css';
import { getErathosMcpUrl } from '../../../shared/config';
import { useTestId } from '@ai-agencee/ui';

export interface IErathosCanvasProps {
  id?: string;
  readOnly?: boolean;
  onClose?: () => void;
  initialState?: any;
  hideHeader?: boolean;
  appearance?: string;
  dataTestId?: string;
  allowMouseZoom?: boolean;
  allowMultipleSchemas?: boolean;
  disableLocalStorage?: boolean;
  fitToScreen?: boolean;
}

export const ErathosCanvas = memo(function ErathosCanvas({ dataTestId, 
  id, 
  readOnly = false,
  onClose,
  initialState,
  hideHeader = false,
  appearance,
  allowMouseZoom = true,
  allowMultipleSchemas = true,
  disableLocalStorage = false,
  fitToScreen = true
}: IErathosCanvasProps) {
  
  const { rootId, getTestId } = useTestId('erathos-canvas', dataTestId);
const [isClosed, setIsClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const schemaDebounceRef = useRef<number | null>(null);
  const uniqueId = useRef(`erathos-canvas-${Math.random().toString(36).substr(2, 9)}`).current;
  const canvasId = id || uniqueId;
  const dispatch = useDispatch();

  const galileusSnapshot = useSelector(selectGalileusSnapshot);
  const currentSessionId = useSelector(selectCurrentSessionId);
  const sessionIdRef = useRef(currentSessionId);
  const globalSchema = useSelector(selectErathosSchema);
  const isDirty = useSelector(selectIsErathosDirty);

  
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (id) {
      const target = document.getElementById(`widget-header-actions-${id}`);
      if (target) setPortalTarget(target);
    }
  }, [id]);

  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        confirmUnsavedChanges().then(canClose => {
          if (canClose) {
            setIsClosed(true);
            if (onClose) onClose();
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let unmounted = false;
    let mcpServerUrl = '';
    
    const initWebview = async () => {
      try {
        mcpServerUrl = await getErathosMcpUrl();
        if (unmounted) return;
        
        console.log('[DEBUG] Calling initializeStructuraWebview with containerId:', canvasId);
        
        // Handle appearance background dynamically via appSettings
        let canvasBackgroundColor = 'transparent';
        if (appearance === 'black' || appearance === 'execution') {
          canvasBackgroundColor = '#000000';
        } else if (appearance === 'codernic-background') {
          // Fallback to Codernic's background var or transparent
          canvasBackgroundColor = 'var(--background, transparent)';
        }

        const app = await initializeStructuraWebview({
          instanceId: `codernic-erathos-${canvasId}`,
          mcpServerUrl,
          containerId: canvasId,
          initialState: initialState || globalSchema,
          appSettings: {
            general: {
              canvasBackgroundColor
            }
          },
          workspaceConfig: {
            headless: hideHeader,
            allow_multiple_schemas: allowMultipleSchemas,
            readonly: readOnly,
            disableLocalStorage: disableLocalStorage,
            allowMouseZoom: allowMouseZoom,
            menu: { 
              toolbar: { available: readOnly },
              minimap: { available: false },
              zoom: { available: false },
              settings: { available: false },
              save_workspace: { available: false },
              load_workspace: { available: false },
              export: { available: false },
              export_svg: { available: false },
              about: { available: false },
              customActions: readOnly ? [] : [{ id: 'send-to-codernic', label: 'Send to Codernic', icon: 'zap' }]
            },
          },
          onStateChange: (state: RootState) => {
            if (readOnly) return;
            if (schemaDebounceRef.current) {
              window.clearTimeout(schemaDebounceRef.current);
            }
            schemaDebounceRef.current = window.setTimeout(() => {
              dispatch(setErathosSchema(state));
            }, 500);
          }
        });
        appRef.current = app;

        // Expose test API for E2E testing
        console.log('[DEBUG] initializeStructuraWebview returned app:', Object.keys(app));
        console.log('[DEBUG] testApi present:', !!app.testApi);
        if (typeof window !== 'undefined' && app.testApi) {
          (window as any).__STRUCTURA_API__ = app.testApi;
          console.log('[DEBUG] Attached __STRUCTURA_API__ to window');
          
          // Auto fit to screen when loaded natively so that schemas don't center on main window instead of widget bounds.
          if (fitToScreen) {
            setTimeout(() => {
              if (typeof app.testApi?.fitToScreen === 'function') {
                app.testApi.fitToScreen(true);
              } else if (typeof app.fitToScreen === 'function') {
                app.fitToScreen();
              }
            }, 800);
          }
        }

        // Collapse schema panel by default
        setTimeout(() => {
          if (containerRef.current) {
            const collapseBtn = containerRef.current.querySelector('button[title="Collapse panel"]') as HTMLButtonElement;
            if (collapseBtn) {
              collapseBtn.click();
            }
          }
        }, 200);
      } catch (err) {
        console.error('[Erathos] Failed to initialize visual canvas:', err);
      }
    };

    initWebview();

    return () => {
      if (appRef.current && typeof appRef.current.disconnect === 'function') {
        appRef.current.disconnect().catch((e: any) => 
          console.error('[Erathos] Failed to disconnect canvas on cleanup:', e)
        );
      }
    };
  }, []);

  // Hook into custom actions emitted by structura toolbar
  useEffect(() => {
    const handleCustomAction = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.actionId === 'send-to-codernic') {
        // Send to Codernic logic: fetch current graph context and dispatch
        console.log('[ErathosCanvas] Send to Codernic clicked');
        
        // Ensure latest schema is synced and trigger VSCode message
        if (appRef.current && typeof appRef.current.getState === 'function') {
           const state = appRef.current.getState();
           dispatch(setErathosSchema(state));
        }
        
        // This message might be listened to by standard extension listeners if needed.
        let currentState = null;
        if (appRef.current && typeof appRef.current.getState === 'function') {
           currentState = appRef.current.getState();
        }
        dispatch(sendSchemaToCodernic({ schema: currentState }));
      }
    };
    window.addEventListener('structura-custom-action', handleCustomAction);
    return () => window.removeEventListener('structura-custom-action', handleCustomAction);
  }, []);

  // Hook into Structura's linter/validation warnings
  useEffect(() => {
    let lastWarningsStr = '';
    const handleWarnings = (e: Event) => {
      const customEvent = e as CustomEvent;
      const warnings = customEvent.detail?.warnings;
      if (Array.isArray(warnings)) {
        const warningsStr = JSON.stringify(warnings);
        if (warningsStr !== lastWarningsStr) {
          lastWarningsStr = warningsStr;
          if (warnings.length > 0) {
            const formatted = warnings.map((w: any) =>
              `[Structura Linter] ${w.rule || 'Warning'}: ${w.message}`
            );
            dispatch(appendSystemLogsBatch(formatted));
          }
        }
      }
    };
    window.addEventListener('vbs-validation-warnings', handleWarnings);
    return () => window.removeEventListener('vbs-validation-warnings', handleWarnings);
  }, [dispatch]);

  // Native Redux syncing now managed via Atomos MCP Server SSE (`/events`).
  // The `atomos-structura` library handles `node-progress` natively in `create-mcp-sync.ts`.

  // Hook into Galileus Snapshot to project file locks
  useEffect(() => {
    if (!containerRef.current || !galileusSnapshot) return;

    requestAnimationFrame(() => {
      // First, clean up all existing locks to prevent duplicates
      containerRef.current!.querySelectorAll('.erathos-galileus-lock').forEach(lock => lock.remove());

      const activeLocks = galileusSnapshot.locked_files || [];
      if (activeLocks.length === 0) return;

      const svgElements = containerRef.current!.querySelectorAll('g');
      
      activeLocks.forEach(lockPath => {
        // Simple fuzzy match: use filename from path to find a matching node name
        const filename = lockPath.split('/').pop()?.split('.')[0]?.toLowerCase() || '';
        
        let targetEl: SVGElement | null = null;
        for (let i = 0; i < svgElements.length; i++) {
          const el = svgElements[i];
          const textNodes = el.querySelectorAll('text');
          for (let j = 0; j < textNodes.length; j++) {
            const textContent = textNodes[j].textContent?.toLowerCase() || '';
            if (textContent.includes(filename) || filename.includes(textContent)) {
              targetEl = el as unknown as SVGElement;
              break;
            }
          }
          if (targetEl) break;
        }

        if (targetEl) {
          // Found a match! Let's project a lock icon
          const bbox = (targetEl as any).getBBox();
          const lockIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
          lockIcon.setAttribute('x', (bbox.x + bbox.width - 20).toString()); // Top right corner roughly
          lockIcon.setAttribute('y', (bbox.y + 20).toString());
          lockIcon.setAttribute('class', 'erathos-galileus-lock');
          lockIcon.setAttribute('font-size', '16');
          lockIcon.textContent = '🔒';
          lockIcon.style.filter = 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.8))';
          targetEl.appendChild(lockIcon);
        }
      });
    });
  }, [galileusSnapshot]);

  // SVG styling and badge projection hook for execution and class-diagram layout
  useEffect(() => {
    if (!containerRef.current) return;

    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;

      const svg = container.querySelector('svg');
      if (!svg) return;

      const groups = container.querySelectorAll('g');
      const schema = globalSchema || initialState;
      
      // Extract entities from the schema structure
      let entities: any[] = [];
      if (schema) {
        if (Array.isArray(schema.entities)) {
          entities = schema.entities;
        } else if (schema.workspace?.canvases) {
          const canvas = Object.values(schema.workspace.canvases)[0] as any;
          if (canvas?.schemas) {
            const activeSchema = canvas.schemas[canvas.active_schema_id] || Object.values(canvas.schemas)[0];
            entities = activeSchema?.entities || [];
          }
        }
      }

      groups.forEach((g) => {
        const textElements = g.querySelectorAll('text');
        let matchingEntity: any = null;
        textElements.forEach(t => {
          const val = t.textContent?.trim()?.toLowerCase();
          if (!val) return;
          const match = entities.find((e: any) => e.name?.toLowerCase() === val || e.id?.toLowerCase() === val);
          if (match) {
            matchingEntity = match;
          }
        });

        if (!matchingEntity) return;

        const rect = g.querySelector('rect');
        if (!rect) return;

        // Get status from properties or direct status field
        const statusProp = matchingEntity.properties?.find((p: any) => p.key === 'status');
        const status = statusProp ? statusProp.value : matchingEntity.status;

        if (appearance === 'execution') {
          if (status === 'Done' || status === 'completed' || status === 'success') {
            rect.setAttribute('stroke', '#10b981');
            rect.setAttribute('stroke-width', '2');
            rect.style.filter = 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.7))';

            g.querySelectorAll('.erathos-exec-badge-pulse, .erathos-exec-badge-failed').forEach(el => el.remove());

            if (!g.querySelector('.erathos-exec-badge-success')) {
              const bbox = (rect as any).getBBox();
              const checkmark = document.createElementNS("http://www.w3.org/2000/svg", "text");
              checkmark.setAttribute('x', (bbox.x + bbox.width - 25).toString());
              checkmark.setAttribute('y', (bbox.y + 25).toString());
              checkmark.setAttribute('class', 'erathos-exec-badge erathos-exec-badge-success');
              checkmark.setAttribute('font-size', '14');
              checkmark.setAttribute('fill', '#10b981');
              checkmark.textContent = '✅';
              g.appendChild(checkmark);
            }
          } else if (status === 'InProgress' || status === 'running') {
            rect.setAttribute('stroke', '#3b82f6');
            rect.setAttribute('stroke-width', '2');
            rect.style.filter = 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))';

            g.querySelectorAll('.erathos-exec-badge-success, .erathos-exec-badge-failed').forEach(el => el.remove());

            if (!g.querySelector('.erathos-exec-badge-pulse')) {
              const bbox = (rect as any).getBBox();
              const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
              dot.setAttribute('cx', (bbox.x + bbox.width - 20).toString());
              dot.setAttribute('cy', (bbox.y + 20).toString());
              dot.setAttribute('r', '5');
              dot.setAttribute('fill', '#3b82f6');
              dot.setAttribute('class', 'erathos-exec-badge erathos-exec-badge-pulse animate-pulse');
              g.appendChild(dot);
            }
          } else if (status === 'failed') {
            rect.setAttribute('stroke', '#ef4444');
            rect.setAttribute('stroke-width', '2');
            rect.style.filter = 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))';

            g.querySelectorAll('.erathos-exec-badge-success, .erathos-exec-badge-pulse').forEach(el => el.remove());

            if (!g.querySelector('.erathos-exec-badge-failed')) {
              const bbox = (rect as any).getBBox();
              const warning = document.createElementNS("http://www.w3.org/2000/svg", "text");
              warning.setAttribute('x', (bbox.x + bbox.width - 25).toString());
              warning.setAttribute('y', (bbox.y + 25).toString());
              warning.setAttribute('class', 'erathos-exec-badge erathos-exec-badge-failed');
              warning.setAttribute('font-size', '14');
              warning.setAttribute('fill', '#ef4444');
              warning.textContent = '❌';
              g.appendChild(warning);
            }
          } else {
            rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.07)');
            rect.setAttribute('stroke-width', '1');
            rect.style.filter = 'none';
            g.querySelectorAll('.erathos-exec-badge').forEach(el => el.remove());
          }
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [appearance, globalSchema, initialState]);

  if (isClosed) return null;

  return (
    <div data-testid={rootId} className={`w-full h-full flex flex-col overflow-hidden ${hideHeader ? 'bg-transparent' : 'bg-[var(--vbs-bg-canvas)]'}`}>
      {readOnly && !hideHeader && (
        <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-[var(--vscode-editor-inactiveSelectionBackground)]">
          <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            Erathos Macro View
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--vscode-descriptionForeground)] px-2 py-0.5 bg-[var(--vscode-editor-background)] rounded border border-zinc-800 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              Live Structura DAG
            </span>
            <button
              onClick={() => window.open(getErathosMcpUrl(), '_blank')}
              className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors mr-2"
              title="Open Erathos in a dedicated browser tab"
            >
              ↗ Open in new tab
            </button>
            <button
              onClick={() => {
                setIsClosed(true);
                if (onClose) onClose();
              }}
              className="text-[10px] text-[var(--vscode-descriptionForeground)] hover:text-white transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 w-full overflow-hidden relative" style={{ transform: 'translateZ(0)' }}>
        {!readOnly && portalTarget && createPortal(
          <>
            {isDirty && (
              <button
                onClick={() => {
                  const state = appRef.current?.getState();
                  if (state) {
                    let targetSessionId = currentSessionId;
                    if (!targetSessionId) {
                      targetSessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
                      dispatch({ type: 'sessions/setCurrentSessionId', payload: targetSessionId });
                      dispatch({ type: 'sessions/updateSessionStatus', payload: { id: targetSessionId, status: 'idle' } });
                    }
                    dispatch(setErathosSnapshot({ sessionId: targetSessionId, schema: state }));
                    dispatch(saveSchemaLocal({ schema: state }));
                    dispatch(sendSchemaToCodernic({ schema: state }));
                  }
                }}
                className="p-1 rounded text-emerald-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors animate-pulse"
                title="Save Changes"
              >
                <IconCheck data-testid={getTestId('icon-check')} size={14} />
              </button>
            )}
          </>,
          portalTarget
        )}
        <div
          id={canvasId}
          ref={containerRef}
          className="absolute inset-0"
          style={hideHeader ? { 
            '--vbs-bg-canvas': '#000000', 
            '--vbs-grid-primary-color': 'transparent', 
            '--vbs-grid-secondary-color': 'transparent',
            'background': '#000000'
          } as React.CSSProperties : undefined}
        />
      </div>
    </div>
  );
});
