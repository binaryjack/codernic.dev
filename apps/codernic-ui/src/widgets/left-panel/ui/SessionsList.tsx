import React from 'react';
import { Button } from '@ai-agencee/ui';
import { IconLoader, IconCheck, IconX, IconSession, IconEdit, IconPlus } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';
import type { ISessionMeta } from './LeftPanel';

export interface SessionsListProps {
  sessions: ISessionMeta[];
  currentSessionId: string;
  editingId: string | null;
  editValue: string;
  setEditValue: (val: string) => void;
  setEditingId: (id: string | null) => void;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  handleRenameSubmit: (id: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setDeleteTarget: (target: { type: 'asset' | 'session'; assetType?: string; id: string; name?: string } | null) => void;
  dataTestId?: string;
}

export function SessionsList({ 
  dataTestId,
  sessions,
  currentSessionId,
  editingId,
  editValue,
  setEditValue,
  setEditingId,
  onSessionSelect,
  onNewSession,
  handleRenameSubmit,
  handleKeyDown,
  inputRef,
  setDeleteTarget
}: SessionsListProps) {
  
  const { rootId, getTestId } = useTestId('sessions-list', dataTestId);

  return (
    <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex-shrink-0">
      <div className="section-label pl-1 mb-1.5 flex justify-between items-center">
        <span>Sessions</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewSession}
          title="New Session"
          data-testid={getTestId('icon-plus')}
        >
          <IconPlus size={11} />
        </Button>
      </div>

      <ul className="list-none px-0.5 m-0 flex flex-col gap-px">
        {sessions.length === 0 ? (
          <li className="py-1 px-2 text-[11px] text-[var(--text-muted)] italic">
            No sessions found.
          </li>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            return (
              <li
                key={session.id}
                data-testid={`session-item-${session.id}`}
                onClick={() => onSessionSelect(session.id)}
                onDoubleClick={() => { setEditingId(session.id); setEditValue(session.name); }}
                className={`group/sess relative flex items-center gap-1.5 py-1 px-2 pl-6 cursor-pointer rounded-[var(--radius-sm)] text-[11px] select-none transition-all duration-100 flex-shrink-0 border ${
                  isActive
                    ? 'bg-amber-500/10 text-[var(--amber-400)] border-amber-500/20'
                    : 'bg-transparent text-[var(--text-body)] border-transparent hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {/* Session status icon */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex">
                  {session.status === 'running' && <IconLoader data-testid={`${rootId}-icon-loader`} className="animate-spin text-[var(--status-running)]" title="Running" />}
                  {session.status === 'success' && <IconCheck data-testid={`${rootId}-icon-check`} className="text-[var(--status-success)]" title="Success" />}
                  {session.status === 'error' && <IconX data-testid={`${rootId}-icon-x`} className="text-[var(--status-error)]" title="Error" />}
                  {session.status === 'idle' && <IconSession data-testid={`${rootId}-icon-session`} size={11} className={isActive ? 'text-[var(--amber-400)]' : 'text-[var(--text-muted)]'} />}
                </div>

                {editingId === session.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(session.id)}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-active)] outline-none py-px px-1 h-[18px] text-[11px] rounded-[var(--radius-xs)]"
                  />
                ) : (
                  <>
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {session.name}
                    </span>
                    {/* Action buttons */}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Rename"
                      className={`opacity-0 group-hover/sess:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 ${isActive ? 'opacity-100' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setEditingId(session.id); setEditValue(session.name); }}
                      data-testid={`rename-session-${session.id}`}
                    >
                      <IconEdit data-testid={`${rootId}-icon-edit`} size={10} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className={`opacity-0 group-hover/sess:opacity-100 transition-opacity text-red-500/70 hover:text-red-400 ${isActive ? 'opacity-100' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'session', id: session.id, name: session.name }); }}
                      data-testid={`delete-session-${session.id}`}
                    >
                      <IconX data-testid={`${rootId}-icon-x-1`} size={10} />
                    </Button>
                  </>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
