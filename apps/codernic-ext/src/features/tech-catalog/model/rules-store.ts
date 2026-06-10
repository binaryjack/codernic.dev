import * as fs from 'fs/promises';
import * as path from 'path';

export type RuleEntry = {
  id: string;
  name: string;
  mode: string;
  description?: string;
};

export type PromptEntry = {
  id: string;
  name: string;
  filePath: string;
};

export const isRuleEntry = (v: unknown): v is RuleEntry =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Record<string, unknown>)['id'] === 'string' &&
  typeof (v as Record<string, unknown>)['name'] === 'string' &&
  typeof (v as Record<string, unknown>)['mode'] === 'string';

export const resolveRulesDir = (workspaceRoot: string): string =>
  path.join(workspaceRoot, '.agencee', 'config', 'codernic', 'rules');

export const resolvePromptsDir = (workspaceRoot: string): string =>
  path.join(workspaceRoot, '.agencee', 'config', 'codernic', 'prompts');

const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

const RULE_SUFFIX = '.xml';

export const readRules = async (dir: string): Promise<RuleEntry[]> => {
  if (!dir) return [];
  try {
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const xmlFiles = files.filter((f) => f.endsWith(RULE_SUFFIX));

    // Built-in rules: ask.xml, plan.xml, agent.xml
    const entries: RuleEntry[] = [];
    for (const file of xmlFiles) {
      const filename = file.replace(RULE_SUFFIX, '');

      // Map mode to display name
      const nameMap: Record<string, string> = {
        ask: 'Ask Mode',
        plan: 'Plan Mode',
        agent: 'Agent Mode',
        journey: 'Journey Mode',
        analyse: 'Analyse Mode',
      };

      entries.push({
        id: `rule-${filename}`,
        name: nameMap[filename] ?? filename.charAt(0).toUpperCase() + filename.slice(1),
        mode: filename,
        description: `System instructions for ${filename} mode`,
      });
    }

    // Sort: ask, plan, agent first; then alphabetically
    const order = ['ask', 'plan', 'agent'];
    return entries.sort((a, b) => {
      const aIdx = order.indexOf(a.mode);
      const bIdx = order.indexOf(b.mode);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.mode.localeCompare(b.mode);
    });
  } catch {
    return [];
  }
};

export const readRule = async (dir: string, mode: string): Promise<string | null> => {
  const filePath = path.join(dir, `${mode}.xml`);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
};

export const writeRule = async (dir: string, mode: string, content: string): Promise<void> => {
  await ensureDir(dir);
  const filePath = path.join(dir, `${mode}.xml`);
  await fs.writeFile(filePath, content, 'utf-8');
};

export const readPrompts = async (dir: string): Promise<PromptEntry[]> => {
  if (!dir) return [];
  try {
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const xmlFiles = files.filter((f) => f.endsWith('.xml'));
    return xmlFiles
      .map((file) => {
        const stem = file.slice(0, -4); // remove .xml
        return {
          id: `prompt-${stem}`,
          name: stem.charAt(0).toUpperCase() + stem.slice(1).replace(/-/g, ' '),
          filePath: path.join(dir, file),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
};

export const deleteRule = async (dir: string, mode: string): Promise<void> => {
  const filePath = path.join(dir, `${mode}.xml`);
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore if file doesn't exist
  }
};
