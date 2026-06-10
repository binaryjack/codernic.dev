export interface DagLane {
  id: string;
  agentFile: string;
  dependsOn: string[];
  capabilities: string[];
}

export interface DagBudget {
  maxUSD: number;
}

export interface DagConfig {
  $schema?: string;
  name: string;
  description: string;
  lanes: DagLane[];
  budget: DagBudget;
  modelRouterFile: string;
}
