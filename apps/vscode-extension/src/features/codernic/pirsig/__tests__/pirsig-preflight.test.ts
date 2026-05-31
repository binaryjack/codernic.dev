/**
 * Unit tests — pirsig-preflight.ts
 * @group unit
 *
 * `callMcpTool` is mocked; `vscode.ChatResponseStream` is a plain jest mock object.
 */

jest.mock('../../../../shared/mcp', () => ({
  callMcpTool: jest.fn(),
}));

import type { McpClientInstance } from '../../../../shared/mcp';
import { callMcpTool } from '../../../../shared/mcp';
import { runPirsigPreflight } from '../pirsig-preflight';

const mockCallMcpTool = callMcpTool as jest.MockedFunction<typeof callMcpTool>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WORKSPACE = '/workspace/my-project';
const FAKE_CLIENT = {} as McpClientInstance;

/** Minimal ChatResponseStream stand-in */
function makeStream() {
  return { markdown: jest.fn() };
}

function makeMcpTextResult(obj: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(obj) }],
    isError: false,
  };
}

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    kpis: {
      namingConsistency: 92,
      exportDiscipline: 85,
      testCoverage: 70,
      overall: 87,
    },
    profile: {
      naming: { functions: 'camelCase' },
      structure: { prefersNamedExports: true },
    },
    ...overrides,
  };
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('runPirsigPreflight', () => {
  beforeEach(() => {
    mockCallMcpTool.mockReset();
  });

  // ─── null client ──────────────────────────────────────────────────────────

  it('returns null immediately when mcpClient is null', async () => {
    const stream = makeStream();
    const result = await runPirsigPreflight(null, WORKSPACE, stream as never);
    expect(result).toBeNull();
  });

  it('does not call MCP when mcpClient is null', async () => {
    await runPirsigPreflight(null, WORKSPACE, makeStream() as never);
    expect(mockCallMcpTool).not.toHaveBeenCalled();
  });

  it('does not emit to the stream when mcpClient is null', async () => {
    const stream = makeStream();
    await runPirsigPreflight(null, WORKSPACE, stream as never);
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  // ─── Correct MCP invocation ───────────────────────────────────────────────

  it('calls pirsig-audit with withDrift: false and the workspace root', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    expect(mockCallMcpTool).toHaveBeenCalledWith(FAKE_CLIENT, {
      name: 'pirsig-audit',
      arguments: { projectRoot: WORKSPACE, withDrift: false },
    });
  });

  // ─── Happy path — baseline structure ──────────────────────────────────────

  it('returns a PirsigBaseline with kpi values matching the report', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    const result = await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    expect(result).toEqual({
      kpis: {
        namingConsistency: 92,
        exportDiscipline: 85,
        testCoverage: 70,
        overall: 87,
      },
    });
  });

  it('rounds the overall score in the emitted markdown', async () => {
    mockCallMcpTool.mockResolvedValueOnce(
      makeMcpTextResult(
        makeReport({
          kpis: { overall: 87.6, namingConsistency: 90, exportDiscipline: 80, testCoverage: 65 },
        }),
      ),
    );
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    // Math.round(87.6) = 88
    expect(emitted).toContain('88 pts');
  });

  // ─── Stream output content ────────────────────────────────────────────────

  it('emits exactly one markdown call on success', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    expect(stream.markdown).toHaveBeenCalledTimes(1);
  });

  it('emits the 📊 emoji in the stream line', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('📊');
  });

  it('emits the baseline score in the stream line', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('87 pts');
  });

  it('emits the naming style from the profile', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('camelCase');
  });

  it('emits "named exports" label when prefersNamedExports is true', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('named exports');
  });

  it('emits "default exports" label when prefersNamedExports is false', async () => {
    const report = makeReport({
      profile: { naming: { functions: 'camelCase' }, structure: { prefersNamedExports: false } },
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('default exports');
  });

  it('emits "unknown" naming style when profile.naming.functions is absent', async () => {
    const report = makeReport({
      profile: { naming: {}, structure: { prefersNamedExports: true } },
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    const stream = makeStream();
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('unknown');
  });

  // ─── Default kpi values ───────────────────────────────────────────────────

  it('defaults missing kpi fields to 0', async () => {
    const report = { kpis: { overall: 55 }, profile: {} };
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    const result = await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    expect(result?.kpis.namingConsistency).toBe(0);
    expect(result?.kpis.exportDiscipline).toBe(0);
    expect(result?.kpis.testCoverage).toBe(0);
    expect(result?.kpis.overall).toBe(55);
  });

  // ─── Error paths — all must return null, no throw ─────────────────────────

  it('returns null when MCP result has no content items', async () => {
    mockCallMcpTool.mockResolvedValueOnce({ content: [], isError: false });
    const result = await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    expect(result).toBeNull();
  });

  it('does not emit to stream when MCP result has no content', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce({ content: [], isError: false });
    await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  it('returns null when report JSON contains no kpis field', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult({ profile: {} }));
    const result = await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    expect(result).toBeNull();
  });

  it('returns null and does not throw when MCP throws', async () => {
    mockCallMcpTool.mockRejectedValueOnce(new Error('tool unavailable'));
    const stream = makeStream();
    const result = await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, stream as never);
    expect(result).toBeNull();
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  it('returns null when MCP text is not valid JSON', async () => {
    mockCallMcpTool.mockResolvedValueOnce({
      content: [{ type: 'text' as const, text: 'NOT JSON }{' }],
      isError: false,
    });
    const result = await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    expect(result).toBeNull();
  });

  it('returns null when MCP text is valid JSON but not an object', async () => {
    mockCallMcpTool.mockResolvedValueOnce({
      content: [{ type: 'text' as const, text: '"just a string"' }],
      isError: false,
    });
    const result = await runPirsigPreflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    // kpis will be undefined → returns null
    expect(result).toBeNull();
  });

  // ─── Battle test — 10 sequential distinct projects ────────────────────────

  it('correctly returns baseline for 10 sequential calls with distinct scores', async () => {
    for (let i = 0; i < 10; i++) {
      const score = 50 + i * 5;
      mockCallMcpTool.mockResolvedValueOnce(
        makeMcpTextResult(
          makeReport({
            kpis: {
              overall: score,
              namingConsistency: score,
              exportDiscipline: score,
              testCoverage: score,
            },
          }),
        ),
      );
      const result = await runPirsigPreflight(
        FAKE_CLIENT,
        `/workspace/project-${i}`,
        makeStream() as never,
      );
      expect(result?.kpis.overall).toBe(score);
    }
  });
});
