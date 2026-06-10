/**
 * codernic-message-handler.test.ts
 *
 * Targeted tests for:
 *   - Step 5: loadSystemInstructions should use vscode.workspace.fs (not Node fs)
 *   - Step 8: codernic:chat payload must be validated before casting
 *
 * Tests 1–3 are RED before Phase 2 + Phase 3 fixes.
 * Tests 4–5 are green regressions — must stay passing throughout.
 */

import * as path from 'path';

// ─── Module mocks (must appear before imports of the module under test) ───────

jest.mock('fs/promises');
jest.mock('../shared/api/llm-utils', () => ({
  broadcastLlms: jest.fn().mockResolvedValue([]),
  streamChat: jest.fn().mockResolvedValue(undefined),
}));
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

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import * as fsPromises from 'fs/promises';
import type { CodernicMsg } from '../features/codernic/api/codernic-webview-provider';
import { buildCodernicMessageHandler } from '../features/codernic/model/codernic-message-handler';
import { detectIntent } from '../features/codernic/model/intent-detector';
import { streamChat } from '../shared/api/llm-utils';

// Use require() (not jest.requireMock) so we get the SAME instance the
// production modules use at runtime (moduleNameMapper routes both to the mock).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vscode = require('vscode') as {
  workspace: {
    fs: {
      readFile: jest.MockedFunction<(uri: { fsPath: string }) => Promise<Uint8Array>>;
      writeFile: jest.MockedFunction<() => Promise<void>>;
      createDirectory: jest.MockedFunction<() => Promise<void>>;
      readDirectory: jest.MockedFunction<(uri: { fsPath: string }) => Promise<any[]>>;
    };
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOT = path.join(path.parse(process.cwd()).root, 'workspace', 'my-project');

const mockChannel = { appendLine: jest.fn() };

const mockDetectIntent = detectIntent as jest.MockedFunction<typeof detectIntent>;
const mockStreamChat = streamChat as jest.MockedFunction<typeof streamChat>;
const mockFsReadFile = fsPromises.readFile as jest.MockedFunction<typeof fsPromises.readFile>;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Default: detectIntent returns null → falls through to LLM chat
  mockDetectIntent.mockReturnValue(null);
  // Default: streamChat resolves immediately
  mockStreamChat.mockResolvedValue(undefined);
  // Default: vscode.workspace.fs.readFile → FileNotFound
  vscode.workspace.fs.readFile.mockRejectedValue({ code: 'FileNotFound' });
  // Default: Node fs.readFile → ENOENT
  mockFsReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeHandler = () => buildCodernicMessageHandler(ROOT, mockChannel);

const validChatMsg = (
  overrides?: Partial<{ llmId: string; history: { role: string; text: string }[]; mode: string }>,
): CodernicMsg => ({
  type: 'codernic:chat',
  payload: {
    llmId: 'test-model',
    history: [{ role: 'user', text: 'Hello, what is the tech stack?' }],
    mode: 'ask',
    ...overrides,
  },
});

// ─── Step 8: Payload guard ────────────────────────────────────────────────────

describe('codernic:chat — payload guard', () => {
  it('[RED] replies codernic:error when payload is null', async () => {
    const handler = makeHandler();
    const reply = jest.fn();

    await handler({ type: 'codernic:chat', payload: null } as unknown as CodernicMsg, reply);

    // After fix: handler must reply with codernic:error instead of throwing
    const calls = reply.mock.calls.map((c: unknown[]) => c[0] as CodernicMsg);
    const errorReply = calls.find((c) => c.type === 'codernic:error');
    expect(errorReply).toBeDefined();
    // Must not have attempted to call streamChat
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it('[RED] replies codernic:error when payload.history is undefined', async () => {
    const handler = makeHandler();
    const reply = jest.fn();

    await handler(
      { type: 'codernic:chat', payload: { llmId: 'test', mode: 'ask' } } as unknown as CodernicMsg,
      reply,
    );

    const calls = reply.mock.calls.map((c: unknown[]) => c[0] as CodernicMsg);
    const errorReply = calls.find((c) => c.type === 'codernic:error');
    expect(errorReply).toBeDefined();
    expect(mockStreamChat).not.toHaveBeenCalled();
  });
});

// ─── Step 5: Node FS → vscode.workspace.fs ───────────────────────────────────

describe('loadSystemInstructions — file system', () => {
  it('[RED] reads rules file via vscode.workspace.fs, not Node fs', async () => {
    const rulesContent = '<system-instructions>Use kebab-case names.</system-instructions>';
    vscode.workspace.fs.readFile.mockResolvedValue(Buffer.from(rulesContent));

    const handler = makeHandler();
    const reply = jest.fn();
    await handler(validChatMsg(), reply);

    // After fix: vscode.workspace.fs.readFile is called for the rules file
    expect(vscode.workspace.fs.readFile).toHaveBeenCalled();
    // After fix: Node fs.readFile is NOT called for the instructions file
    // (it may still be called for other operations — check it was not called with the rules path)
    const nodeReadCalls = mockFsReadFile.mock.calls as [string, string | undefined][];
    const rulesPathCall = nodeReadCalls.find(
      ([p]) => typeof p === 'string' && p.includes('rules') && p.endsWith('.xml'),
    );
    expect(rulesPathCall).toBeUndefined();

    // streamChat must still be called (no regression)
    expect(mockStreamChat).toHaveBeenCalled();
  });

  it('[GREEN] falls back to default instructions when rules file is missing', async () => {
    // Both Node fs and vscode fs fail → catch block should use default description
    vscode.workspace.fs.readFile.mockRejectedValue({ code: 'FileNotFound' });

    const handler = makeHandler();
    const reply = jest.fn();
    await handler(validChatMsg({ mode: 'ask' }), reply);

    // streamChat must be called even with fallback instructions
    expect(mockStreamChat).toHaveBeenCalled();
    const [chatMsg] = mockStreamChat.mock.calls[0] as [
      { payload: { systemContext: string } },
      ...unknown[],
    ];
    expect(chatMsg.payload.systemContext).toContain('Memory Protocol');
  });
});

// ─── Regression: valid chat reaches streamChat ────────────────────────────────

describe('codernic:chat — valid message', () => {
  it('[GREEN] valid chat forwards to streamChat with systemContext and mode-specific tools', async () => {
    const handler = makeHandler();
    const reply = jest.fn();
    await handler(validChatMsg({ mode: 'ask' }), reply);

    expect(mockStreamChat).toHaveBeenCalledTimes(1);
    const [chatMsg] = mockStreamChat.mock.calls[0] as [
      { payload: { systemContext: string } },
      ...unknown[],
    ];
    expect(chatMsg.payload.systemContext).toBeDefined();
    // Memory Protocol must appear in the injected context
    expect(chatMsg.payload.systemContext).toContain('Memory Protocol');
    expect(chatMsg.payload.systemContext).toContain('read_project_memory');
  });
});

describe('codernic:chat — memory slash commands execution', () => {
  it('executes read-project-memory natively and returns results', async () => {
    mockDetectIntent.mockReturnValue({ type: 'read-project-memory', spec: '' });
    const handler = makeHandler();
    const reply = jest.fn();

    // Mock reading workspace files (read_project_memory)
    vscode.workspace.fs.readFile.mockResolvedValue(Buffer.from('# Mock Memory Content'));
    vscode.workspace.fs.readDirectory.mockResolvedValue([]);

    await handler(validChatMsg({ history: [{ role: 'user', text: '/read-project-memory' }] }), reply);

    // Should reply with the output of the tool directly via chunk/markdown stream
    const calls = reply.mock.calls.map((c: unknown[]) => c[0] as CodernicMsg);
    const streamCalls = calls.filter((c) => c.type === 'codernic:stream-chunk');
    expect(streamCalls.length).toBeGreaterThan(0);
    // Combine chunks
    const fullText = streamCalls.map((c) => (c as any).payload.chunk).join('');
    expect(fullText).toContain('Mock Memory Content');

    // LLM completes immediately without calling streamChat
    expect(mockStreamChat).not.toHaveBeenCalled();
  });
});


