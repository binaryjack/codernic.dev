import { ActionStrategy, ActionStrategyResult, HighlightStrategy, TypewriterStrategy, ClickStrategy, IntrospectionStrategy, GoToPageStrategy, InjectDataStrategy } from './ActionStrategy';
import { DispatchStrategy } from './DispatchStrategy';
import { StepAction } from './StateMachine';
import { SequencerLogger } from './SequencerLogger';

export class ActionChain {
  private strategies: ActionStrategy[] = [];
  private lastInjectedTarget: string | null = null;

  private dispatchStrategy: DispatchStrategy;
  private injectDataStrategy: InjectDataStrategy;

  constructor() {
    this.dispatchStrategy = new DispatchStrategy();
    this.injectDataStrategy = new InjectDataStrategy();
    
    // Pre-register default strategies
    this.strategies = [
      new HighlightStrategy(),
      new TypewriterStrategy(),
      new ClickStrategy(),
      new IntrospectionStrategy(),
      new GoToPageStrategy(),
      this.injectDataStrategy,
      this.dispatchStrategy
    ];
  }

  public setDispatchHandler(handler: (action: any) => void) {
    this.dispatchStrategy.setHandler(handler);
    this.injectDataStrategy.setHandler(handler);
  }

  public registerStrategy(strategy: ActionStrategy) {
    this.strategies.push(strategy);
  }

  public async executeStep(step: StepAction, element: HTMLElement | null): Promise<ActionStrategyResult> {
    const targetString = Array.isArray(step.target) ? step.target.join(', ') : step.target;
    
    // Warning: Data injected but not highlighted
    if (step.action === 'highlight' && this.lastInjectedTarget) {
      // If we previously injected data but the next visual highlight is for a totally unrelated system, issue a warning.
      // (This is a naive check; ideally it uses component hierarchies, but works as a structural warning)
      if (this.lastInjectedTarget !== 'system-root' && this.lastInjectedTarget !== targetString) {
         SequencerLogger.warning(step, `Data was previously injected into [${this.lastInjectedTarget}] but the very next highlight targets [${targetString}]. Was this intended?`);
      }
      this.lastInjectedTarget = null; // Clear it after the first highlight
    } else if (step.action === 'introspection' || step.action === 'dispatch') {
      this.lastInjectedTarget = targetString;
    }

    SequencerLogger.info(step, `Executing step: ${step.id || step.action} on target: ${targetString}`);
    
    for (const strategy of this.strategies) {
      if (strategy.canHandle(step.action)) {
        return await strategy.execute(step, element);
      }
    }
    
    SequencerLogger.error(step, `No strategy found for action type: ${step.action}`);
    return {};
  }
}
