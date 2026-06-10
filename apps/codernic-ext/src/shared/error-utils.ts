import * as vscode from 'vscode';

type Msg = { type: string; payload?: unknown };

// ─── Notification level ───────────────────────────────────────────────────────

type NotifyLevel = 'info' | 'warn' | 'error';
type NotifySetting = 'all' | 'errors-only' | 'silent';

function notifySetting(): NotifySetting {
  return vscode.workspace.getConfiguration('ai-agencee').get<NotifySetting>('notifications', 'all');
}

/** Flash the VS Code status bar with a temporary message (auto-clears). */
function flashStatusBar(level: NotifyLevel, message: string): void {
  const icon = level === 'error' ? '$(error)' : level === 'warn' ? '$(warning)' : '$(info)';
  const durationMs = level === 'error' ? 8000 : 5000;
  vscode.window.setStatusBarMessage(`${icon} AI Agencee: ${message}`, durationMs);
}

/**
 * Show a toast or status-bar flash depending on the `ai-agencee.notifications` setting.
 * - `"all"`:          toast for all levels (default)
 * - `"errors-only"`:  toast for errors only; status-bar flash for info/warn
 * - `"silent"`:       no toasts; errors still flash the status bar
 */
export function notify(level: NotifyLevel, message: string): void {
  const s = notifySetting();
  const showToast = s === 'all' || (s === 'errors-only' && level === 'error');

  if (showToast) {
    if (level === 'info') void vscode.window.showInformationMessage(message);
    else if (level === 'warn') void vscode.window.showWarningMessage(message);
    else void vscode.window.showErrorMessage(message);
    return;
  }

  // Fallback: flash status bar for errors and (on errors-only) warnings
  if (level === 'error' || (s === 'errors-only' && level === 'warn')) {
    flashStatusBar(level, message);
  }
}

/**
 * Show a prompt with action buttons, respecting the notifications setting.
 * When suppressed, flashes the status bar and returns `undefined`.
 */
export async function prompt(
  level: NotifyLevel,
  message: string,
  ...actions: string[]
): Promise<string | undefined> {
  const s = notifySetting();
  const showToast = s === 'all' || (s === 'errors-only' && level === 'error');

  if (!showToast) {
    if (level === 'error' || (s === 'errors-only' && level === 'warn')) {
      flashStatusBar(level, message);
    }
    return undefined;
  }

  if (level === 'info') return vscode.window.showInformationMessage(message, ...actions);
  else if (level === 'warn') return vscode.window.showWarningMessage(message, ...actions);
  else return vscode.window.showErrorMessage(message, ...actions);
}

// ─── Command / activation helpers ────────────────────────────────────────────

/**
 * Wraps the activate() body. On failure: logs to the Output channel,
 * reveals it, and shows a notification. The extension enters a degraded-but-visible
 * state instead of silently crashing.
 */
export const runActivate = async (
  channel: vscode.OutputChannel,
  fn: () => Promise<void>,
): Promise<void> => {
  try {
    await fn();
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    channel.appendLine(`[fatal] activation failed: ${text}`);
    channel.show();
    notify(
      'error',
      `AI Agencee failed to activate: ${text}. Check Output › AI Agencee for details.`,
    );
  }
};

/**
 * Wraps an async VS Code command handler.
 * On failure: logs to channel + shows showErrorMessage.
 */
export const wrapCmd =
  (channel: vscode.OutputChannel, fn: (...args: unknown[]) => Promise<void>) =>
  async (...args: unknown[]): Promise<void> => {
    try {
      await fn(...args);
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      channel.appendLine(`[error] ${text}`);
      notify('error', `AI Agencee: ${text}`);
    }
  };

/**
 * Wraps an async webview onDidReceiveMessage handler.
 * Errors are relayed back to the webview as { type: 'ext:error' } instead of
 * propagating to the extension host.
 */
export const wrapMsgHandler =
  (channel: vscode.OutputChannel, reply: (r: Msg) => void, fn: () => Promise<void>) =>
  async (): Promise<void> => {
    try {
      await fn();
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      channel.appendLine(`[error] ${text}`);
      reply({ type: 'ext:error', payload: { message: text } });
    }
  };
