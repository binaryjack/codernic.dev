import { useEffect } from 'react';
import { useLayoutEngine } from '../context';

interface EphemeralSyncProps {
  id: string;
  widgetType?: string;
  isExpanded: boolean;
  isMaximized: boolean;
  vblockCtx?: {
    isExpanded: boolean;
    isFullscreenOpen?: boolean;
    setExpanded: (expanded: boolean) => void;
    toggleFullScreen?: () => void;
  };
}

export function useWidgetEphemeralSync({ id, widgetType, isExpanded, isMaximized, vblockCtx }: EphemeralSyncProps) {
  const { ephemeralWidgetStates, state } = useLayoutEngine();
  const widgetState = ephemeralWidgetStates?.[`${widgetType}_${id}`] || (widgetType ? ephemeralWidgetStates?.[widgetType] : undefined) || ephemeralWidgetStates?.[id];

  useEffect(() => {
    if (vblockCtx && widgetState && !state.isEditMode) {
      if (widgetState.isExpanded !== undefined && widgetState.isExpanded !== vblockCtx.isExpanded) {
        vblockCtx.setExpanded(widgetState.isExpanded);
      }
      if (widgetState.isMaximized !== undefined && widgetState.isMaximized !== vblockCtx.isFullscreenOpen && vblockCtx.toggleFullScreen) {
        vblockCtx.toggleFullScreen();
      }
    }
  }, [widgetState, state.isEditMode, vblockCtx]);

  return widgetState;
}
