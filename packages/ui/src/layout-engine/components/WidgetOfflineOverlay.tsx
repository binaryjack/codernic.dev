import React from 'react';
import { IconAlertTriangle } from '../icons';
import { useTestId } from '../../hooks/useTestId';

export interface ActorStatusInfo {
  actor: string;
  status: 'disconnected' | 'error';
  message?: string;
}

interface WidgetOfflineOverlayProps {
  title: string;
  unavailableActors: ActorStatusInfo[];
  dataTestId?: string;
}

export function WidgetOfflineOverlay({ dataTestId, title, unavailableActors }: WidgetOfflineOverlayProps) {
  
  const { rootId, getTestId } = useTestId('widget-offline-overlay', dataTestId);
return (
    <div className="absolute inset-0 z-40 bg-[#131316]/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900/90 border border-amber-500/30 rounded-lg p-5 max-w-sm text-center shadow-2xl flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
          <IconAlertTriangle data-testid={getTestId('icon-alert-triangle')} size={20} className="text-amber-500 opacity-80" />
        </div>
        <div>
          <h3 className="text-zinc-200 font-medium text-sm mb-1">{title} Unavailable</h3>
          <div className="text-xs text-zinc-400 space-y-1">
            {unavailableActors.map((a) => (
              <p key={a.actor}>
                Waiting for <span className="text-amber-500 font-semibold">{a.actor}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
