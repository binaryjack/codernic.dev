import * as path from 'path';
import * as vscode from 'vscode';
import { wrapCmd } from '../../../shared/error-utils';
import { readAgent } from '../model/agent-store';
import { TcItemInstance } from '../model/tc-item';
import { readTech } from '../model/tech-store';

type TcProvider = {
  loadAgents(): Promise<void>;
  addAgent(label: string): Promise<TcItemInstance>;
  renameAgent(id: string, newLabel: string): Promise<void>;
  removeAgent(id: string): Promise<void>;
  loadDags(): Promise<void>;
  loadPrompts(): Promise<void>;
  loadTechs(): Promise<void>;
  addTech(label: string): Promise<TcItemInstance>;
  renameTech(id: string, newLabel: string): Promise<void>;
  removeTech(id: string): Promise<void>;
};

type AiePanel = { open(entry: Awaited<ReturnType<typeof readAgent>> & object): void };
type TiePanel = { open(entry: Awaited<ReturnType<typeof readTech>> & object): void };

export const registerTcCommands = function (
  context: vscode.ExtensionContext,
  tc: TcProvider,
  dirs: { agentsDir: string; rulesDir: string; promptsDir: string; techsDir: string },
  aie: AiePanel,
  tie: TiePanel,
  channel: vscode.OutputChannel,
): void {
  const { agentsDir, rulesDir, promptsDir, techsDir } = dirs;

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'ai-agencee.tc.agent.add',
      wrapCmd(channel, async () => {
        const label = await vscode.window.showInputBox({
          prompt: 'Agent name',
          placeHolder: 'my-agent',
        });
        if (label?.trim()) await tc.addAgent(label.trim());
      }),
    ),

    vscode.commands.registerCommand(
      'ai-agencee.tc.agent.rename',
      wrapCmd(channel, async (node: unknown) => {
        const n = node as TcItemInstance;
        const newLabel = await vscode.window.showInputBox({
          prompt: 'New agent name',
          value: n.label as string,
        });
        if (newLabel?.trim()) await tc.renameAgent(n.id, newLabel.trim());
      }),
    ),

    vscode.commands.registerCommand(
      'ai-agencee.tc.agent.delete',
      wrapCmd(channel, async (node: unknown) => {
        const n = node as TcItemInstance;
        const answer = await vscode.window.showWarningMessage(
          `Delete agent "${n.label as string}"?`,
          { modal: true },
          'Delete',
        );
        if (answer === 'Delete') await tc.removeAgent(n.id);
      }),
    ),

    vscode.commands.registerCommand(
      'ai-agencee.tc.tech.add',
      wrapCmd(channel, async () => {
        const label = await vscode.window.showInputBox({
          prompt: 'Technology name',
          placeHolder: 'my-tech',
        });
        if (label?.trim()) await tc.addTech(label.trim());
      }),
    ),

    vscode.commands.registerCommand(
      'ai-agencee.tc.tech.rename',
      wrapCmd(channel, async (node: unknown) => {
        const n = node as TcItemInstance;
        const newLabel = await vscode.window.showInputBox({
          prompt: 'New technology name',
          value: n.label as string,
        });
        if (newLabel?.trim()) await tc.renameTech(n.id, newLabel.trim());
      }),
    ),

    vscode.commands.registerCommand(
      'ai-agencee.tc.tech.delete',
      wrapCmd(channel, async (node: unknown) => {
        const n = node as TcItemInstance;
        const answer = await vscode.window.showWarningMessage(
          `Delete technology "${n.label as string}"?`,
          { modal: true },
          'Delete',
        );
        if (answer === 'Delete') await tc.removeTech(n.id);
      }),
    ),

    vscode.commands.registerCommand(
      'ai-agencee.tc.openItem',
      wrapCmd(channel, async (node: unknown) => {
        const n = node as TcItemInstance;
        await handleOpenItem(n, { agentsDir, rulesDir, promptsDir, techsDir }, aie, tie);
      }),
    ),
  );
};

/**
 * Exhaustive handler for opening tree items.
 * Uses a switch statement with compile-time completeness check.
 */
async function handleOpenItem(
  item: TcItemInstance,
  dirs: { agentsDir: string; rulesDir: string; promptsDir: string; techsDir: string },
  aie: AiePanel,
  tie: TiePanel,
): Promise<void> {
  switch (item.kind) {
    case 'agent': {
      const entry = await readAgent(dirs.agentsDir, item.id);
      if (entry) aie.open(entry);
      break;
    }
    case 'dag': {
      // Open the .dag.json file directly in a text editor
      const filePath = path.join(dirs.agentsDir, `${item.id}.dag.json`);
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
      break;
    }
    case 'rule':
    case 'flow': {
      // legacy / unused kinds — no-op
      break;
    }
    case 'codernic-rule': {
      // Extract mode from id: "rule-ask" -> "ask"
      const mode = item.id.replace('rule-', '');
      const filePath = path.join(dirs.rulesDir, `${mode}.xml`);
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
      break;
    }
    case 'codernic-prompt': {
      // Extract stem from id: "prompt-system" -> "system"
      const stem = item.id.replace('prompt-', '');
      const filePath = path.join(dirs.promptsDir, `${stem}.xml`);
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
      break;
    }
    case 'tech': {
      const entry = await readTech(dirs.techsDir, item.id);
      if (entry) tie.open(entry);
      break;
    }
    case 'tech-rule-do':
    case 'tech-rule-donot':
    case 'tech-rule-rationale': {
      const techId = item.id.split('::')[0];
      const entry = await readTech(dirs.techsDir, techId);
      if (entry) tie.open(entry);
      break;
    }
    case 'provider': {
      const workspaceRoot = dirs.agentsDir.includes('.codernic')
        ? dirs.agentsDir.substring(0, dirs.agentsDir.indexOf('.codernic'))
        : '';
      const filePath = path.join(workspaceRoot, '.codernic', 'config', 'llms', item.id);
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
      break;
    }
    case 'group':
    case 'tech-rules-category':
    case 'info':
      // These items are not clickable (no command assigned in tc-item.ts)
      // If this code is reached, it means isClickableItem() logic is inconsistent
      break;
    default: {
      // Exhaustiveness check: if a new kind is added to TcItemInstance but not handled here,
      // TypeScript will error because `item.kind` is not `never`
      const _exhaustive: never = item.kind;
      return _exhaustive;
    }
  }
}
