import { ActionStrategy, ActionStrategyResult } from './ActionStrategy';
import { StepAction } from './StateMachine';
import { SequencerLogger } from './SequencerLogger';

export class DispatchStrategy implements ActionStrategy {
  private dispatchHandler?: (action: any) => void;

  constructor(handler?: (action: any) => void) {
    this.dispatchHandler = handler;
  }

  public setHandler(handler: (action: any) => void) {
    this.dispatchHandler = handler;
  }

  canHandle(actionType: string): boolean {
    return actionType === 'dispatch';
  }

  async execute(step: StepAction, element: HTMLElement | null): Promise<ActionStrategyResult> {
    if (!this.dispatchHandler) {
      SequencerLogger.error(step, 'DispatchStrategy cannot execute: No onDispatch handler was provided to SequencerProvider.');
      return {};
    }

    if (!step.payload) {
      SequencerLogger.error(step, 'DispatchStrategy missing payload: No action object provided in step.payload.');
      return {};
    }

    SequencerLogger.info(step, `Dispatching state mutation...`);
    
    // Support batch dispatching
    if (Array.isArray(step.payload)) {
       step.payload.forEach(action => this.dispatchHandler!(action));
    } else {
       this.dispatchHandler(step.payload);
    }

    return {};
  }
}
