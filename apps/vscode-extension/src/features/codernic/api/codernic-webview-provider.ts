import * as vscode from 'vscode';
import { buildWebviewHtml } from '../../../shared/build-webview-html';
import { wrapMsgHandler } from '../../../shared/error-utils';

export type CodernicMsg = { type: string; payload?: unknown };
export type CodernicMsgCallback = (
  msg: CodernicMsg,
  reply: (r: CodernicMsg) => void,
) => Promise<void>;

type CodernicWebviewProviderInstance = vscode.WebviewViewProvider & {
  readonly ctx: vscode.ExtensionContext;
  readonly _onMessage: CodernicMsgCallback;
  readonly _channel: vscode.OutputChannel;
  _view?: vscode.WebviewView;
  resolveWebviewView(
    view: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ): void;
  postMessage(msg: CodernicMsg): void;
};

export const CodernicWebviewProvider = function (
  this: CodernicWebviewProviderInstance,
  ctx: vscode.ExtensionContext,
  onMessage: CodernicMsgCallback,
  channel: vscode.OutputChannel,
): void {
  Object.defineProperty(this, 'ctx', { value: ctx, enumerable: false, writable: false });
  Object.defineProperty(this, '_onMessage', {
    value: onMessage,
    enumerable: false,
    writable: false,
  });
  Object.defineProperty(this, '_channel', { value: channel, enumerable: false, writable: false });
};

CodernicWebviewProvider.prototype.resolveWebviewView = function (
  this: CodernicWebviewProviderInstance,
  view: vscode.WebviewView,
  _context: vscode.WebviewViewResolveContext,
  _token: vscode.CancellationToken,
): void {
  this._view = view;
  const ctx = this.ctx;

  view.title = 'Codernic';

  view.webview.options = {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'dist', 'webview')],
  };

  view.webview.html = buildWebviewHtml(view.webview, ctx.extensionUri, {
    title: 'AI Agencee Codernic',
    panel: 'codernic',
    rootStyle: 'width: 100%; height: 100vh;',
  });

  view.webview.onDidReceiveMessage((msg: CodernicMsg) => {
    const reply = (r: CodernicMsg): void => {
      view.webview.postMessage(r);
    };
    void wrapMsgHandler(this._channel, reply, () => this._onMessage(msg, reply))();
  });

  view.onDidDispose(() => {
    this._view = undefined;
  });
};

CodernicWebviewProvider.prototype.postMessage = function (
  this: CodernicWebviewProviderInstance,
  msg: CodernicMsg,
): void {
  if (this._view) {
    void this._view.webview.postMessage(msg);
  }
};
