/**
 * @file executor.ts
 * @description AGENT mode executor — Execute DAGs and stream live progress
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { type McpClientInstance } from '../../../shared/mcp';
import type { DagSpecification } from '../plan-mode/dag-generator';
import { runDagStream } from './dag-runner';

export interface LaneStatus {
  laneId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  checkpoints?: CheckpointResult[];
  findings?: Finding[];
}

export interface CheckpointResult {
  checkpointId: string;
  passed: boolean;
  message?: string;
}

export interface Finding {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
}

export interface DagExecutionResult {
  status: 'completed' | 'failed' | 'partial';
  totalDurationMs: number;
  lanes: LaneStatus[];
  findings?: string[];
  recommendations?: string[];
  modifiedFiles?: string[];
}

/**
 * Load DAG specification from file
 */
async function loadDagSpec(dagFilePath: string): Promise<DagSpecification> {
  const content = await fs.readFile(dagFilePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Find DAG file from description
 */
async function findDagFile(dagDescription: string, workspaceRoot: string): Promise<string | null> {
  const agentsPath = path.join(workspaceRoot, '.agencee', 'config', 'agents');

  // Try exact filename match first
  const kebabName = dagDescription
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const directPath = path.join(agentsPath, `${kebabName}.dag.json`);
  try {
    await fs.access(directPath);
    return directPath;
  } catch {
    // Not found, try searching
  }

  // Search all DAG files
  const searchDags = async (dir: string): Promise<string[]> => {
    const results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await searchDags(fullPath)));
        } else if (entry.name.endsWith('.dag.json')) {
          results.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist
    }
    return results;
  };

  const dagFiles = await searchDags(agentsPath);

  // Match by name or description
  for (const file of dagFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const spec = JSON.parse(content);

      const nameMatch = spec.name?.toLowerCase().includes(dagDescription.toLowerCase());
      const descMatch = spec.description?.toLowerCase().includes(dagDescription.toLowerCase());

      if (nameMatch || descMatch) {
        return file;
      }
    } catch {
      // Skip malformed files
    }
  }

  return null;
}

/**
 * Render lane status in VS Code chat
 */
function renderLane(
  stream: vscode.ChatResponseStream,
  laneId: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  progress: number,
): void {
  const statusIcon =
    status === 'completed' ? '✅' : status === 'failed' ? '❌' : status === 'running' ? '⏳' : '⏸️';

  const progressBar =
    '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

  stream.markdown(`\n┌────────────────────────────────────────────────┐\n`);
  stream.markdown(
    `│ ${laneId.padEnd(20)} [${progressBar}] ${progress.toString().padStart(3)}% ${statusIcon}  │\n`,
  );
  stream.markdown(`└────────────────────────────────────────────────┘\n`);
}

/**
 * Update lane display
 */
function updateLane(
  stream: vscode.ChatResponseStream,
  laneId: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  progress: number,
): void {
  renderLane(stream, laneId, status, progress);
}

/**
 * Execute DAG via MCP agent-dag tool
 */
export async function executeDag(
  dagDescription: string,
  workspaceRoot: string,
  mcpClient: McpClientInstance | null,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _codeContext?: string,
): Promise<DagExecutionResult> {
  // Find DAG file
  const dagFilePath = await findDagFile(dagDescription, workspaceRoot);

  if (!dagFilePath) {
    stream.markdown(`❌ **DAG not found**: "${dagDescription}"\n\n`);
    stream.markdown('Available DAGs:\n');

    // List available DAGs
    const agentsPath = path.join(workspaceRoot, '.agencee', 'config', 'agents');
    const searchDags = async (dir: string): Promise<string[]> => {
      const results: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results.push(...(await searchDags(fullPath)));
          } else if (entry.name.endsWith('.dag.json')) {
            results.push(fullPath);
          }
        }
      } catch {
        // Error
      }
      return results;
    };

    const dags = await searchDags(agentsPath);
    for (const dag of dags) {
      try {
        const content = await fs.readFile(dag, 'utf-8');
        const spec = JSON.parse(content);
        stream.markdown(`- \`${spec.name}\`\n`);
      } catch {
        // Skip
      }
    }

    throw new Error(`DAG not found: ${dagDescription}`);
  }

  // Load DAG specification
  const dagSpec = await loadDagSpec(dagFilePath);

  // Display DAG header
  stream.markdown(`🚀 **Executing DAG**: ${dagSpec.name}\n\n`);
  stream.markdown(`${dagSpec.description}\n\n`);

  // Initialize lane trackers
  const laneTracker = new Map<string, LaneStatus>();
  for (const lane of dagSpec.lanes) {
    laneTracker.set(lane.id, {
      laneId: lane.id,
      status: 'pending',
      progress: 0,
    });
    renderLane(stream, lane.id, 'pending', 0);
  }

  stream.markdown('\n---\n\n');

  // Execute DAG via MCP
  if (!mcpClient) {
    stream.markdown('❌ **MCP client not available**\n\n');
    stream.markdown('Cannot execute DAG without MCP server connection.\n');
    throw new Error('MCP client not available');
  }

  const startTime = Date.now();
  const lanes: LaneStatus[] = dagSpec.lanes.map((lane) => ({
    laneId: lane.id,
    status: 'pending',
    progress: 0,
  }));

  try {
    stream.markdown('⏳ **Starting DAG execution...**\n\n');

    await runDagStream(
      path.relative(workspaceRoot, dagFilePath),
      workspaceRoot,
      undefined, // extensionPath
      (event) => {
        if (event.type === 'lane-start') {
          const lane = lanes.find((l) => l.laneId === event.laneId);
          if (lane) {
            lane.status = 'running';
            updateLane(stream, lane.laneId, lane.status, 20);
          }
        } else if (event.type === 'lane-end') {
          const lane = lanes.find((l) => l.laneId === event.laneId);
          if (lane) {
            lane.status = event.status === 'success' ? 'completed' : 'failed';
            lane.progress = 100;
            updateLane(stream, lane.laneId, lane.status, 100);
          }
        } else if (event.type === 'agent_message') {
          stream.markdown(event.content);
        } else if (event.type === 'error') {
          stream.markdown(`\n❌ **Execution error**: ${event.message}\n\n`);
        }
      },
      mcpClient,
      { token },
    );

    const result: DagExecutionResult = {
      status: lanes.every((l) => l.status === 'completed') ? 'completed' : 'partial',
      totalDurationMs: Date.now() - startTime,
      lanes,
      findings: [],
      recommendations: [],
      modifiedFiles: [],
    };

    // Display summary
    stream.markdown('\n---\n\n');
    stream.markdown('## Execution Summary\n\n');
    stream.markdown(
      `**Status**: ${result.status.toUpperCase()} ${result.status === 'completed' ? '✅' : '❌'}\n`,
    );
    stream.markdown(
      `**Duration**: ${result.totalDurationMs}ms (~${(result.totalDurationMs / 1000).toFixed(1)}s)\n`,
    );
    stream.markdown(
      `**Lanes Completed**: ${result.lanes.filter((l) => l.status === 'completed').length}/${result.lanes.length}\n`,
    );

    if (result.status === 'completed') {
      stream.markdown('\n🎉 **DAG execution completed successfully!**\n');
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    stream.markdown(`\n❌ **Execution failed**: ${errorMsg}\n\n`);

    return {
      status: 'failed',
      totalDurationMs: Date.now() - startTime,
      lanes: lanes.map((l) => ({
        ...l,
        status: l.status === 'completed' ? 'completed' : 'failed',
      })),
    };
  }
}

/**
 * Extract DAG path/name from prompt
 */
export function extractDagDescription(prompt: string): string {
  // Remove common prefixes
  let description = prompt
    .replace(/^(execute|run|start)\s+/i, '')
    .replace(/\s+dag$/i, '')
    .trim();

  // Remove quotes
  description = description.replace(/^["']|["']$/g, '');

  return description;
}
