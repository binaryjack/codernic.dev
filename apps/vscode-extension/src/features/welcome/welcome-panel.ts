import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { buildWebviewHtml } from '../../shared/build-webview-html';

/**
 * Phase 2.3: VS Code Extension Quick Start
 *
 * Welcome panel that shows on first launch (now using React component via Vite bundle):
 * - Try Demo button (runs mock DAG)
 * - Create Workflow wizard (templates: Security, Refactoring, Documentation)
 * - Setup guide (API keys, providers)
 *
 * Goal: 5-minute "aha moment" for new users
 */

export class WelcomePanel {
  public static currentPanel: WelcomePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    workspaceRoot: string,
    channel: vscode.OutputChannel,
  ) {
    const column = vscode.ViewColumn.One;

    // If we already have a panel, show it
    if (WelcomePanel.currentPanel) {
      WelcomePanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'aiAgenceeWelcome',
      'Welcome to AI Agencee',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      },
    );

    WelcomePanel.currentPanel = new WelcomePanel(panel, extensionUri, workspaceRoot, channel);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private readonly workspaceRoot: string,
    private readonly channel: vscode.OutputChannel,
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'runDemo':
            await this._runDemo(message.template);
            return;
          case 'createWorkflow':
            await this._createWorkflow(message.template);
            return;
          case 'openSetup':
            await this._openSetup();
            return;
          case 'dismiss':
            this._panel.dispose();
            return;
        }
      },
      null,
      this._disposables,
    );
  }

  public dispose() {
    WelcomePanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }

  private async _runDemo(template: 'security' | 'refactoring' | 'multi-agent') {
    this.channel.appendLine(`[WELCOME] Running demo: ${template}`);

    try {
      // Get demo DAG path from templates
      const demoPath = this._getDemoPath(template);

      // Run demo using the agencee agent runner
      const terminal = vscode.window.createTerminal('AI Agencee Demo');
      terminal.show();
      terminal.sendText(`agencee agent --run .agencee/demos/${demoPath}.dag.json`);

      vscode.window
        .showInformationMessage(
          `✨ Running ${template} demo — check the terminal for output`,
          'View Terminal',
        )
        .then((selection) => {
          if (selection === 'View Terminal') {
            terminal.show();
          }
        });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.channel.appendLine(`[WELCOME] Demo failed: ${errMsg}`);
      vscode.window.showErrorMessage(`Failed to run demo: ${errMsg}`);
    }
  }

  private async _createWorkflow(
    template:
      | 'security-scan'
      | 'code-review'
      | 'refactoring'
      | 'documentation'
      | 'testing'
      | 'full-stack',
  ) {
    this.channel.appendLine(`[WELCOME] Creating workflow from template: ${template}`);

    try {
      // Install template to agents/ directory
      const agentsDir = path.join(this.workspaceRoot, 'agents');

      // Ensure agents directory exists
      await fs.mkdir(agentsDir, { recursive: true });

      // Copy template from extension bundled resources
      const templateSrc = path.join(
        (this._extensionUri as unknown as { fsPath: string }).fsPath,
        'templates',
        template,
      );
      const terminal = vscode.window.createTerminal('AI Agencee Setup');
      terminal.show();
      // agencee template:install is not yet implemented; scaffold via copy from bundled templates
      terminal.sendText(`cp -r "${templateSrc}" "${agentsDir}/${template}" 2>/dev/null || echo "Template scaffold not yet bundled — create agents/${template}/ manually"`);

      vscode.window
        .showInformationMessage(
          `✅ Installing ${template} template to agents/`,
          'Open Agents Folder',
        )
        .then((selection) => {
          if (selection === 'Open Agents Folder') {
            vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(agentsDir));
          }
        });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.channel.appendLine(`[WELCOME] Template install failed: ${errMsg}`);
      vscode.window.showErrorMessage(`Failed to install template: ${errMsg}`);
    }
  }

  private async _openSetup() {
    // Open setup wizard or settings
    vscode.commands.executeCommand('workbench.action.openSettings', 'ai-agencee');
  }

  private _getDemoPath(template: string): string {
    // Map template names to demo scenario names
    const demoMap: Record<string, string> = {
      security: 'security',
      refactoring: 'refactoring',
      'multi-agent': 'parallel',
    };
    return demoMap[template] || 'security';
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Welcome to AI Agencee';
    this._panel.webview.html = buildWebviewHtml(webview, this._extensionUri, {
      title: 'Welcome to AI Agencee',
      panel: 'welcome',
    });
  }
}
