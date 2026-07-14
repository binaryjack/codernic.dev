import * as fs from 'fs/promises';
import * as path from 'path';

// Shape of the <slug>.tech.json file inside .agencee/config/technologies/<slug>/
export type TechRecord = {
  name: string;
  icon?: string;
  description?: string;
  version?: string;
  frameworks?: string[];
};

// Per-category rule set — mirrors the rules/<category>/ folder structure
export type TechRuleFileData = {
  do: string[];
  doNot: string[];
  rationale: {
    summary: string;
    reasoning: string[];
    references: string[];
  };
};

// Derived runtime record: id = folder slug, rules loaded from subdirectories
export type TechEntry = TechRecord & {
  id: string;
  rules?: Record<string, TechRuleFileData>;
};

export const isTechEntry = (v: unknown): v is TechEntry =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Record<string, unknown>)['id'] === 'string' &&
  typeof (v as Record<string, unknown>)['name'] === 'string';

export const resolveTechsDir = (workspaceRoot: string): string =>
  path.join(workspaceRoot, '.codernic', 'technologies');

const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

const isTechRecord = (v: unknown): v is TechRecord =>
  typeof v === 'object' && v !== null;

const TECH_SUFFIX = '.tech.json';

// ── Rule file helpers ─────────────────────────────────────────────────────────

const readRulesFromDisk = async (techDir: string): Promise<Record<string, TechRuleFileData>> => {
  const rules: Record<string, TechRuleFileData> = {};
  const rulesDir = path.join(techDir, 'rules');
  try {
    const entries = await fs.readdir(rulesDir, { withFileTypes: true });
    for (const dirent of entries.filter((d) => d.isDirectory())) {
      const category = dirent.name;
      const catDir = path.join(rulesDir, category);
      try {
        const [doResult, doNotResult, rationaleResult] = await Promise.allSettled([
          fs.readFile(path.join(catDir, 'do.json'), 'utf-8'),
          fs.readFile(path.join(catDir, 'doNot.json'), 'utf-8'),
          fs.readFile(path.join(catDir, 'rationale.json'), 'utf-8'),
        ]);
        rules[category] = {
          do: doResult.status === 'fulfilled' ? (JSON.parse(doResult.value) as string[]) : [],
          doNot:
            doNotResult.status === 'fulfilled' ? (JSON.parse(doNotResult.value) as string[]) : [],
          rationale:
            rationaleResult.status === 'fulfilled'
              ? (JSON.parse(rationaleResult.value) as TechRuleFileData['rationale'])
              : { summary: '', reasoning: [], references: [] },
        };
      } catch {
        // skip malformed category
      }
    }
  } catch {
    // rules/ folder doesn't exist — that's OK
  }
  return rules;
};

const writeRulesToDisk = async (
  techDir: string,
  rules: Record<string, TechRuleFileData>,
): Promise<void> => {
  for (const [category, ruleData] of Object.entries(rules)) {
    const catDir = path.join(techDir, 'rules', category);
    await ensureDir(catDir);
    await fs.writeFile(path.join(catDir, 'do.json'), JSON.stringify(ruleData.do, null, 2), 'utf-8');
    await fs.writeFile(
      path.join(catDir, 'doNot.json'),
      JSON.stringify(ruleData.doNot, null, 2),
      'utf-8',
    );
    await fs.writeFile(
      path.join(catDir, 'rationale.json'),
      JSON.stringify(ruleData.rationale, null, 2),
      'utf-8',
    );
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

export const readTechs = async (dir: string): Promise<TechEntry[]> => {
  if (!dir) return [];
  try {
    await ensureDir(dir);
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const entries: TechEntry[] = [];
    for (const dirent of dirents.filter((d) => d.isDirectory())) {
      const slug = dirent.name;
      try {
        const metaPath = path.join(dir, slug, `${slug}${TECH_SUFFIX}`);
        const raw = await fs.readFile(metaPath, 'utf-8');
        const parsed: unknown = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
        if (isTechRecord(parsed)) {
          const rules = await readRulesFromDisk(path.join(dir, slug));
          const name = typeof (parsed as any).name === 'string' ? (parsed as any).name : slug;
          entries.push({ ...parsed, id: slug, name, rules });
        }
      } catch {
        // skip malformed / missing meta file
      }
    }
    return entries;
  } catch {
    return [];
  }
};

export const writeTech = async (dir: string, entry: TechEntry): Promise<void> => {
  if (!dir) return;
  const techDir = path.join(dir, entry.id);
  await ensureDir(techDir);
  const { id: _id, rules, ...record } = entry;
  await fs.writeFile(
    path.join(techDir, `${entry.id}${TECH_SUFFIX}`),
    JSON.stringify(record, null, 2),
    'utf-8',
  );
  if (rules && Object.keys(rules).length > 0) {
    await writeRulesToDisk(techDir, rules);
  }
};

export const readTech = async (dir: string, id: string): Promise<TechEntry | undefined> => {
  if (!dir || !id) return undefined;
  const techDir = path.join(dir, id);
  try {
    const raw = await fs.readFile(path.join(techDir, `${id}${TECH_SUFFIX}`), 'utf-8');
    const parsed: unknown = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
    if (isTechRecord(parsed)) {
      const rules = await readRulesFromDisk(techDir);
      const name = typeof (parsed as any).name === 'string' ? (parsed as any).name : id;
      return { ...parsed, id, name, rules };
    }
  } catch {
    // not found or malformed
  }
  return undefined;
};

export const deleteTech = async (dir: string, id: string): Promise<void> => {
  if (!dir) return;
  try {
    await fs.rm(path.join(dir, id), { recursive: true, force: true });
  } catch {
    // already gone — ignore
  }
};
