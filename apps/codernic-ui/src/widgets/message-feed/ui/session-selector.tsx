import type { SessionMeta } from '../../../entities/kernel';
import { Button } from '../../../shared';

interface SessionSelectorProps {
  sessions: SessionMeta[];
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
}

export function SessionSelector({
  sessions,
  onSelect,
  onNew,
  onDelete,
}: SessionSelectorProps) {
  // Sort sessions by last_updated descending
  const sortedSessions = [...sessions].sort((a, b) => b.last_updated - a.last_updated);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-zinc-300">
      <div className="max-w-2xl w-full">
        <h2 className="text-2xl font-semibold mb-6 flex items-center justify-between">
          <span>Continue a Session</span>
          <Button onClick={onNew} variant="primary" size="sm">
            + New Session
          </Button>
        </h2>
        
        {sortedSessions.length === 0 ? (
          <div className="text-center p-12 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <p className="text-zinc-500 mb-4">No recent sessions found.</p>
            <Button onClick={onNew} variant="secondary">
              Start a fresh workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg cursor-pointer transition-all group"
                onClick={() => onSelect(session.id)}
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-zinc-200 truncate">
                    {session.name || session.id}
                  </span>
                  <span className="text-xs text-zinc-500 mt-1">
                    Last updated: {new Date(session.last_updated).toLocaleString()}
                    {session.status === 'running' && (
                      <span className="ml-2 text-emerald-500 font-mono">● Running</span>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(session.id);
                    }}
                    variant="secondary"
                    size="xs"
                  >
                    Resume →
                  </Button>
                  {onDelete && (
                    <Button
                      onClick={(e) => {
                         e.stopPropagation();
                         onDelete(session.id);
                      }}
                      variant="danger"
                      size="xs"
                      title="Delete Session"
                      style={{ padding: '0 6px' }}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
