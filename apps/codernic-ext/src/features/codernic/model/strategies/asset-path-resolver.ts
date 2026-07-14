import { AssetPathStrategy } from './asset-path.strategy';
import { AgentPathStrategy } from './agent-path.strategy';
import { DagPathStrategy } from './dag-path.strategy';
import { TechnologyPathStrategy } from './technology-path.strategy';
import { LlmsPathStrategy } from './llms-path.strategy';
import { RulePathStrategy } from './rule-path.strategy';
import { PromptPathStrategy } from './prompt-path.strategy';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export class AssetPathResolver {
  private static strategies = new Map<string, AssetPathStrategy>();

  static register(type: string, strategy: AssetPathStrategy) {
    this.strategies.set(type, strategy);
  }

  static getStrategy(type: string): AssetPathStrategy {
    let actualType = type;
    if (type === 'llms' || type === 'config/llms') actualType = 'config/llms';
    
    const strategy = this.strategies.get(actualType);
    if (!strategy) {
      throw new Error(`Unknown asset type: ${type}`);
    }
    return strategy;
  }
}

// Register default strategies
AssetPathResolver.register('agent', new AgentPathStrategy());
AssetPathResolver.register('dag', new DagPathStrategy());
AssetPathResolver.register('technology', new TechnologyPathStrategy());
AssetPathResolver.register('config/llms', new LlmsPathStrategy());
AssetPathResolver.register('rule', new RulePathStrategy());
AssetPathResolver.register('prompt', new PromptPathStrategy());
