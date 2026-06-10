import * as vscode from 'vscode';

export type TcItemInstance = vscode.TreeItem & {
  id: string;
  label: string;
  kind:
    | 'agent'
    | 'dag'
    | 'rule'
    | 'flow'
    | 'group'
    | 'codernic-rule'
    | 'codernic-prompt'
    | 'tech'
    | 'tech-rules-category'
    | 'tech-rule-do'
    | 'tech-rule-donot'
    | 'tech-rule-rationale'
    | 'info'
    | 'provider';
  description?: string;
};

// Type guard: items that can be opened with a click command
export const isClickableItem = (kind: TcItemInstance['kind']): boolean => {
  return kind !== 'group' && kind !== 'tech-rules-category' && kind !== 'info';
};

// Type guard: tech-related item kinds that map to actual resources
export const isTechKind = (kind: TcItemInstance['kind']): kind is 'tech' | 'agent' => {
  return kind === 'tech' || kind === 'agent';
};

export const TcItem = function (
  this: TcItemInstance,
  id: string,
  label: string,
  kind: TcItemInstance['kind'],
  collapsible: vscode.TreeItemCollapsibleState,
  description?: string,
): void {
  this.id = id;
  this.label = label;
  this.kind = kind;
  this.collapsibleState = collapsible;
  this.iconPath = new vscode.ThemeIcon(resolveIcon(kind));
  // groups use their id as contextValue so each group gets its own when-clause target
  this.contextValue = kind === 'group' ? id : kind;
  if (description) this.description = description;
  if (isClickableItem(kind)) {
    this.command = {
      command: 'ai-agencee.tc.openItem',
      title: 'Open',
      arguments: [this],
    };
  }
};

const resolveIcon = function (kind: TcItemInstance['kind']): string {
  const map: Record<TcItemInstance['kind'], string> = {
    group: 'folder',
    agent: 'robot',
    dag: 'graph',
    rule: 'law',
    flow: 'list-ordered',
    'codernic-rule': 'file-code',
    'codernic-prompt': 'file-text',
    tech: 'symbol-misc',
    'tech-rules-category': 'list-tree',
    'tech-rule-do': 'pass',
    'tech-rule-donot': 'error',
    'tech-rule-rationale': 'info',
    info: 'info',
    provider: 'server-environment',
  };
  return map[kind];
};

type TcItemCtor = {
  new (
    id: string,
    label: string,
    kind: TcItemInstance['kind'],
    collapsible: vscode.TreeItemCollapsibleState,
    description?: string,
  ): TcItemInstance;
};

export const makeTcItem = (
  id: string,
  label: string,
  kind: TcItemInstance['kind'],
  collapsible: vscode.TreeItemCollapsibleState,
  description?: string,
): TcItemInstance =>
  new (TcItem as unknown as TcItemCtor)(id, label, kind, collapsible, description);
