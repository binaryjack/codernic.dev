import React from 'react';
import { IconX } from '@ai-agencee/ui';
import { SessionSelector } from '../../../../features/sessions/components/molecules/session-selector';
import type { Session } from '../../../../features/sessions/store/sessions.slice';

interface RecentSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  currentId?: string;
}

export function RecentSessionsModal({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
  currentId = 'layout-engine'
}: RecentSessionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[80vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-zinc-200">Recent Sessions</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <IconX data-testid={`${currentId}-icon-x`} size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <SessionSelector data-testid={`${currentId}-session-selector`}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelect={onSelect}
            onNew={onNew}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
