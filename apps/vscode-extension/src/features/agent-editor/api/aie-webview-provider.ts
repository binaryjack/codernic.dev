import * as vscode from 'vscode';
import type { AgentEntry } from '../../tech-catalog/model/agent-store';
import { isAgentEntry } from '../../tech-catalog/model/agent-store';
import type { EditorPanelInstance } from './create-editor-panel';
import { createEditorPanel } from './create-editor-panel';

export type AieEditorPanelCtor = {
  new (
    ctx: vscode.ExtensionContext,
    onSave: (entry: AgentEntry) => Promise<void>,
    techsDir: string,
    onTechCreated?: () => Promise<void>,
  ): EditorPanelInstance<AgentEntry>;
};

export const AieEditorPanel = function (
  this: EditorPanelInstance<AgentEntry>,
  ctx: vscode.ExtensionContext,
  onSave: (entry: AgentEntry) => Promise<void>,
  techsDir: string,
  onTechCreated?: () => Promise<void>,
): void {
  const instance = createEditorPanel<AgentEntry>(ctx, onSave, {
    viewType: 'ai-agencee.aie',
    titlePrefix: 'Agent',
    panel: 'aie',
    openMsgType: 'open-agent',
    saveMsgType: 'save-agent',
    validate: isAgentEntry,
    handleExtra: async (msg, panel) => {
      if (msg.type === 'aie:generate-tech' && typeof msg.payload === 'object' && msg.payload) {
        const payload = msg.payload as { name: string; llm: string };
        try {
          // TODO: Implement tech generation
          // const techId = await generateTechRules(payload.name, payload.llm)
          panel.webview.postMessage({
            type: 'aie:tech-generate-error',
            payload: { text: 'Tech generation not yet implemented' },
          });
        } catch (err) {
          panel.webview.postMessage({
            type: 'aie:tech-generate-error',
            payload: { text: err instanceof Error ? err.message : String(err) },
          });
        }
        return true;
      }
      return false;
    },
  });
  Object.defineProperty(this, 'open', { value: instance.open, enumerable: false, writable: false });
};
