import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import { layoutReducer, defaultInitialState, type LayoutAction } from './store/reducer';
import type { LayoutState, BlockState } from './types';
import { useTestId } from '../hooks/useTestId';

export interface ActorStatusState {
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
}

interface LayoutContextValue {
  state: LayoutState;
  dispatch: React.Dispatch<LayoutAction>;
  renderWidget?: (block: BlockState) => ReactNode;
  actorStatuses?: Record<string, ActorStatusState>;
  getRequiredActors?: (widgetType: string) => string[];
  ephemeralWidgetStates?: Record<string, any>;
  sandboxMode?: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export interface LayoutProviderProps {
  children: ReactNode;
  initialState?: LayoutState;
  renderWidget?: (block: BlockState) => ReactNode;
  actorStatuses?: Record<string, ActorStatusState>;
  getRequiredActors?: (widgetType: string) => string[];
  ephemeralWidgetStates?: Record<string, any>;
  sandboxMode?: boolean;
  dataTestId?: string;
}

export function LayoutProvider({ dataTestId, children, initialState, renderWidget, actorStatuses, getRequiredActors, ephemeralWidgetStates, sandboxMode }: LayoutProviderProps) {
  
  const { rootId, getTestId } = useTestId('layout-provider', dataTestId);
const [state, dispatch] = useReducer(layoutReducer, initialState || defaultInitialState);

  return (
    <LayoutContext.Provider data-testid={`${rootId}-layout-context.provider`} value={{ state, dispatch, renderWidget, actorStatuses, getRequiredActors, ephemeralWidgetStates, sandboxMode }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutEngine() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutEngine must be used within a LayoutProvider');
  }
  return context;
}
