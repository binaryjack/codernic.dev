import { useState, useRef, useEffect, memo } from 'react';
import { Accordion } from '../../../shared/ui/accordion';
import { useDispatch, useSelector } from 'react-redux';
import { sendIntent } from '../../../shared/store/intent';
import { selectSessions, selectCurrentSessionId, renameSession, removeSession } from '../../../features/sessions/store/sessions.slice';
import { selectAgents, selectDags, selectTechs } from '../../../entities/assets/model/assets-slice';
import { ConfirmModal } from '@ai-agencee/ui';
import { Button } from '@ai-agencee/ui';
import {
  IconAgent, IconDag, IconTech, IconPlus, IconBot, IconSettings
} from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';
import { AssetList } from './AssetList';
import { SessionsList } from './SessionsList';

export interface ISessionMeta {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

export interface ILeftPanelProps {
  onSettingsClick: () => void;
  onNewSession: () => void;
  dataTestId?: string;
}

export const LeftPanel = memo(({ onSettingsClick, onNewSession, dataTestId }: ILeftPanelProps) => {
  
  const { rootId, getTestId } = useTestId('left-panel', dataTestId);
  const dispatch = useDispatch();
  const sessions = Object.values(useSelector(selectSessions));
  console.log('LeftPanel sessions render:', sessions);
  const currentSessionId = useSelector(selectCurrentSessionId);
  const agents = Object.values(useSelector(selectAgents) || {});
  const dags = Object.values(useSelector(selectDags) || {});
  const techs = Object.values(useSelector(selectTechs) || {});

  const onSessionSelect = (id: string) => dispatch(sendIntent({ type: 'codernic:load-session', payload: { id } }));
  const onSessionRename = (id: string, newName: string) => dispatch(sendIntent({ type: 'codernic:rename-session', payload: { id, newName } }));
  const onAssetOpen = (type: string, id: string) => dispatch({ type: 'assets/fetchAssetRequest', payload: { type, id } });
  const onAssetDelete = (type: string, id: string) => dispatch({ type: 'assets/deleteAssetRequest', payload: { type, id } });
  const onAssetCreate = (type: string) => dispatch({ type: 'assets/createAssetRequest', payload: { type } });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'asset' | 'session'; assetType?: string; id: string; name?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleRenameSubmit = (id: string) => {
    if (editValue.trim() !== '') {
      dispatch(renameSession({ id, newName: editValue.trim() }));
      onSessionRename(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); inputRef.current?.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEditingId(null); }
  };



  return (
    <div 
      className="flex flex-col h-full bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800/50 relative overflow-hidden transition-all duration-300 shadow-2xl"
      data-testid={rootId}
    >
      {/* ── Scrollable Body ──
          This is the critical fix: flex:1 + overflow-y:auto + min-height:0
          Without min-height:0 the flex child ignores the parent's constraint and overflows.
      ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1.5 flex flex-col gap-0.5">
        {/* Agents */}
        <Accordion data-testid={getTestId('accordion-agents')}
          label={
            <div className="flex items-center gap-1.5 w-full">
              <IconBot size={11} />
              <span>Agents</span>
              {agents.length > 0 && (
                <span className="badge badge-amber text-[9px] py-[1px] px-[5px] ml-auto">{agents.length}</span>
              )}
            </div>
          }
          actions={
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onAssetCreate('agent'); }}
              title="New Agent"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={getTestId('agent-icon-plus')}
            >
              <IconPlus size={11} />
            </Button>
          }
          defaultOpen={false}
        >
          <AssetList data-testid={getTestId('asset-list-agents')}
            items={agents}
            icon={IconAgent}
            onOpen={(id) => onAssetOpen('agent', id)}
            onDelete={(id, name) => setDeleteTarget({ type: 'asset', assetType: 'agent', id, name })}
          />
        </Accordion>

        {/* DAGs */}
        <Accordion data-testid={getTestId('accordion-dags')}
          label={
            <div className="flex items-center gap-1.5 w-full">
              <IconDag size={11} />
              <span>DAGs</span>
              {dags.length > 0 && (
                <span className="badge badge-amber text-[9px] py-[1px] px-[5px] ml-auto">{dags.length}</span>
              )}
            </div>
          }
          actions={
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onAssetCreate('dag'); }}
              title="New DAG"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={getTestId('dag-icon-plus')}
            >
              <IconPlus size={11} />
            </Button>
          }
          defaultOpen={false}
        >
          <AssetList data-testid={getTestId('asset-list-dags')}
            items={dags}
            icon={IconDag}
            onOpen={(id) => onAssetOpen('dag', id)}
            onDelete={(id, name) => setDeleteTarget({ type: 'asset', assetType: 'dag', id, name })}
          />
        </Accordion>

        {/* Technologies */}
        <Accordion data-testid={getTestId('accordion-techs')}
          label={
            <div className="flex items-center gap-1.5 w-full">
              <IconTech size={11} />
              <span>Technologies</span>
              {techs.length > 0 && (
                <span className="badge badge-amber text-[9px] py-[1px] px-[5px] ml-auto">{techs.length}</span>
              )}
            </div>
          }
          actions={
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onAssetCreate('technology'); }}
              title="New Technology"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={getTestId('tech-icon-plus')}
            >
              <IconPlus size={11} />
            </Button>
          }
          defaultOpen={false}
        >
          <AssetList data-testid={getTestId('asset-list-techs')}
            items={techs}
            icon={IconTech}
            onOpen={(id) => onAssetOpen('technology', id)}
            onDelete={(id, name) => setDeleteTarget({ type: 'asset', assetType: 'technology', id, name })}
          />
        </Accordion>
        <SessionsList dataTestId={rootId}
          sessions={sessions}
          currentSessionId={currentSessionId}
          editingId={editingId}
          editValue={editValue}
          setEditValue={setEditValue}
          setEditingId={setEditingId}
          onSessionSelect={onSessionSelect}
          onNewSession={onNewSession}
          handleRenameSubmit={handleRenameSubmit}
          handleKeyDown={handleKeyDown}
          inputRef={inputRef}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setDeleteTarget={setDeleteTarget as any}
        />
      </div>

      {/* ── Modals ── */}
      <div className="py-1.5 px-2 border-t border-[var(--border)] flex-shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start text-xs text-zinc-400 hover:text-zinc-200"
          onClick={(e: React.MouseEvent) => { e.currentTarget.blur(); onSettingsClick(); }}
          data-testid={getTestId('settings-button')}
        >
          <IconSettings size={12} className="mr-2 opacity-70" />
          <span>Settings</span>
        </Button>
      </div>

      {/* ── Confirm modal ── */}
      {deleteTarget && (
        <ConfirmModal data-testid={`${rootId}-confirm-modal`}
          title={`Delete ${deleteTarget.type === 'session' ? 'Session' : deleteTarget.assetType}?`}
          message={`Are you sure you want to delete "${deleteTarget.name || deleteTarget.id}"? This action cannot be undone.`}
          onConfirm={() => {
            if (deleteTarget.type === 'asset') {
              onAssetDelete(deleteTarget.assetType!, deleteTarget.id);
            } else {
              dispatch(sendIntent({ type: 'codernic:delete-session', payload: { id: deleteTarget.id } }));
              dispatch(removeSession(deleteTarget.id));
            }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
          confirmText="Delete"
        />
      )}
    </div>
  );
});
