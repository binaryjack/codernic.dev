import type { StepAction } from '../../core/StateMachine';

export interface PageStrategy {
  /**
   * Generates the sequence states for this specific page tour.
   * Keys should be globally unique, e.g., 'sessions_welcome'.
   */
  getSequence(): Record<string, StepAction>;
  
  /**
   * Optionally returns Redux actions or initialization payloads to be executed
   * right before the first step of this sequence.
   */
  getInitActions?(): any[];

  /**
   * The entry point key for this sequence to be linked from the previous page.
   */
  getEntryKey(): string;
}
