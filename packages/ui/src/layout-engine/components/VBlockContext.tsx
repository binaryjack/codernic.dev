import { createContext, useContext } from 'react';
import type { VBlockBehavior } from '../types';

export interface VBlockContextType {
  behavior: VBlockBehavior;
  isExpanded: boolean;
  allowFullScreen?: boolean;
  hideFrame?: boolean;
  isFullscreenOpen?: boolean;
  headerPortalRef?: React.RefObject<HTMLDivElement | null>;
  toggleExpand: () => void;
  toggleFullScreen?: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const VBlockContext = createContext<VBlockContextType | null>(null);

export function useVBlockContext() {
  const context = useContext(VBlockContext);
  if (!context) {
    return {
      behavior: 'none' as VBlockBehavior,
      isExpanded: true,
      toggleExpand: () => {},
      setExpanded: () => {}
    };
  }
  return context;
}
