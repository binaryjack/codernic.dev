/**
 * codernic-message-handler.test.ts
 *
 * Targeted tests for:
 *   - Step 8: codernic:chat payload must be validated before casting
 *   - Backend CLI spawn validation
 */

import * as path from 'path';

// ─── Module mocks (must appear before imports of the module under test) ───────

jest.mock('fs/promises');
jest.mock('../features/codernic/agent-mode/dag-runner', () => ({
  resolveDagFile: jest.fn().mockResolvedValue(null),
  runDagStream: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../features/codernic/model/analyse-manifest', () => ({
  clearSteps: jest.fn((m: unknown) => m),
  loadManifest: jest.fn().mockResolvedValue({}),
  saveManifest: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../features/codernic/model/analyse-runner', () => ({
  runAnalysis: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../features/codernic/model/intent-detector', () => ({
  detectIntent: jest.fn().mockReturnValue(null),
  getCommandHelp: jest.fn().mockReturnValue('help text'),
}));
jest.mock('../features/codernic/model/journey-handler', () => ({
  confirmPhaseGate: jest.fn(),
  handleJourneyChat: jest.fn().mockResolvedValue(undefined),
  handleJourneyReset: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../features/codernic/model/session-memory', () => ({
  saveSession: jest.fn().mockResolvedValue(undefined),
}));

const mockSpawn = jest.fn();
const mockWrite = jest.fn();
jest.mock('../features/codernic/model/cli-process-manager', () => {
  return {
    CliProcessManager: jest.fn().mockImplementation(() => {
      return {
        spawn: mockSpawn,
        write: mockWrite,
        dispose: jest.fn(),
      };
    }),
  };
});

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import * as fsPromises from 'fs/promises';
import type { CodernicMsg } from '../features/codernic/api/codernic-webview-provider';
import { buildCodernicMessageHandler } from '../features/codernic/model/codernic-message-handler';
import { detectIntent } from '../features/codernic/model/intent-detector';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const vscode = require('vscode') as {
  workspace: {
    fs: {

      readFile: jest.MockedFunction<(uri: { fsPath: string }) => Promise<Uint8Array>>;
      writeFile: jest.MockedFunction<() => Promise<void>>;
      createDirectory: jest.MockedFunction<() => Promise<void>>;
      readDirectory: jest.MockedFunction<(uri: { fsPath: string }) => Promise<any[]>>;
      stat: jest.MockedFunction<(uri: { fsPath: string }) => Promise<any>>;
    };
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOT = path.join(path.parse(process.cwd()).root, 'workspace', 'my-project');

const mockChannel = { appendLine: jest.fn() };

const mockDetectIntent = detectIntent as jest.MockedFunction<typeof detectIntent>;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Default: detectIntent returns null → falls through to CLI
  mockDetectIntent.mockReturnValue(null);
  
  vscode.workspace.fs.stat.mockResolvedValue({});
  vscode.workspace.fs.readFile.mockRejectedValue({ code: 'FileNotFound' });
  vscode.workspace.fs.createDirectory.mockResolvedValue();
  vscode.workspace.fs.writeFile.mockResolvedValue();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeHandler = () => buildCodernicMessageHandler(ROOT, mockChannel);

const validChatMsg = (
  overrides?: Partial<{ llmId: string; history: { role: string; text: string }[]; mode: string }>,
): CodernicMsg => ({
  type: 'codernic:chat',
  payload: {
    llmId: 'custom:test-model',
    history: [{ role: 'user', text: 'Hello, what is the tech stack?' }],
    mode: 'ask',
    ...overrides,
  },
});

// ─── Step 8: Payload guard ────────────────────────────────────────────────────

describe('codernic:chat — payload guard', () => {
  it('replies codernic:error when payload is null', async () => {
    const handler = makeHandler();
    const reply = jest.fn();

    await handler({ type: 'codernic:chat', payload: null } as unknown as CodernicMsg, reply);

    const calls = reply.mock.calls.map((c: unknown[]) => c[0] as CodernicMsg);
    const errorReply = calls.find((c) => c.type === 'codernic:error');
    expect(errorReply).toBeDefined();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('replies codernic:error when payload.history is undefined', async () => {
    const handler = makeHandler();
    const reply = jest.fn();

    await handler(
      { type: 'codernic:chat', payload: { llmId: 'test', mode: 'ask' } } as unknown as CodernicMsg,
      reply,
    );

    const calls = reply.mock.calls.map((c: unknown[]) => c[0] as CodernicMsg);
    const errorReply = calls.find((c) => c.type === 'codernic:error');
    expect(errorReply).toBeDefined();
    expect(mockSpawn).not.toHaveBeenCalled();
  });
});

describe('codernic:chat — valid message to backend CLI', () => {
  it('valid chat forwards to CliProcessManager', async () => {
    const handler = makeHandler();
    const reply = jest.fn();
    
    // We mock the promise to not hang forever, the handler returns a Promise that resolves when done, but in this mock, it's just fired.
    // Actually we can just run it without awaiting the full lifecycle since spawn is synchronous to start.
    const promise = handler(validChatMsg({ mode: 'ask' }), reply);
    
    // allow event loop to process
    await new Promise(r => setTimeout(r, 0));
    
    expect(mockSpawn).toHaveBeenCalled();
    const args = mockSpawn.mock.calls[0][0];
    expect(args).toContain('chat');
    expect(args).toContain('--mode');
    expect(args).toContain('ask');
    
    expect(mockWrite).toHaveBeenCalled();
  });
});

describe('codernic:chat — memory slash commands execution', () => {
  it('executes read-project-memory natively and returns results', async () => {
    mockDetectIntent.mockReturnValue({ type: 'read-project-memory', spec: '' });
    const handler = makeHandler();
    const reply = jest.fn();

    vscode.workspace.fs.readFile.mockResolvedValue(Buffer.from('# Mock Memory Content'));
    vscode.workspace.fs.readDirectory.mockResolvedValue([]);

    await handler(validChatMsg({ history: [{ role: 'user', text: '/read-project-memory' }] }), reply);

    const calls = reply.mock.calls.map((c: unknown[]) => c[0] as CodernicMsg);
    const streamCalls = calls.filter((c) => c.type === 'codernic:stream-chunk');
    expect(streamCalls.length).toBeGreaterThan(0);
    
    expect(mockSpawn).not.toHaveBeenCalled();
  });
});
