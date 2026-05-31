import type {
  FocusedRunWorkspace,
  MountConfig,
  SystemAdapter,
  VirtualFile,
  RunState,
  ExecutionResult,
} from '../types/focused-run.types';
import { FocusedRunPrototype } from './focused-run';

/**
 * Creates an ephemeral, isolated workspace capable of mounting virtual files
 * and executing code prior to it being committed back to the host editor.
 * Uses Dependency Injection (SystemAdapter) to ensure cross-platform capabilities
 * and 0 monolith dependencies.
 */
export function createFocusedRunWorkspace(
  config: MountConfig,
  system: SystemAdapter,
): FocusedRunWorkspace {
  // Private Closure State encapsulation
  let currentState: RunState = 'unmounted';
  const mountPath = `/tmp/codernic-run-${config.workspaceId}`;

  const instance = Object.create(FocusedRunPrototype);

  const setState = (next: RunState): void => {
    if (!instance.validateStateTransition(currentState, next)) {
      throw new Error(`Invalid state transition from ${currentState} to ${next}`);
    }
    currentState = next;
  };

  instance.getState = function (): RunState {
    return currentState;
  };

  instance.mount = async function (files: ReadonlyArray<VirtualFile>): Promise<string> {
    if (currentState !== 'unmounted') throw new Error('Workspace is already mounted');

    await system.createDirectory(mountPath);
    for (const file of files) {
      await system.writeFile(`${mountPath}/${file.relativePath}`, file.content);
    }

    setState('mounted');
    return mountPath;
  };

  instance.execute = async function (command: string): Promise<ExecutionResult> {
    if (currentState === 'unmounted') throw new Error('Workspace must be mounted to execute');
    if (currentState === 'running') throw new Error('Existing process is currently running');

    setState('running');
    const startTime = Date.now();

    try {
      const { stdout, stderr, exitCode } = await system.execCommand(
        command,
        mountPath,
        config.envVars,
        config.timeoutMs,
      );

      setState(exitCode === 0 ? 'completed' : 'failed');
      return this.buildExecutionResult(stdout, stderr, exitCode, startTime);
    } catch (err: unknown) {
      setState('failed');
      const errorMessage = err instanceof Error ? err.message : String(err);
      return this.buildExecutionResult('', errorMessage, 1, startTime);
    }
  };

  instance.teardown = async function (): Promise<void> {
    // Only attempt teardown if actually mounted to a system path
    if (currentState !== 'unmounted') {
      await system.deleteDirectory(mountPath);
      // Force unmounted override on teardown regardless of current status
      currentState = 'unmounted';
    }
  };

  return instance as FocusedRunWorkspace;
}
