import type { IDagSequenceStrategy } from '../i-dag-sequence';
import { DagMutationStrategy } from './dag-mutation-strategy';
import { DagInitializedStrategy } from './start';
import { StepFailedStrategy } from './step-failed-strategy';
import { StepStartStrategy } from './step-start-strategy';
import { StepSuccessStrategy } from './step-success-strategy';

export class DagStrategyRegistry {
  private strategies: Record<string, IDagSequenceStrategy<unknown>> = {
    dag_initialized: new DagInitializedStrategy() as IDagSequenceStrategy<unknown>,
    step_start: new StepStartStrategy() as IDagSequenceStrategy<unknown>,
    step_success: new StepSuccessStrategy() as IDagSequenceStrategy<unknown>,
    step_failed: new StepFailedStrategy() as IDagSequenceStrategy<unknown>,
    dag_mutation: new DagMutationStrategy() as IDagSequenceStrategy<unknown>,
  };

  getStrategy(type: string): IDagSequenceStrategy<unknown> | undefined {
    return this.strategies[type];
  }
}

export const dagStrategyRegistry = new DagStrategyRegistry();
