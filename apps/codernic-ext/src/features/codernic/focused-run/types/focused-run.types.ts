export type RunState = 'unmounted' | 'mounted' | 'running' | 'completed' | 'failed';

export interface VirtualFile {
  readonly relativePath: string;
  readonly content: string;
}

export interface ExecutionResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly durationMs: number;
}

export interface MountConfig {
  readonly workspaceId: string;
  readonly timeoutMs: number;
  readonly envVars: Readonly<Record<string, string>>;
}

/**
 * Dependency injection interface for system operations.
 * Prevents hard-coupling to Node 'child_process' or 'fs',
 * allowing this feature to run in VS Code Web extensions if needed.
 */
export interface SystemAdapter {
  readonly createDirectory: (path: string) => Promise<void>;
  readonly writeFile: (path: string, content: string) => Promise<void>;
  readonly deleteDirectory: (path: string) => Promise<void>;
  readonly execCommand: (
    command: string,
    cwd: string,
    env: Readonly<Record<string, string>>,
    timeoutMs: number,
  ) => Promise<{ readonly stdout: string; readonly stderr: string; readonly exitCode: number }>;
}

export interface FocusedRunWorkspace {
  readonly getState: () => RunState;
  readonly mount: (files: ReadonlyArray<VirtualFile>) => Promise<string>;
  readonly execute: (command: string) => Promise<ExecutionResult>;
  readonly teardown: () => Promise<void>;
}
