import * as fs from 'fs';
import * as vscode from 'vscode';
import {
    AgentEntry,
    DagEntry,
    deleteAgent,
    readAgent,
    readAgents,
    readDags,
    writeAgent,
} from '../model/agent-store';
import { PromptEntry, readPrompts, readRules } from '../model/rules-store';
import { makeTcItem, TcItemInstance } from '../model/tc-item';
import { deleteTech, readTech, readTechs, TechEntry, writeTech } from '../model/tech-store';

const AGENTS_GROUP_ID = 'group-agents';
const RULES_GROUP_ID = 'group-rules';
const PROMPTS_GROUP_ID = 'group-prompts';
const TECHS_GROUP_ID = 'group-techs';
const PROVIDERS_GROUP_ID = 'group-providers';

type TcStore = {
  roots: TcItemInstance[];
  children: Map<string, TcItemInstance[]>;
};

type TcTreeProviderInstance = {
  readonly emitter: vscode.EventEmitter<TcItemInstance | undefined>;
  readonly store: TcStore;
  readonly agentsDir: string;
  readonly rulesDir: string;
  readonly techsDir: string;
  readonly promptsDir: string;
  readonly llmsDir: string;
  onDidChangeTreeData: vscode.Event<TcItemInstance | undefined>;
  getTreeItem(element: TcItemInstance): vscode.TreeItem;
  getChildren(element?: TcItemInstance): TcItemInstance[];
  refresh(node?: TcItemInstance): void;
  loadAgents(): Promise<void>;
  addAgent(label: string): Promise<TcItemInstance>;
  renameAgent(id: string, newLabel: string): Promise<void>;
  removeAgent(id: string): Promise<void>;
  loadRules(): Promise<void>;
  loadDags(): Promise<void>;
  loadPrompts(): Promise<void>;
  loadTechs(): Promise<void>;
  addTech(label: string): Promise<TcItemInstance>;
  renameTech(id: string, newLabel: string): Promise<void>;
  removeTech(id: string): Promise<void>;
  loadProviders(): Promise<void>;
};

export const TcTreeProvider = function (
  this: TcTreeProviderInstance,
  agentsDir: string,
  rulesDir: string,
  techsDir: string,
  promptsDir: string,
  version: string,
): void {
  if (!version || version.trim().length === 0) {
    throw new Error('TcTreeProvider requires a non-empty version string');
  }

  const emitter = new vscode.EventEmitter<TcItemInstance | undefined>();
  const roots: TcItemInstance[] = [
    makeTcItem(AGENTS_GROUP_ID, 'Agents', 'group', vscode.TreeItemCollapsibleState.Collapsed),
    makeTcItem('group-dags', 'DAGs', 'group', vscode.TreeItemCollapsibleState.Collapsed),
    makeTcItem(
      RULES_GROUP_ID,
      'Codernic Rules',
      'group',
      vscode.TreeItemCollapsibleState.Collapsed,
    ),
    makeTcItem(
      PROMPTS_GROUP_ID,
      'Codernic Prompts',
      'group',
      vscode.TreeItemCollapsibleState.Collapsed,
    ),
    makeTcItem(TECHS_GROUP_ID, 'Technologies', 'group', vscode.TreeItemCollapsibleState.Collapsed),
    makeTcItem(
      PROVIDERS_GROUP_ID,
      'Providers & Models',
      'group',
      vscode.TreeItemCollapsibleState.Collapsed,
    ),
    makeTcItem('version-info', `v${version}`, 'info', vscode.TreeItemCollapsibleState.None),
  ];
  const store: TcStore = {
    roots,
    children: new Map([
      [AGENTS_GROUP_ID, []],
      ['group-dags', []],
      [RULES_GROUP_ID, []],
      [PROMPTS_GROUP_ID, []],
      [TECHS_GROUP_ID, []],
      [PROVIDERS_GROUP_ID, []],
    ]),
  };

  // Note: For simplicity, extracting workspace root to construct llmsDir
  const workspaceRoot = agentsDir.includes('.agencee')
    ? agentsDir.substring(0, agentsDir.indexOf('.agencee'))
    : '';
  const llmsDir = vscode.Uri.joinPath(
    vscode.Uri.file(workspaceRoot),
    '.agencee',
    'config',
    'llms',
  ).fsPath;

  Object.defineProperty(this, 'emitter', { value: emitter, enumerable: false });
  Object.defineProperty(this, 'store', { value: store, enumerable: false });
  Object.defineProperty(this, 'agentsDir', { value: agentsDir, enumerable: false });
  Object.defineProperty(this, 'rulesDir', { value: rulesDir, enumerable: false });
  Object.defineProperty(this, 'techsDir', { value: techsDir, enumerable: false });
  Object.defineProperty(this, 'promptsDir', { value: promptsDir, enumerable: false });
  Object.defineProperty(this, 'llmsDir', { value: llmsDir, enumerable: false });
  this.onDidChangeTreeData = emitter.event;
};

TcTreeProvider.prototype.getTreeItem = function (
  this: TcTreeProviderInstance,
  element: TcItemInstance,
): vscode.TreeItem {
  return element;
};

TcTreeProvider.prototype.getChildren = function (
  this: TcTreeProviderInstance,
  element?: TcItemInstance,
): TcItemInstance[] {
  if (!element) return this.store.roots;
  if (element.kind === 'group') return this.store.children.get(element.id) ?? [];
  if (element.kind === 'tech') return this.store.children.get(element.id) ?? [];
  if (element.kind === 'tech-rules-category') return this.store.children.get(element.id) ?? [];
  return [];
};

TcTreeProvider.prototype.refresh = function (
  this: TcTreeProviderInstance,
  node?: TcItemInstance,
): void {
  this.emitter.fire(node);
};

TcTreeProvider.prototype.loadAgents = async function (this: TcTreeProviderInstance): Promise<void> {
  const entries = await readAgents(this.agentsDir);
  const items = entries.map((e) =>
    makeTcItem(e.id, e.name, 'agent', vscode.TreeItemCollapsibleState.None, e.description),
  );
  this.store.children.set(AGENTS_GROUP_ID, items);
  const groupNode = this.store.roots.find((r) => r.id === AGENTS_GROUP_ID);
  if (groupNode) {
    groupNode.collapsibleState =
      items.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;
  }
  this.emitter.fire(groupNode);
};

TcTreeProvider.prototype.addAgent = async function (
  this: TcTreeProviderInstance,
  label: string,
): Promise<TcItemInstance> {
  const id = `agent-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${Date.now()}`;
  const entry: AgentEntry = { id, name: label, icon: '🤖', description: '', checks: [] };
  await writeAgent(this.agentsDir, entry);
  const item = makeTcItem(id, label, 'agent', vscode.TreeItemCollapsibleState.None);
  const children = this.store.children.get(AGENTS_GROUP_ID) ?? [];
  children.push(item);
  this.store.children.set(AGENTS_GROUP_ID, children);
  const groupNode = this.store.roots.find((r) => r.id === AGENTS_GROUP_ID);
  if (groupNode) groupNode.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  this.emitter.fire(groupNode);
  return item;
};

TcTreeProvider.prototype.renameAgent = async function (
  this: TcTreeProviderInstance,
  id: string,
  newLabel: string,
): Promise<void> {
  const children = this.store.children.get(AGENTS_GROUP_ID) ?? [];
  const idx = children.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const existing = await readAgent(this.agentsDir, id);
  const entry: AgentEntry = { ...(existing ?? { id, name: newLabel }), id, name: newLabel };
  await writeAgent(this.agentsDir, entry);
  children[idx] = makeTcItem(id, newLabel, 'agent', vscode.TreeItemCollapsibleState.None);
  this.store.children.set(AGENTS_GROUP_ID, children);
  const groupNode = this.store.roots.find((r) => r.id === AGENTS_GROUP_ID);
  this.emitter.fire(groupNode);
};

TcTreeProvider.prototype.removeAgent = async function (
  this: TcTreeProviderInstance,
  id: string,
): Promise<void> {
  await deleteAgent(this.agentsDir, id);
  const filtered = (this.store.children.get(AGENTS_GROUP_ID) ?? []).filter((c) => c.id !== id);
  this.store.children.set(AGENTS_GROUP_ID, filtered);
  const groupNode = this.store.roots.find((r) => r.id === AGENTS_GROUP_ID);
  this.emitter.fire(groupNode);
};

// ── Codernic Rules ───────────────────────────────────────────────────────────

TcTreeProvider.prototype.loadRules = async function (this: TcTreeProviderInstance): Promise<void> {
  const entries = await readRules(this.rulesDir);
  const items = entries.map((e) =>
    makeTcItem(e.id, e.name, 'codernic-rule', vscode.TreeItemCollapsibleState.None, e.description),
  );
  this.store.children.set(RULES_GROUP_ID, items);
  const groupNode = this.store.roots.find((r) => r.id === RULES_GROUP_ID);
  if (groupNode) {
    groupNode.collapsibleState =
      items.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;
  }
  this.emitter.fire(groupNode);
};

// ── DAGs ─────────────────────────────────────────────────────────────────────

TcTreeProvider.prototype.loadDags = async function (this: TcTreeProviderInstance): Promise<void> {
  const entries = await readDags(this.agentsDir);
  const items = entries.map((e: DagEntry) =>
    makeTcItem(e.id, e.name, 'dag', vscode.TreeItemCollapsibleState.None, e.description),
  );
  this.store.children.set('group-dags', items);
  const groupNode = this.store.roots.find((r) => r.id === 'group-dags');
  if (groupNode) {
    groupNode.collapsibleState =
      items.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;
  }
  this.emitter.fire(groupNode);
};

// ── Providers & Models ───────────────────────────────────────────────────────

TcTreeProvider.prototype.loadProviders = async function (
  this: TcTreeProviderInstance,
): Promise<void> {
  try {
    const files = await fs.promises.readdir(this.llmsDir);
    const providerFiles = files.filter((f: string) => f.endsWith('.provider.json'));
    const items = providerFiles.map((f: string) =>
      makeTcItem(
        f,
        f.replace('.provider.json', ''),
        'provider',
        vscode.TreeItemCollapsibleState.None,
      ),
    );
    this.store.children.set(PROVIDERS_GROUP_ID, items);
    const groupNode = this.store.roots.find((r) => r.id === PROVIDERS_GROUP_ID);
    if (groupNode) {
      groupNode.collapsibleState =
        items.length > 0
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed;
    }
    this.emitter.fire(groupNode);
  } catch {
    // Dir might not exist yet, that's fine
    this.store.children.set(PROVIDERS_GROUP_ID, []);
    const groupNode = this.store.roots.find((r) => r.id === PROVIDERS_GROUP_ID);
    if (groupNode) groupNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.emitter.fire(groupNode);
  }
};

// ── Codernic Prompts ─────────────────────────────────────────────────────────

TcTreeProvider.prototype.loadPrompts = async function (
  this: TcTreeProviderInstance,
): Promise<void> {
  const entries = await readPrompts(this.promptsDir);
  const items = entries.map((e: PromptEntry) =>
    makeTcItem(e.id, e.name, 'codernic-prompt', vscode.TreeItemCollapsibleState.None),
  );
  this.store.children.set(PROMPTS_GROUP_ID, items);
  const groupNode = this.store.roots.find((r) => r.id === PROMPTS_GROUP_ID);
  if (groupNode) {
    groupNode.collapsibleState =
      items.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;
  }
  this.emitter.fire(groupNode);
};

// ── Technologies ─────────────────────────────────────────────────────────────

TcTreeProvider.prototype.loadTechs = async function (this: TcTreeProviderInstance): Promise<void> {
  const entries = await readTechs(this.techsDir);

  // Clear all dynamic sub-tree keys (they use '::' as separator)
  for (const key of [...this.store.children.keys()]) {
    if (key.includes('::')) this.store.children.delete(key);
  }

  const techItems: TcItemInstance[] = [];
  for (const e of entries) {
    const hasRules = Object.keys(e.rules ?? {}).length > 0;
    const techItem = makeTcItem(
      e.id,
      e.name,
      'tech',
      hasRules ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
      e.description,
    );
    techItems.push(techItem);
    if (hasRules) {
      const catItems: TcItemInstance[] = [];
      for (const category of Object.keys(e.rules!)) {
        const catId = `${e.id}::${category}`;
        catItems.push(
          makeTcItem(
            catId,
            category,
            'tech-rules-category',
            vscode.TreeItemCollapsibleState.Collapsed,
          ),
        );
        this.store.children.set(catId, [
          makeTcItem(`${catId}::do`, 'Do', 'tech-rule-do', vscode.TreeItemCollapsibleState.None),
          makeTcItem(
            `${catId}::doNot`,
            'Do Not',
            'tech-rule-donot',
            vscode.TreeItemCollapsibleState.None,
          ),
          makeTcItem(
            `${catId}::rationale`,
            'Rationale',
            'tech-rule-rationale',
            vscode.TreeItemCollapsibleState.None,
          ),
        ]);
      }
      this.store.children.set(e.id, catItems);
    } else {
      this.store.children.delete(e.id);
    }
  }

  this.store.children.set(TECHS_GROUP_ID, techItems);
  const groupNode = this.store.roots.find((r) => r.id === TECHS_GROUP_ID);
  if (groupNode) {
    groupNode.collapsibleState =
      techItems.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;
  }
  this.emitter.fire(groupNode);
};

TcTreeProvider.prototype.addTech = async function (
  this: TcTreeProviderInstance,
  label: string,
): Promise<TcItemInstance> {
  // Slug = bare lowercase label, no prefix, no timestamp
  const baseSlug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // Dedup against currently loaded children
  const existing = new Set((this.store.children.get(TECHS_GROUP_ID) ?? []).map((c) => c.id));
  let id = baseSlug;
  let n = 2;
  while (existing.has(id)) {
    id = `${baseSlug}-${n++}`;
  }
  const entry: TechEntry = { id, name: label, icon: '⚙️', description: '' };
  await writeTech(this.techsDir, entry);
  const item = makeTcItem(id, label, 'tech', vscode.TreeItemCollapsibleState.None);
  const children = this.store.children.get(TECHS_GROUP_ID) ?? [];
  children.push(item);
  this.store.children.set(TECHS_GROUP_ID, children);
  const groupNode = this.store.roots.find((r) => r.id === TECHS_GROUP_ID);
  if (groupNode) groupNode.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  this.emitter.fire(groupNode);
  return item;
};

TcTreeProvider.prototype.renameTech = async function (
  this: TcTreeProviderInstance,
  id: string,
  newLabel: string,
): Promise<void> {
  const existing = await readTech(this.techsDir, id);
  if (!existing) return;
  await writeTech(this.techsDir, { ...existing, name: newLabel });
  await this.loadTechs();
};

TcTreeProvider.prototype.removeTech = async function (
  this: TcTreeProviderInstance,
  id: string,
): Promise<void> {
  await deleteTech(this.techsDir, id);
  await this.loadTechs();
};
