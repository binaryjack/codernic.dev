import * as vscode from 'vscode';
import { buildWebviewHtml } from '../../shared/build-webview-html';

/**
 * Phase 2.4: Quality Gate Visualization
 *
 * Displays quality gate results from DAG execution in a visual dashboard (now using React component).
 * Shows checkpoint-by-checkpoint pass/fail status with details about
 * supervisor verdicts, retries, and overall lane health.
 *
 * Quality gates = checkpoints where supervisor validates work quality
 */

export interface LaneResult {
  laneId: string;
  status: 'success' | 'failed' | 'escalated' | 'timed-out';
  checkpoints: CheckpointRecord[];
  totalRetries: number;
  durationMs: number;
  error?: string;
}

export interface CheckpointRecord {
  checkpointId: string;
  stepIndex: number;
  mode: string;
  verdict: {
    type: 'APPROVE' | 'RETRY' | 'HANDOFF' | 'ESCALATE';
    instructions?: string;
    reason?: string;
  };
  retryCount: number;
  timestamp: string;
  durationMs: number;
}

export interface DagResult {
  dagName: string;
  runId: string;
  status: 'success' | 'partial' | 'failed';
  lanes: LaneResult[];
  totalDurationMs: number;
  startedAt: string;
  completedAt: string;
}

export class QualityGatePanel {
  public static currentPanel: QualityGatePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _dagResult: DagResult;

  public static createOrShow(extensionUri: vscode.Uri, dagResult: DagResult) {
    const column = vscode.ViewColumn.Two;

    // If we already have a panel, show it
    if (QualityGatePanel.currentPanel) {
      QualityGatePanel.currentPanel._dagResult = dagResult;
      QualityGatePanel.currentPanel._update();
      QualityGatePanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'aiAgenceeQualityGates',
      'Quality Gates',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      },
    );

    QualityGatePanel.currentPanel = new QualityGatePanel(panel, extensionUri, dagResult);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, dagResult: DagResult) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._dagResult = dagResult;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'close':
            this._panel.dispose();
            return;
        }
      },
      null,
      this._disposables,
    );
  }

  public dispose() {
    QualityGatePanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = `Quality Gates - ${this._dagResult.dagName}`;

    this._panel.webview.html = buildWebviewHtml(webview, this._extensionUri, {
      title: `Quality Gates - ${this._dagResult.dagName}`,
      panel: 'quality-gates',
      initialState: {
        __DAG_RESULT__: this._dagResult,
      },
    });
  }
}
