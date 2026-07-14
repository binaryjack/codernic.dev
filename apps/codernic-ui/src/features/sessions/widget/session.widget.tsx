import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { SessionSelector } from '../../../features/sessions/components/molecules/session-selector';
import { sendIntent } from '../../../shared/store/intent';
import type { RootState } from '../../../store';
import { useTestId } from '@ai-agencee/ui';

export function SessionWidget({ dataTestId, id }: { id?: string; dataTestId?: string; }) {
  
  const { rootId, getTestId } = useTestId('session-widget', dataTestId);
const dispatch = useDispatch();
  const sessionsMap = useSelector((state: RootState) => state.sessions.sessions);
  const sessions = Object.values(sessionsMap || {});
  const currentSessionId = useSelector((state: RootState) => state.sessions.currentSessionId);

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b]" data-testid={getTestId('root')}>
      <SessionSelector data-testid={getTestId('session-selector')}
        compact
        widgetId={id}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelect={(id) => {
          dispatch(sendIntent({ type: 'codernic:load-session', payload: { id } }));
        }}
        onNew={() => {
          const newSessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
          dispatch({ type: 'sessions/setCurrentSessionId', payload: newSessionId });
          dispatch({ type: 'sessions/updateSessionStatus', payload: { id: newSessionId, status: 'idle' } });
          dispatch({ type: 'chat/setMessages', payload: [] });
        }}
        onDelete={(id) => {
          dispatch(sendIntent({ type: 'codernic:delete-session', payload: { id } }));
          dispatch({ type: 'sessions/removeSession', payload: id });
        }}
      />
    </div>
  );
}
