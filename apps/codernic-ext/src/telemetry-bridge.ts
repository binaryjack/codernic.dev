import * as vscode from 'vscode';

export class TelemetryBridge implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private broadcastFn: (payload: unknown) => void;

  constructor(broadcastFn: (payload: unknown) => void) {
    this.broadcastFn = broadcastFn;
    this.init();
  }

  private init() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(this.handleActiveEditorChange.bind(this)),
      vscode.window.onDidChangeTextEditorSelection(this.handleSelectionChange.bind(this))
    );

    // Initial state
    if (vscode.window.activeTextEditor) {
      this.handleActiveEditorChange(vscode.window.activeTextEditor);
    }
  }

  private handleActiveEditorChange(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      return;
    }

    const payload = {
      type: 'CODERNIC_TELEMETRY_ACTIVE_FILE',
      filePath: editor.document.uri.fsPath,
      languageId: editor.document.languageId,
    };

    // Send silently to UI/Daemon
    this.broadcastFn(payload);
  }

  private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
    const editor = event.textEditor;
    if (!editor || event.selections.length === 0) {
      return;
    }

    const selection = event.selections[0];
    const payload = {
      type: 'CODERNIC_TELEMETRY_CURSOR',
      filePath: editor.document.uri.fsPath,
      line: selection.active.line + 1,
      character: selection.active.character + 1,
      hasSelection: !selection.isEmpty,
    };

    // Send silently to UI/Daemon
    this.broadcastFn(payload);
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
