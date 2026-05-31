import * as vscode from 'vscode';
import { buildWebviewHtml } from '../../../shared/build-webview-html';
import { notify } from '../../../shared/error-utils';

export type EditorPanelOpts<E> = {
  viewType: string;
  titlePrefix: string;
  panel: string;
  openMsgType: string;
  saveMsgType: string;
  validate: (v: unknown) => v is E;
  /** Optional: extra messages to handle beyond ready / save / openMsg */
  handleExtra?: (
    msg: { type: string; payload?: unknown },
    panel: vscode.WebviewPanel,
  ) => Promise<boolean>;
};

export type EditorPanelInstance<E> = {
  open(entry: E): void;
};

type InternalState<E> = {
  _panel: vscode.WebviewPanel | null;
  _pending: unknown | null;
  ctx: vscode.ExtensionContext;
  _onSave: (entry: E) => Promise<void>;
  opts: EditorPanelOpts<E>;
};

export const createEditorPanel = function <E extends { name: string }>(
  ctx: vscode.ExtensionContext,
  onSave: (entry: E) => Promise<void>,
  opts: EditorPanelOpts<E>,
): EditorPanelInstance<E> {
  const state: InternalState<E> = {
    _panel: null,
    _pending: null,
    ctx,
    _onSave: onSave,
    opts,
  };

  const open = (entry: E): void => {
    const pendingMsg = { type: opts.openMsgType, payload: entry };
    state._pending = pendingMsg;

    if (state._panel) {
      state._panel.reveal(vscode.ViewColumn.One);
      state._panel.title = `${opts.titlePrefix}: ${entry.name}`;
      state._panel.webview.postMessage(pendingMsg);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      opts.viewType,
      `${opts.titlePrefix}: ${entry.name}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'dist', 'webview')],
      },
    );

    state._panel = panel;
    panel.webview.html = buildWebviewHtml(panel.webview, ctx.extensionUri, {
      title: `AI Agencee ${opts.titlePrefix} Editor`,
      panel: opts.panel,
    });

    panel.webview.onDidReceiveMessage(async (msg: { type: string; payload?: unknown }) => {
      try {
        if (msg.type === 'ready') {
          if (state._pending !== null) {
            panel.webview.postMessage(state._pending);
            state._pending = null;
          }
          return;
        }
        if (opts.handleExtra) {
          const handled = await opts.handleExtra(msg, panel);
          if (handled) return;
        }
        if (msg.type === opts.saveMsgType && opts.validate(msg.payload)) {
          await state._onSave(msg.payload);
        }
      } catch (err) {
        const text = err instanceof Error ? err.message : String(err);
        notify('error', `AI Agencee: Save failed — ${text}`);
      }
    });

    panel.onDidDispose(() => {
      state._panel = null;
      state._pending = null;
    });
  };

  return { open };
};
