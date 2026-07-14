/**
 * @file analyzer.ts
 * @description ASK mode analyzer — AI Agencee intelligence for codebase analysis
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { callMcpTool, type McpClientInstance } from '../../../shared/mcp';
import { ConfigPaths } from '../../../shared/utils/config-paths';

export interface AgentInfo {
  name: string;
  file: string;
  capabilities: string[];
  description?: string;
}

export interface DagInfo {
  name: string;
  file: string;
  description?: string;
  laneCount: number;
  lanes: string[];
}

export interface ProjectIntelligence {
  techStack?: {
    languages?: string[];
    frameworks?: string[];
    packageManager?: string;
    runtime?: string;
  };
  architecture?: {
    type?: string;
    packages?: number;
    workspaces?: string[];
  };
  standards?: {
    typescript?: boolean;
    strictMode?: boolean;
    eslint?: boolean;
    prettier?: boolean;
  };
}

export interface AnalysisResult {
  intelligence: ProjectIntelligence;
  agents: AgentInfo[];
  dags: DagInfo[];
  codeContext: string;
  recommendations: string[];
}

/**
 * Discover available agents in .agencee/agents/
 */
async function discoverAgents(workspaceRoot: string): Promise<AgentInfo[]> {
  const agentsDirs = ConfigPaths.resolveDirectories(workspaceRoot, 'agents');
  const agents: AgentInfo[] = [];

  for (const agentsPath of agentsDirs) {
    try {
      const files = await fs.readdir(agentsPath);
      const agentFiles = files.filter((f) => f.endsWith('.agent.json') && !f.includes('.'));

      for (const file of agentFiles) {
        try {
          const content = await fs.readFile(path.join(agentsPath, file), 'utf-8');
          const agentSpec = JSON.parse(content);
          agents.push({
            name: agentSpec.name || file.replace('.agent.json', ''),
            file,
            capabilities: agentSpec.capabilities || [],
            description: agentSpec.description,
          });
        } catch {
          // Skip malformed agent files
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return agents;
}

/**
 * Discover available DAGs in .agencee/dags/
 */
async function discoverDags(workspaceRoot: string): Promise<DagInfo[]> {
  const agentsDirs = ConfigPaths.resolveDirectories(workspaceRoot, 'dags');
  const dags: DagInfo[] = [];

  const findDagFiles = async (dir: string): Promise<string[]> => {
    const results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await findDagFiles(fullPath)));
        } else if (entry.name.endsWith('.dag.json')) {
          results.push(fullPath);
        }
      }
    } catch {
      // ignore
    }
    return results;
  };

  for (const agentsPath of agentsDirs) {
    const dagFiles = await findDagFiles(agentsPath);

    for (const file of dagFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const dagSpec = JSON.parse(content);
        dags.push({
          name: dagSpec.name || path.basename(file, '.dag.json'),
          file: path.relative(workspaceRoot, file),
          description: dagSpec.description,
          laneCount: dagSpec.lanes?.length || 0,
          lanes: dagSpec.lanes?.map((l: any) => l.id) || [],
        });
      } catch {
        // Skip malformed DAG files
      }
    }
  }

  return dags;
}

/**
 * Gather project intelligence from package.json, tsconfig.json, etc.
 */
async function gatherProjectIntelligence(workspaceRoot: string): Promise<ProjectIntelligence> {
  const intelligence: ProjectIntelligence = {
    techStack: {},
    architecture: {},
    standards: {},
  };

  try {
    // Check package.json
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      // Detect frameworks
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const frameworks: string[] = [];

      if (deps['react']) frameworks.push('React ' + deps['react']);
      if (deps['vue']) frameworks.push('Vue ' + deps['vue']);
      if (deps['@angular/core']) frameworks.push('Angular');
      if (deps['next']) frameworks.push('Next.js ' + deps['next']);
      if (deps['express']) frameworks.push('Express ' + deps['express']);
      if (deps['fastify']) frameworks.push('Fastify ' + deps['fastify']);
      if (deps['@reduxjs/toolkit']) frameworks.push('Redux Toolkit');

      intelligence.techStack!.frameworks = frameworks;

      // Package manager
      if (packageJson.packageManager) {
        intelligence.techStack!.packageManager = packageJson.packageManager;
      }

      // Workspaces (monorepo)
      if (packageJson.workspaces) {
        intelligence.architecture!.type = 'monorepo';
        intelligence.architecture!.workspaces = Array.isArray(packageJson.workspaces)
          ? packageJson.workspaces
          : packageJson.workspaces.packages;
      }
    } catch {
      // No package.json
    }

    // Check tsconfig.json
    const tsconfigPath = path.join(workspaceRoot, 'tsconfig.json');
    try {
      const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));
      intelligence.standards!.typescript = true;
      intelligence.standards!.strictMode = tsconfig.compilerOptions?.strict === true;
      intelligence.techStack!.languages = ['TypeScript'];
    } catch {
      // No TypeScript
      intelligence.techStack!.languages = ['JavaScript'];
    }

    // Check for linters/formatters
    try {
      await fs.access(path.join(workspaceRoot, '.eslintrc.json'));
      intelligence.standards!.eslint = true;
    } catch {
      try {
        await fs.access(path.join(workspaceRoot, '.eslintrc.js'));
        intelligence.standards!.eslint = true;
      } catch {
        // No ESLint
      }
    }

    try {
      await fs.access(path.join(workspaceRoot, '.prettierrc'));
      intelligence.standards!.prettier = true;
    } catch {
      // No Prettier
    }
  } catch {
    // Failed to gather intelligence
  }

  return intelligence;
}

/**
 * Generate actionable recommendations based on project state
 */
function generateRecommendations(
  intelligence: ProjectIntelligence,
  agents: AgentInfo[],
  dags: DagInfo[],
): string[] {
  const recommendations: string[] = [];

  // DAG recommendations
  if (dags.length > 0) {
    const hasSecurity = dags.some(
      (d) => d.name.toLowerCase().includes('audit') || d.name.toLowerCase().includes('security'),
    );
    if (!hasSecurity) {
      recommendations.push('Run security audit → Use: `@codernic /agent "Run audit DAG"`');
    }

    const hasBoilerplate = dags.some((d) => d.name.toLowerCase().includes('boilerplate'));
    if (hasBoilerplate) {
      recommendations.push('Create new app → Run: `@codernic /agent "Run boilerplate DAG"`');
    }
  }

  // Agent recommendations
  if (agents.length > 0) {
    recommendations.push('Add new feature → Use: `@codernic /plan "Feature description"`');
  } else {
    recommendations.push(
      'No agents found. Create your first agent with: `@codernic /create-agent`',
    );
  }

  // Tech stack recommendations
  if (intelligence.standards?.typescript && !intelligence.standards?.strictMode) {
    recommendations.push('Enable TypeScript strict mode for better type safety');
  }

  return recommendations;
}

/**
 * Main export: Analyze project through AI Agencee lens
 */
export async function analyzeProject(
  workspaceRoot: string,
  query: string,
  mcpClient: McpClientInstance | null,
  codeContext: string,
): Promise<AnalysisResult> {
  // Gather all intelligence sources
  const [intelligence, agents, dags] = await Promise.all([
    gatherProjectIntelligence(workspaceRoot),
    discoverAgents(workspaceRoot),
    discoverDags(workspaceRoot),
  ]);

  // Try MCP analyze-project if available
  if (mcpClient) {
    try {
      const result = await callMcpTool(mcpClient, {
        name: 'analyze-project',
        arguments: { projectRoot: workspaceRoot },
      });

      // Merge MCP results with local intelligence
      if (result.content && result.content.length > 0) {
        const textContent = result.content
          .filter((c: any) => c.type === 'text' && 'text' in c)
          .map((c: any) => c.text)
          .join('');

        if (textContent) {
          const mcpAnalysis = JSON.parse(textContent);

          // Deep merge tech stack
          if (mcpAnalysis.intelligence?.techStack) {
            intelligence.techStack = {
              ...intelligence.techStack,
              ...mcpAnalysis.intelligence.techStack,
              languages: [
                ...new Set([
                  ...(intelligence.techStack?.languages || []),
                  ...(mcpAnalysis.intelligence.techStack.languages || []),
                ]),
              ],
              frameworks: [
                ...new Set([
                  ...(intelligence.techStack?.frameworks || []),
                  ...(mcpAnalysis.intelligence.techStack.frameworks || []),
                ]),
              ],
            };
          }

          // Merge architecture
          if (mcpAnalysis.intelligence?.architecture) {
            intelligence.architecture = {
              ...intelligence.architecture,
              ...mcpAnalysis.intelligence.architecture,
            };
          }

          // Merge standards
          if (mcpAnalysis.intelligence?.standards) {
            intelligence.standards = {
              ...intelligence.standards,
              ...mcpAnalysis.intelligence.standards,
            };
          }
        }
      }
    } catch {
      // MCP analyze-project not available or failed, use local intelligence
    }
  }

  const recommendations = generateRecommendations(intelligence, agents, dags);

  return {
    intelligence,
    agents,
    dags,
    codeContext,
    recommendations,
  };
}

/**
 * Format analysis result as markdown for display
 */
export function formatAnalysisResult(result: AnalysisResult): string {
  const sections: string[] = [];

  sections.push('📊 **AI Agencee Project Intelligence**\n');

  // Tech Stack
  if (result.intelligence.techStack) {
    sections.push('**Tech Stack**:');
    if (result.intelligence.techStack.languages) {
      sections.push(`- Languages: ${result.intelligence.techStack.languages.join(', ')}`);
    }
    if (
      result.intelligence.techStack.frameworks &&
      result.intelligence.techStack.frameworks.length > 0
    ) {
      sections.push(`- Frameworks: ${result.intelligence.techStack.frameworks.join(', ')}`);
    }
    if (result.intelligence.techStack.packageManager) {
      sections.push(`- Package Manager: ${result.intelligence.techStack.packageManager}`);
    }
    sections.push('');
  }

  // Architecture
  if (result.intelligence.architecture?.type) {
    sections.push('**Architecture**:');
    sections.push(`- Type: ${result.intelligence.architecture.type}`);
    if (result.intelligence.architecture.workspaces) {
      sections.push(`- Workspaces: ${result.intelligence.architecture.workspaces.length} packages`);
    }
    sections.push('');
  }

  // Standards
  if (result.intelligence.standards) {
    const standards: string[] = [];
    if (result.intelligence.standards.typescript) {
      standards.push(`TypeScript${result.intelligence.standards.strictMode ? ' (strict ✓)' : ''}`);
    }
    if (result.intelligence.standards.eslint) standards.push('ESLint');
    if (result.intelligence.standards.prettier) standards.push('Prettier');

    if (standards.length > 0) {
      sections.push(`**Standards**: ${standards.join(', ')}\n`);
    }
  }

  // Available Agents
  if (result.agents.length > 0) {
    sections.push(`**Available Agents** (${result.agents.length} discovered):`);
    for (const agent of result.agents.slice(0, 10)) {
      // Show max 10
      const caps =
        agent.capabilities.length > 0 ? agent.capabilities.slice(0, 3).join(', ') : 'general';
      sections.push(`- \`${agent.name}\` — ${agent.description || caps}`);
    }
    if (result.agents.length > 10) {
      sections.push(`... and ${result.agents.length - 10} more`);
    }
    sections.push('');
  }

  // Existing DAGs
  if (result.dags.length > 0) {
    sections.push(`**Existing DAGs** (${result.dags.length} discovered):`);
    for (const dag of result.dags.slice(0, 5)) {
      // Show max 5
      sections.push(
        `- \`${dag.name}\` — ${dag.laneCount} lanes (${dag.lanes.slice(0, 3).join(', ')}${dag.lanes.length > 3 ? '...' : ''})`,
      );
      if (dag.description) {
        sections.push(`  _${dag.description}_`);
      }
    }
    if (result.dags.length > 5) {
      sections.push(`... and ${result.dags.length - 5} more`);
    }
    sections.push('');
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    sections.push('**Recommendations**:');
    for (const rec of result.recommendations) {
      sections.push(`✅ ${rec}`);
    }
  }

  return sections.join('\n');
}
