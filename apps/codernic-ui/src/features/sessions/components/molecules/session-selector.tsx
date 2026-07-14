import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SessionMeta } from '../../../../entities/kernel/model/types';
import { ConfirmModal } from '@ai-agencee/ui';
import { Button } from '@ai-agencee/ui';
import { IconLoader, IconCheck, IconX, IconEdit, IconTrash, IconPlus } from '@ai-agencee/ui';
import { confirmUnsavedChanges } from '../../../dag/store/confirmUnsavedChanges';
import { useTestId } from '@ai-agencee/ui';

interface SessionSelectorProps {
  sessions: SessionMeta[];
  currentSessionId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  widgetId?: string;
  dataTestId?: string;
}

export function SessionSelector({ 
  dataTestId,
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
  compact = false,
  widgetId,
}: SessionSelectorProps) {
  
  const { rootId, getTestId } = useTestId('session-selector', dataTestId);
  const sortedSessions = [...sessions].sort((a, b) => b.last_updated - a.last_updated);
  const [deleteTarget, setDeleteTarget] = useState<SessionMeta | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (widgetId) {
      const target = document.getElementById(`widget-header-actions-${widgetId}`);
      if (target) setPortalTarget(target);
    }
  }, [widgetId]);

  const handleSelect = async (id: string) => {
    if (!(await confirmUnsavedChanges())) return;
    onSelect(id);
  };

  const handleNew = async () => {
    if (!(await confirmUnsavedChanges())) return;
    onNew();
  };

  const handleDeleteClick = async (session: SessionMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirmUnsavedChanges())) return;
    setDeleteTarget(session);
  };

  return (
    <div data-testid={rootId} className={`flex flex-col w-full h-full text-zinc-300 overflow-y-auto ${compact ? 'px-2 py-4' : 'px-4 py-8 md:p-8'}`}>
      {compact && portalTarget && createPortal(
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNew}
          className="text-zinc-500 hover:text-amber-500 transition-colors"
          title="New Session"
          data-testid={getTestId('icon-plus')}
        >
          <IconPlus size={14} />
        </Button>,
        document.getElementById(`widget-header-actions-${widgetId}`)!
      )}
      <div className={`w-full flex flex-col ${compact ? 'mt-0' : 'max-w-2xl mx-auto mt-4 md:mt-12'}`}>
        {!compact && (
          <h2 className={`font-semibold flex items-center justify-between text-xl md:text-2xl mb-6`}>
            <span>Continue a Session</span>
            <Button onClick={handleNew} variant="primary" size="sm" className="whitespace-nowrap ml-4" data-testid={getTestId('button-new')}>
              + New
            </Button>
          </h2>
        )}
        
        {sortedSessions.length === 0 ? (
          <div className="text-center p-12 bg-zinc-900/50 rounded-lg border border-zinc-800" data-testid={getTestId('empty-card')}>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No Active Sessions</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              Start a new session to begin orchestrating your AI agents, workflows, and analyses.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 w-full">
            {sortedSessions.map((session) => {
              const isActive = currentSessionId === session.id;
              const borderClass = isActive ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/80 hover:bg-zinc-800';
              return (
              <div
                key={session.id}
                data-testid={`session-item-${session.id}`}
                className={`flex justify-between ${borderClass} cursor-pointer transition-all group min-w-0 w-full ${compact ? 'p-2 flex-col items-start gap-1' : 'p-4 items-center'}`}
                onClick={() => handleSelect(session.id)}
              >
                {compact ? (
                  // COMPACT LAYOUT
                  <div className="flex flex-col w-full">
                    <div className="flex items-center w-full gap-2">
                      <div className="flex-shrink-0 flex items-center justify-center">
                        {session.status === 'running' && <IconLoader data-testid={`${rootId}-icon-loader`} className="animate-spin text-amber-500" style={{ width: '12px', height: '12px' }} title="Running" />}
                        {session.status === 'success' && <IconCheck data-testid={`${rootId}-icon-check`} className="text-zinc-400" style={{ width: '12px', height: '12px' }} title="Finished" />}
                        {session.status === 'error' && <IconX data-testid={`${rootId}-icon-x`} className="text-rose-500" style={{ width: '12px', height: '12px' }} title="Error" />}
                        {!session.status && <div style={{ width: '12px', height: '12px' }} />}
                      </div>
                      <span className="font-medium text-zinc-200 text-xs flex-1 truncate">
                        {session.name || session.id}
                      </span>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Future: handle edit name
                          }}
                          className="text-zinc-500 hover:text-amber-500"
                          title="Rename Session"
                          data-testid={`rename-session-${session.id}`}
                        >
                          <IconEdit data-testid={`${rootId}-icon-edit`} size={10} />
                        </Button>
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteClick(session, e)}
                            className="text-zinc-500 hover:text-rose-500"
                            title="Delete Session"
                            data-testid={`delete-session-${session.id}`}
                          >
                            <IconTrash data-testid={`${rootId}-icon-trash`} size={10} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-[9px] text-zinc-500 pl-5">
                      {/* Formatted date yyyy-MM-dd - HH:mm:ss */}
                      [{new Date(session.last_updated).toISOString().replace('T', ' - ').substring(0, 21)}]
                    </div>
                  </div>
                ) : (
                  // FULL LAYOUT
                  <>
                    <div className="flex flex-col overflow-hidden flex-1 min-w-0 mr-3">
                      <span className="font-medium text-zinc-200 truncate block w-full text-base">
                        {session.name || session.id}
                      </span>
                      <span className="text-xs text-zinc-500 mt-1 truncate block w-full">
                        Last updated: {new Date(session.last_updated).toLocaleString()}
                        {session.status === 'running' && (
                          <span className="ml-2 inline-flex items-center text-emerald-500" title="Inferring">
                            <IconLoader data-testid={`${rootId}-icon-loader-1`} className="animate-spin" style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Running
                          </span>
                        )}
                        {session.status === 'success' && (
                          <span className="ml-2 inline-flex items-center text-zinc-400" title="Finished">
                            <IconCheck data-testid={`${rootId}-icon-check-1`} style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Finished
                          </span>
                        )}
                        {session.status === 'error' && (
                          <span className="ml-2 inline-flex items-center text-rose-500" title="Error">
                            <IconX data-testid={`${rootId}-icon-x-1`} style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Error
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(session.id);
                        }}
                        variant="secondary"
                        size="sm"
                        data-testid={`resume-session-${session.id}`}
                      >
                        Resume →
                      </Button>
                      {onDelete && (
                        <Button
                          onClick={(e) => handleDeleteClick(session, e)}
                          variant="danger"
                          size="sm"
                          title="Delete Session"
                          className="px-2"
                          data-testid={`delete-session-full-${session.id}`}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
      {deleteTarget && onDelete && (
        <ConfirmModal data-testid={`${rootId}-confirm-modal`}
          title="Delete Session?"
          message={`Are you sure you want to delete "${deleteTarget.name || deleteTarget.id}"?`}
          onConfirm={() => {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
          confirmText="Delete"
        />
      )}
    </div>
  );
}
