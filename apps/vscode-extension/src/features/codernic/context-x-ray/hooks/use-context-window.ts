import { useCallback, useEffect, useState } from 'react';
import type { ContextWindowUI } from '../../../../shared/types/ai-agencee-types';

export interface UseContextWindowOptions {
  readonly updateInterval?: number;
  readonly onCritical?: () => void;
  readonly onWarning?: () => void;
}

/**
 * Hook to manage context window state and updates
 * Can be used in VS Code extensions via the context window manager
 */
export function useContextWindow(options: UseContextWindowOptions = {}): {
  contextUI: ContextWindowUI | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { updateInterval = 5000, onCritical, onWarning } = options;
  const [contextUI, setContextUI] = useState<ContextWindowUI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch context window data
  const fetchContextWindow = useCallback(async () => {
    try {
      setIsLoading(true);

      // This would typically be replaced with actual data fetching
      // from the ContextWindowManager or similar service
      // For now, this is a placeholder that can be integrated with
      // the actual Codernic execution context

      // Example of how it might be called:
      // const result = await orchestrator.getContextWindowStatus();
      // setContextUI(result);

      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Monitor for critical/warning states
  useEffect(() => {
    if (contextUI) {
      if (contextUI.usagePercent >= 95) {
        onCritical?.();
      } else if (contextUI.usagePercent >= 85) {
        onWarning?.();
      }
    }
  }, [contextUI, onCritical, onWarning]);

  // Set up polling interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContextWindow();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [fetchContextWindow, updateInterval]);

  return {
    contextUI,
    isLoading,
    error,
    refetch: fetchContextWindow,
  };
}

/**
 * Hook to format context window status for display
 */
export function useContextWindowFormatting(contextUI: ContextWindowUI | null): {
  statusText: string;
  severity: 'healthy' | 'moderate' | 'warning' | 'critical';
  color: string;
} {
  if (!contextUI) {
    return {
      statusText: 'Loading context...',
      severity: 'healthy',
      color: 'var(--vscode-descriptionForeground)',
    };
  }

  const { usagePercent } = contextUI;

  let severity: 'healthy' | 'moderate' | 'warning' | 'critical';
  let color: string;
  let statusText: string;

  if (usagePercent >= 95) {
    severity = 'critical';
    color = 'var(--vscode-errorForeground)';
    statusText = `Critical: ${Math.round(usagePercent)}% full`;
  } else if (usagePercent >= 85) {
    severity = 'warning';
    color = 'var(--vscode-list-warningForeground)';
    statusText = `Warning: ${Math.round(usagePercent)}% full`;
  } else if (usagePercent >= 50) {
    severity = 'moderate';
    color = 'var(--vscode-descriptionForeground)';
    statusText = `Moderate: ${Math.round(usagePercent)}% full`;
  } else {
    severity = 'healthy';
    color = 'var(--vscode-testing-iconPassed)';
    statusText = `Healthy: ${Math.round(usagePercent)}% full`;
  }

  return { statusText, severity, color };
}
