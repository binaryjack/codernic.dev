import * as fs from 'fs/promises';
import * as path from 'path';

// Shape of an *.agent.json file on disk (as found in .agencee/agents/)
export type AgentRecord = {
  name: string;
  icon?: string;
  description?: string;
  taskType?: string;
  checkMode?: string;
  focusPath?: string;
  llm?: string;
  tech?: string;
  checks?: unknown[];
};

// Derived runtime record: adds an id from the filename stem
export type AgentEntry = AgentRecord & { id: string };

export const isAgentEntry = (v: unknown): v is AgentEntry =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Record<string, unknown>)['id'] === 'string' &&
  typeof (v as Record<string, unknown>)['name'] === 'string';

export const resolveAgentsDir = (workspaceRoot: string): string =>
  path.join(workspaceRoot, '.codernic', 'agents');

export const resolveDagsDir = (workspaceRoot: string): string =>
  path.join(workspaceRoot, '.codernic', 'dags');

const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

const isAgentRecord = (v: unknown): v is AgentRecord =>
  typeof v === 'object' && v !== null;

const AGENT_SUFFIX = '.agent.json';

export const readAgents = async (dir: string): Promise<AgentEntry[]> => {
  if (!dir) return [];
  try {
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const entries: AgentEntry[] = [];
    for (const file of files.filter((f) => f.endsWith(AGENT_SUFFIX))) {
      try {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8');
        const parsed: unknown = JSON.parse(raw);
        if (isAgentRecord(parsed)) {
          const id = file.slice(0, -AGENT_SUFFIX.length);
          const name = typeof (parsed as any).name === 'string' ? (parsed as any).name : id;
          entries.push({ ...parsed, id, name });
        }
      } catch {
        // skip malformed / unreadable file
      }
    }
    return entries;
  } catch {
    return [];
  }
};

export const writeAgent = async (dir: string, entry: AgentEntry): Promise<void> => {
  if (!dir) return;
  await ensureDir(dir);
  const { id: _id, ...record } = entry;
  await fs.writeFile(
    path.join(dir, `${entry.id}${AGENT_SUFFIX}`),
    JSON.stringify(record, null, 2),
    'utf-8',
  );
};

export const readAgent = async (dir: string, id: string): Promise<AgentEntry | undefined> => {
  if (!dir || !id) return undefined;
  try {
    const raw = await fs.readFile(path.join(dir, `${id}${AGENT_SUFFIX}`), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (isAgentRecord(parsed)) {
      const name = typeof (parsed as any).name === 'string' ? (parsed as any).name : id;
      return { ...parsed, id, name };
    }
  } catch {
    // not found or malformed
  }
  return undefined;
};

export const deleteAgent = async (dir: string, id: string): Promise<void> => {
  if (!dir) return;
  try {
    await fs.unlink(path.join(dir, `${id}${AGENT_SUFFIX}`));
  } catch {
    // already gone — ignore
  }
};

// ── DAGs ─────────────────────────────────────────────────────────────────────

export type DagEntry = {
  id: string;
  name: string;
  description?: string;
};

const DAG_SUFFIX = '.dag.json';

type DagRecord = {
  name: string;
  description?: string;
};

const isDagRecord = (v: unknown): v is DagRecord =>
  typeof v === 'object' && v !== null;

export const readDags = async (dir: string): Promise<DagEntry[]> => {
  if (!dir) return [];
  try {
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const entries: DagEntry[] = [];
    for (const file of files.filter((f) => f.endsWith(DAG_SUFFIX))) {
      try {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8');
        const parsed: unknown = JSON.parse(raw);
        if (isDagRecord(parsed)) {
          const id = file.slice(0, -DAG_SUFFIX.length);
          const name = typeof (parsed as any).name === 'string' ? (parsed as any).name : id;
          entries.push({ id, name, description: parsed.description });
        }
      } catch {
        // skip malformed / unreadable file
      }
    }
    return entries;
  } catch {
    return [];
  }
};
