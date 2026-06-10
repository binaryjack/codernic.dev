import { useState, useRef, useEffect, memo } from 'react';
import { Accordion } from '../../../shared/ui/accordion';

import { useDispatch, useSelector } from 'react-redux';
import { sendIntent, selectSessions, selectCurrentSessionId } from '../../../entities/kernel';
import { selectAgents, selectDags, selectTechs } from '../../../entities/assets/model/assets-slice';
import { vscode } from '../../../shared';

export interface ISessionMeta {
  id: string;
  name: string;
  status: 'idle' | 'running';
}

export interface ILeftPanelProps {
  onSettingsClick: () => void;
}

export const LeftPanel = memo(({ onSettingsClick }: ILeftPanelProps) => {
  const dispatch = useDispatch();
  const sessions = useSelector(selectSessions);
  const currentSessionId = useSelector(selectCurrentSessionId);
  const agents = useSelector(selectAgents) || [];
  const dags = useSelector(selectDags) || [];
  const techs = useSelector(selectTechs) || [];

  const onSessionSelect = (id: string) => dispatch(sendIntent({ type: 'codernic:load-session', payload: { id } }));
  const onSessionRename = (id: string, newName: string) => dispatch(sendIntent({ type: 'codernic:rename-session', payload: { id, newName } }));
  const onAssetOpen = (type: string, id: string) => vscode.postMessage({ type: 'codernic:open-file', payload: { type, id } });
  const onAssetDelete = (type: string, id: string) => vscode.postMessage({ type: 'codernic:delete-asset', payload: { type, id } });
  const onAssetCreate = (type: string) => vscode.postMessage({ type: 'codernic:create-asset', payload: { type } });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleRenameSubmit = (id: string) => {
    if (editValue.trim() !== '') {
      onSessionRename(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full text-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#27272a] flex-shrink-0">
        <div className="font-bold text-[var(--vscode-sideBarTitle-foreground)] uppercase text-xs tracking-wider mb-1">
          Workspace
        </div>
        <div className="text-[var(--vscode-foreground)] truncate">
          AI Agencee Project
        </div>
      </div>

      {/* Body: Accordions and Session List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        
        <Accordion 
          label={
            <div className="flex items-center justify-between w-full pr-2">
              <span>🤖 Agents</span>
              <button onClick={(e) => { e.stopPropagation(); onAssetCreate && onAssetCreate('agent'); }} className="opacity-0 group-hover:opacity-100 hover:text-cyan-400" title="New Agent">+</button>
            </div>
          } 
          defaultOpen={false}
        >
          {agents.length === 0 ? (
            <div className="text-[var(--vscode-descriptionForeground)] text-xs italic px-2">No agents found</div>
          ) : (
            <ul className="space-y-0.5">
              {agents.map((a) => (
                <li key={a.id} className="group/item flex items-center justify-between hover:text-[var(--vscode-foreground)] text-[var(--vscode-descriptionForeground)] transition-colors px-2 py-1 cursor-default rounded">
                  <span className="truncate cursor-pointer flex-1" onClick={() => onAssetOpen && onAssetOpen('agent', a.id)}>{a.name}</span>
                  <div className="opacity-0 group-hover/item:opacity-100 flex items-center space-x-1">
                    <button onClick={() => onAssetDelete && onAssetDelete('agent', a.id)} className="hover:text-red-400" title="Delete">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Accordion>

        <Accordion 
          label={
            <div className="flex items-center justify-between w-full pr-2">
              <span>🔄 DAGs</span>
              <button onClick={(e) => { e.stopPropagation(); onAssetCreate && onAssetCreate('dag'); }} className="opacity-0 group-hover:opacity-100 hover:text-cyan-400" title="New DAG">+</button>
            </div>
          } 
          defaultOpen={false}
        >
          {dags.length === 0 ? (
            <div className="text-[var(--vscode-descriptionForeground)] text-xs italic px-2">No DAGs found</div>
          ) : (
            <ul className="space-y-0.5">
              {dags.map((d) => (
                <li key={d.id} className="group/item flex items-center justify-between hover:text-[var(--vscode-foreground)] text-[var(--vscode-descriptionForeground)] transition-colors px-2 py-1 cursor-default rounded">
                  <span className="truncate cursor-pointer flex-1" onClick={() => onAssetOpen && onAssetOpen('dag', d.id)}>{d.name}</span>
                  <div className="opacity-0 group-hover/item:opacity-100 flex items-center space-x-1">
                    <button onClick={() => onAssetDelete && onAssetDelete('dag', d.id)} className="hover:text-red-400" title="Delete">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Accordion>

        <Accordion 
          label={
            <div className="flex items-center justify-between w-full pr-2">
              <span>⚙️ Technologies</span>
              <button onClick={(e) => { e.stopPropagation(); onAssetCreate && onAssetCreate('technology'); }} className="opacity-0 group-hover:opacity-100 hover:text-cyan-400" title="New Technology">+</button>
            </div>
          } 
          defaultOpen={false}
        >
          {techs.length === 0 ? (
            <div className="text-[var(--vscode-descriptionForeground)] text-xs italic px-2">No technologies found</div>
          ) : (
            <ul className="space-y-0.5">
              {techs.map((t) => (
                <li key={t.id} className="group/item flex items-center justify-between hover:text-[var(--vscode-foreground)] text-[var(--vscode-descriptionForeground)] transition-colors px-2 py-1 cursor-default rounded">
                  <span className="truncate cursor-pointer flex-1" onClick={() => onAssetOpen && onAssetOpen('technology', t.id)}>{t.name}</span>
                  <div className="opacity-0 group-hover/item:opacity-100 flex items-center space-x-1">
                    <button onClick={() => onAssetDelete && onAssetDelete('technology', t.id)} className="hover:text-red-400" title="Delete">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Accordion>

        <div className="mt-4 mb-2 pt-2 border-t border-[#27272a]"></div>

        <div className="px-2 py-1 text-xs font-semibold text-[var(--vscode-sideBarSectionHeader-foreground)] uppercase tracking-wider mb-1">
          Sessions
        </div>
        <ul className="space-y-0.5 px-2">
          {sessions.length === 0 ? (
            <li className="px-2 py-1 text-xs text-[var(--vscode-descriptionForeground)] italic">
              No sessions found.
            </li>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <li
                  key={session.id}
                  onClick={() => onSessionSelect(session.id)}
                  className={`flex items-center px-2 py-1 cursor-pointer rounded text-xs select-none group ${
                    isActive
                      ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]'
                      : 'hover:bg-[var(--vscode-list-hoverBackground)] text-[var(--vscode-list-hoverForeground)]'
                  }`}
                  onDoubleClick={() => {
                    setEditingId(session.id);
                    setEditValue(session.name);
                  }}
                >
                  {editingId === session.id ? (
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(session.id)}
                      onKeyDown={(e) => handleKeyDown(e)}
                      className="flex-1 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-focusBorder)] outline-none px-1 h-5 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="truncate flex-1">{session.name}</span>
                      <button 
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 mx-1 text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)] transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(session.id);
                          setEditValue(session.name);
                        }}
                        title="Rename Session"
                      >
                        ✏️
                      </button>
                      {session.status === 'running' && (
                        <span className="flex-shrink-0 ml-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Inference or DAG running" />
                      )}
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-[#27272a] flex-shrink-0">
        <button
          className="w-full flex items-center px-2 py-1.5 text-xs rounded hover:bg-[var(--vscode-list-hoverBackground)] text-[var(--vscode-foreground)] transition-colors"
          onClick={onSettingsClick}
        >
          <span className="mr-2">⚙️</span> Settings
        </button>
      </div>
    </div>
  );
});
