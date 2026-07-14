import {
  LayoutProvider,
  VBlock,
  type BlockState,
} from '@ai-agencee/ui/layout-engine';
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store';
import { useIntrospection } from '../../../../../../../packages/ui/src/introspection/hooks/useIntrospection';
import { LayoutControls } from '../organisms/LayoutControls';
import { LayoutToolbar } from '../organisms/LayoutToolbar';
import { WidgetHub } from '../organisms/WidgetHub';
import { useShortcutsManager } from '../../../../shared/hooks/useShortcutsManager';
import { MenuBar } from '../../../../widgets/menu-bar';
import { WIDGET_REGISTRY } from '../../model/widget-registry';
import type { ActorState, ActorType } from '../../../system/store/system.slice';
import { selectSandboxMode } from '../../../../entities/app/model/app-slice';

import { useLayoutInitialization } from '../../hooks/useLayoutInitialization';
import { useLayoutDataSync } from '../../hooks/useLayoutDataSync';
import { useSessionManager } from '../../hooks/useSessionManager';

import { LayoutStorageSync } from '../molecules/LayoutStorageSync';
import { renderWidget } from '../molecules/WidgetSuspenseBoundary';
import { RecentSessionsModal } from '../organisms/RecentSessionsModal';
import { useTestId } from '@ai-agencee/ui';

export function LayoutEngine() {
  const { rootId, getTestId } = useTestId('layout-engine', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
  
  // Custom Hooks
  const { savedLayouts, setSavedLayouts, activeLayoutName, setActiveLayoutName, isLoaded, handleSelectLayout } = useLayoutDataSync();
  const { initialBlocks } = useLayoutInitialization(activeLayoutName, savedLayouts);
  const sessionManager = useSessionManager();
  
  // Redux Selectors
  const actorStatuses = useSelector((state: RootState) => state.system.actors);
  const sandboxMode = useSelector(selectSandboxMode);
  const uiCommands = useSelector((state: RootState) => state.uiCommands?.commands || {});

  useShortcutsManager(handleSelectLayout);

  React.useEffect(() => {
    const handleSwitchLayoutEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ layout: string; forceDefault?: boolean }>;
      if (customEvent.detail && customEvent.detail.layout) {
        handleSelectLayout(customEvent.detail.layout, customEvent.detail.forceDefault);
      }
    };
    window.addEventListener('codernic:switch-layout', handleSwitchLayoutEvent);
    return () => window.removeEventListener('codernic:switch-layout', handleSwitchLayoutEvent);
  }, [handleSelectLayout]);

  useIntrospection({
    id: 'layout-engine',
    type: 'layout',
    methods: {
      switchLayout: (layoutName: string, forceDefault: boolean = false) => {
        handleSelectLayout(layoutName, forceDefault);
      }
    }
  });

  const getRequiredActors = React.useCallback((widgetType: string) => {
    const config = WIDGET_REGISTRY[widgetType];
    return config ? config.requiredActors : [];
  }, []);

  const layoutState = React.useMemo(
    () => ({
      isEditMode: false,
      rootId: 'root',
      blocks: initialBlocks,
    }),
    [initialBlocks],
  );

  if (!isLoaded) {
    return (
      <div className="flex w-full h-full items-center justify-center bg-black text-zinc-500 text-xs tracking-widest uppercase">
        Loading Workspace...
      </div>
    );
  }

  const layoutNames = Object.keys(savedLayouts);

  return (
    <LayoutProvider data-testid={getTestId('layout-provider')}
      key={activeLayoutName || 'default'}
      renderWidget={renderWidget}
      initialState={layoutState}
      actorStatuses={actorStatuses as Record<ActorType, ActorState>}
      getRequiredActors={getRequiredActors}
      ephemeralWidgetStates={uiCommands}
      sandboxMode={sandboxMode}
    >
      <LayoutStorageSync activeLayoutName={activeLayoutName} />
      <div className="flex flex-col w-full h-full bg-black overflow-hidden relative" data-testid="layout-engine">
        <div className="relative z-[9999] flex-shrink-0">
          <MenuBar data-testid={getTestId('menu-bar')}
            layouts={layoutNames}
            onSelectLayout={handleSelectLayout}
            onNewSession={sessionManager.handleNewSession}
            onRecentSessions={sessionManager.handleRecentSessions}
          >
            <LayoutControls data-testid={getTestId('layout-controls')}
              savedLayouts={savedLayouts}
              setSavedLayouts={setSavedLayouts}
              activeLayoutName={activeLayoutName}
              setActiveLayoutName={setActiveLayoutName}
            />
          </MenuBar>
        </div>
        <div
          className="flex flex-1 w-full min-h-0 relative"
          id="fullscreen-portal-root"
          data-testid="widget-container"
        >
          <WidgetHub data-testid={getTestId('widget-hub')} />
          <div className="flex-1 p-2 h-full relative z-0 flex flex-col">
            <LayoutToolbar data-testid={getTestId('layout-toolbar')} activeLayoutName={activeLayoutName} />
            <div className="flex-1 min-h-0 pt-2">
              <VBlock data-testid={getTestId('vblock')} id="root" />
            </div>
          </div>
        </div>
      </div>

      <RecentSessionsModal 
        isOpen={sessionManager.isRecentSessionsOpen}
        onClose={() => sessionManager.setIsRecentSessionsOpen(false)}
        sessions={sessionManager.sessions}
        currentSessionId={sessionManager.currentSessionId}
        onSelect={sessionManager.handleLoadSession}
        onNew={sessionManager.handleNewSession}
        onDelete={sessionManager.handleDeleteSession}
      />
    </LayoutProvider>
  );
}
