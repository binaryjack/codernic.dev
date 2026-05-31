/**
 * @file dag-generator.ts
 * @description PLAN mode DAG generator — Convert natural language to executable DAG specs
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { type McpClientInstance } from '../../../shared/mcp';

export interface LaneSpec {
  id: string;
  agentFile: string;
  supervisorFile?: string;
  dependsOn: string[];
  capabilities: string[];
}

export interface BarrierSpec {
  name: string;
  participants: string[];
  timeoutMs: number;
}

export interface DagSpecification {
  name: string;
  description: string;
  lanes: LaneSpec[];
  globalBarriers: BarrierSpec[];
  capabilityRegistry: Record<string, string[]>;
  modelRouterFile?: string;
}

export interface FeatureAnalysis {
  featureName: string;
  complexity: 'simple' | 'medium' | 'complex';
  affectedComponents: string[];
  estimatedLanes: number;
}

export interface DagGenerationResult {
  dagPath: string;
  dagSpec: DagSpecification;
  estimatedDuration: string;
  estimatedCost: string;
}

/**
 * Analyze feature requirements from natural language description
 */
function analyzeFeatureRequirements(description: string): FeatureAnalysis {
  const lower = description.toLowerCase();

  // Detect affected components
  const components: string[] = [];
  if (
    lower.includes('database') ||
    lower.includes('schema') ||
    lower.includes('migration') ||
    lower.includes('table')
  ) {
    components.push('database');
  }
  if (
    lower.includes('api') ||
    lower.includes('endpoint') ||
    lower.includes('route') ||
    lower.includes('backend') ||
    lower.includes('server')
  ) {
    components.push('backend');
  }
  if (
    lower.includes('ui') ||
    lower.includes('frontend') ||
    lower.includes('component') ||
    lower.includes('page') ||
    lower.includes('form')
  ) {
    components.push('frontend');
  }
  if (lower.includes('test') || lower.includes('e2e') || lower.includes('integration')) {
    components.push('testing');
  }
  if (lower.includes('doc') || lower.includes('documentation')) {
    components.push('documentation');
  }

  // If no components detected, assume full-stack
  if (components.length === 0) {
    components.push('backend', 'frontend', 'testing');
  }

  // Determine complexity
  let complexity: 'simple' | 'medium' | 'complex' = 'medium';
  if (components.length === 1) {
    complexity = 'simple';
  } else if (components.length >= 4) {
    complexity = 'complex';
  }

  // Extract feature name
  const featureName = description
    .replace(/^(add|create|implement|build|make)\s+/i, '')
    .replace(/\s+to\s+.*/i, '')
    .trim()
    .slice(0, 50);

  return {
    featureName,
    complexity,
    affectedComponents: components,
    estimatedLanes: components.length + 1, // +1 for integration/testing
  };
}

/**
 * Identify required agents based on components
 */
async function identifyRequiredAgents(
  analysis: FeatureAnalysis,
  workspaceRoot: string,
): Promise<Map<string, string>> {
  const agentMap = new Map<string, string>();

  // Standard agent mapping
  const standardAgents: Record<string, string> = {
    database: 'database-agent.agent.json',
    backend: 'backend-agent.agent.json',
    frontend: 'frontend-agent.agent.json',
    testing: 'testing-agent.agent.json',
    documentation: 'documentation-agent.agent.json',
    integration: 'integration-agent.agent.json',
    security: 'security-agent.agent.json',
  };

  // Check which agents actually exist
  const agentsPath = path.join(workspaceRoot, '.agencee', 'config', 'agents');

  for (const component of analysis.affectedComponents) {
    const agentFile = standardAgents[component];
    if (agentFile) {
      try {
        await fs.access(path.join(agentsPath, agentFile));
        agentMap.set(component, agentFile);
      } catch {
        // Agent doesn't exist, use generic one
        agentMap.set(component, 'generic-agent.agent.json');
      }
    }
  }

  // Always add testing at the end if not already included
  if (!agentMap.has('testing') && analysis.affectedComponents.length > 1) {
    try {
      await fs.access(path.join(agentsPath, standardAgents.testing));
      agentMap.set('testing', standardAgents.testing);
    } catch {
      // No testing agent available
    }
  }

  return agentMap;
}

/**
 * Generate lane structure with dependencies
 */
function generateLanes(analysis: FeatureAnalysis, agentMap: Map<string, string>): LaneSpec[] {
  const lanes: LaneSpec[] = [];

  // Define dependency ordering
  const ordering: Record<string, number> = {
    database: 1,
    backend: 2,
    frontend: 3,
    testing: 4,
    documentation: 5,
    integration: 6,
  };

  // Sort components by ordering
  const sortedComponents = Array.from(agentMap.keys()).sort((a, b) => {
    return (ordering[a] || 99) - (ordering[b] || 99);
  });

  // Generate lanes
  for (let i = 0; i < sortedComponents.length; i++) {
    const component = sortedComponents[i];
    const agentFile = agentMap.get(component)!;

    // Determine dependencies
    const dependsOn: string[] = [];

    // Database always goes first
    if (component === 'backend' && agentMap.has('database')) {
      dependsOn.push('database-lane');
    }

    // Frontend depends on backend (but will sync via barrier)
    // Testing depends on all implementation lanes
    if (component === 'testing') {
      dependsOn.push(...sortedComponents.slice(0, i).map((c) => `${c}-lane`));
    }

    // Documentation depends on everything
    if (component === 'documentation') {
      dependsOn.push(...sortedComponents.slice(0, i).map((c) => `${c}-lane`));
    }

    lanes.push({
      id: `${component}-lane`,
      agentFile,
      supervisorFile: agentFile.replace('.agent.json', '.supervisor.json'),
      dependsOn,
      capabilities: [component],
    });
  }

  return lanes;
}

/**
 * Define synchronization barriers
 */
function defineBarriers(lanes: LaneSpec[]): BarrierSpec[] {
  const barriers: BarrierSpec[] = [];

  // Find backend and frontend lanes for API contract sync
  const hasBackend = lanes.some((l) => l.id === 'backend-lane');
  const hasFrontend = lanes.some((l) => l.id === 'frontend-lane');

  if (hasBackend && hasFrontend) {
    barriers.push({
      name: 'api-contract-aligned',
      participants: ['backend-lane', 'frontend-lane'],
      timeoutMs: 15000,
    });
  }

  // Implementation complete barrier before testing
  const hasTesting = lanes.some((l) => l.id === 'testing-lane');
  if (hasTesting) {
    const implementationLanes = lanes
      .filter((l) => !l.id.includes('testing') && !l.id.includes('documentation'))
      .map((l) => l.id);

    if (implementationLanes.length > 1) {
      barriers.push({
        name: 'implementation-complete',
        participants: implementationLanes,
        timeoutMs: 30000,
      });
    }
  }

  return barriers;
}

/**
 * Build capability registry
 */
function buildCapabilityRegistry(lanes: LaneSpec[]): Record<string, string[]> {
  const registry: Record<string, string[]> = {};

  for (const lane of lanes) {
    for (const capability of lane.capabilities) {
      if (!registry[capability]) {
        registry[capability] = [];
      }
      registry[capability].push(lane.id);
    }
  }

  return registry;
}

/**
 * Estimate execution duration
 */
function estimateDuration(lanes: LaneSpec[]): string {
  // Rough estimate: 2-3 minutes per lane, accounting for parallelization
  const maxDepth = calculateMaxDepth(lanes);
  const avgMinutesPerLane = 2.5;
  const totalMinutes = Math.ceil(maxDepth * avgMinutesPerLane);

  return `${totalMinutes}-${totalMinutes + 3} minutes`;
}

/**
 * Calculate max dependency depth
 */
function calculateMaxDepth(lanes: LaneSpec[]): number {
  const depths = new Map<string, number>();

  // Initialize all to 1
  lanes.forEach((l) => depths.set(l.id, 1));

  // Calculate depths
  let changed = true;
  while (changed) {
    changed = false;
    for (const lane of lanes) {
      if (lane.dependsOn.length > 0) {
        const maxDepDep = Math.max(...lane.dependsOn.map((d) => depths.get(d) || 1));
        const newDepth = maxDepDep + 1;
        if (newDepth > (depths.get(lane.id) || 1)) {
          depths.set(lane.id, newDepth);
          changed = true;
        }
      }
    }
  }

  return Math.max(...Array.from(depths.values()));
}

/**
 * Estimate cost
 */
function estimateCost(lanes: LaneSpec[]): string {
  // Rough estimate: $0.03-$0.05 per lane
  const minCost = (lanes.length * 0.03).toFixed(2);
  const maxCost = (lanes.length * 0.05).toFixed(2);
  return `$${minCost}-$${maxCost}`;
}

/**
 * Convert to kebab-case
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Main export: Generate DAG from feature description
 */
export async function generateDag(
  featureDescription: string,
  workspaceRoot: string,
  mcpClient: McpClientInstance | null,
  codeContext?: string,
): Promise<DagGenerationResult> {
  // 1. Analyze feature requirements
  const analysis = analyzeFeatureRequirements(featureDescription);

  // 2. Identify required agents
  const requiredAgents = await identifyRequiredAgents(analysis, workspaceRoot);

  // 3. Generate lane structure
  const lanes = generateLanes(analysis, requiredAgents);

  // 4. Define barriers
  const barriers = defineBarriers(lanes);

  // 5. Create DAG specification
  const dagSpec: DagSpecification = {
    name: analysis.featureName,
    description: featureDescription,
    lanes,
    globalBarriers: barriers,
    capabilityRegistry: buildCapabilityRegistry(lanes),
    modelRouterFile: '../model-router.json',
  };

  // 6. Save DAG file
  const dagFileName = kebabCase(analysis.featureName) + '.dag.json';
  const dagPath = path.join(workspaceRoot, '.agencee', 'config', 'agents', dagFileName);

  // Ensure directory exists
  await fs.mkdir(path.dirname(dagPath), { recursive: true });

  // Write DAG file
  await fs.writeFile(dagPath, JSON.stringify(dagSpec, null, 2), 'utf-8');

  return {
    dagPath,
    dagSpec,
    estimatedDuration: estimateDuration(lanes),
    estimatedCost: estimateCost(lanes),
  };
}

/**
 * Format DAG plan as markdown for display
 */
export function formatDagPlan(result: DagGenerationResult): string {
  const sections: string[] = [];

  sections.push('🏗️ **Generated DAG Plan**\n');
  sections.push(`**Feature**: ${result.dagSpec.name}`);
  sections.push(`**Description**: ${result.dagSpec.description}`);
  sections.push(`**Estimated Duration**: ${result.estimatedDuration}`);
  sections.push(`**Estimated Cost**: ${result.estimatedCost}\n`);

  // Lanes
  sections.push('**Lanes**:\n');
  for (let i = 0; i < result.dagSpec.lanes.length; i++) {
    const lane = result.dagSpec.lanes[i];
    sections.push(`${i + 1}. **${lane.id}** (${lane.agentFile.replace('.agent.json', '')})`);
    sections.push(`   - Capabilities: ${lane.capabilities.join(', ')}`);
    if (lane.dependsOn.length > 0) {
      sections.push(`   - Dependencies: ${lane.dependsOn.join(', ')}`);
    }
    sections.push('');
  }

  // Barriers
  if (result.dagSpec.globalBarriers.length > 0) {
    sections.push('**Synchronization Barriers**:\n');
    for (const barrier of result.dagSpec.globalBarriers) {
      sections.push(
        `- \`${barrier.name}\` — Sync ${barrier.participants.join(' + ')} (timeout: ${barrier.timeoutMs}ms)`,
      );
    }
    sections.push('');
  }

  // Capability Registry
  sections.push('**Capability Registry**:\n');
  for (const [capability, laneIds] of Object.entries(result.dagSpec.capabilityRegistry)) {
    sections.push(`- \`${capability}\`: [${laneIds.join(', ')}]`);
  }
  sections.push('');

  // Saved location
  sections.push(`✅ **Saved**: \`${result.dagPath}\`\n`);

  // Next steps
  sections.push('**Ready to execute?**');
  sections.push(`Run: \`@codernic /agent "Execute ${result.dagSpec.name} DAG"\``);

  return sections.join('\n');
}
