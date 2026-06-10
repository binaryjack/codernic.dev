import type { ExecutionResult, RunState } from '../types/focused-run.types';

export const FocusedRunPrototype = {
  /**
   * Strictly enforces explicit state machine transitions for the workspace lifecycle.
   */
  validateStateTransition(current: RunState, next: RunState): boolean {
    const transitions: Record<RunState, ReadonlyArray<RunState>> = {
      unmounted: ['mounted'],
      mounted: ['running', 'unmounted'],
      running: ['completed', 'failed'],
      completed: ['unmounted', 'running'], // allow re-running completed tasks
      failed: ['unmounted', 'running'], // allow re-running failed tasks
    };

    return transitions[current].includes(next);
  },

  /**
   * Constructs the structured output block for the UI and AI interpretation.
   */
  buildExecutionResult(
    stdout: string,
    stderr: string,
    exitCode: number,
    startTime: number,
  ): ExecutionResult {
    return {
      stdout,
      stderr,
      exitCode,
      durationMs: Date.now() - startTime,
    };
  },
};
