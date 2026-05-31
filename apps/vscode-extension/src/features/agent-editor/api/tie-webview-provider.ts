import * as vscode from 'vscode';
import type { TechEntry } from '../../tech-catalog/model/tech-store';
import { isTechEntry } from '../../tech-catalog/model/tech-store';
import type { EditorPanelInstance } from './create-editor-panel';
import { createEditorPanel } from './create-editor-panel';

export type TieEditorPanelCtor = {
  new (
    ctx: vscode.ExtensionContext,
    onSave: (entry: TechEntry) => Promise<void>,
  ): EditorPanelInstance<TechEntry>;
};

export const TieEditorPanel = function (
  this: EditorPanelInstance<TechEntry>,
  ctx: vscode.ExtensionContext,
  onSave: (entry: TechEntry) => Promise<void>,
): void {
  const instance = createEditorPanel<TechEntry>(ctx, onSave, {
    viewType: 'ai-agencee.tie',
    titlePrefix: 'Tech',
    panel: 'tie',
    openMsgType: 'open-tech',
    saveMsgType: 'save-tech',
    validate: isTechEntry,
  });
  Object.defineProperty(this, 'open', { value: instance.open, enumerable: false, writable: false });
};
