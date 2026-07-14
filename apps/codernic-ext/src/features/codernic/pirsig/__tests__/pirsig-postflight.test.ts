/**
 * Unit tests — pirsig-postflight.ts
 * @group unit
 *
 * `callMcpTool` is mocked; `vscode.ChatResponseStream` is a plain jest mock object.
 */

jest.mock('../../../../shared/mcp', () => ({
  callMcpTool: jest.fn(),
}));

import type { McpClientInstance } from '../../../../shared/mcp';
import { callMcpTool } from '../../../../shared/mcp';
import { runPirsigPostflight } from '../pirsig-postflight';
import type { PirsigBaseline } from '../pirsig-preflight';

const mockCallMcpTool = callMcpTool as jest.MockedFunction<typeof callMcpTool>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WORKSPACE = '/workspace/my-project';
const FAKE_CLIENT = {} as McpClientInstance;

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
    kpis: { overall: 90, namingConsistency: 95, exportDiscipline: 88, testCoverage: 80 },
    violations: [] as Array<{ dimension?: string; symbolName?: string }>,
    ...overrides,
  };
}

function makeBaseline(overall: number): PirsigBaseline {
  return {
    kpis: { namingConsistency: 90, exportDiscipline: 90, testCoverage: 70, overall },
  };
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('runPirsigPostflight', () => {
  beforeEach(() => {
    mockCallMcpTool.mockReset();
  });

  // ─── null client ──────────────────────────────────────────────────────────

  it('resolves to void when mcpClient is null', async () => {
    await expect(
      runPirsigPostflight(null, WORKSPACE, makeStream() as never),
    ).resolves.toBeUndefined();
  });

  it('does not call MCP when mcpClient is null', async () => {
    await runPirsigPostflight(null, WORKSPACE, makeStream() as never);
    expect(mockCallMcpTool).not.toHaveBeenCalled();
  });

  it('does not emit to stream when mcpClient is null', async () => {
    const stream = makeStream();
    await runPirsigPostflight(null, WORKSPACE, stream as never, makeBaseline(90));
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  // ─── Correct MCP invocation ───────────────────────────────────────────────

  it('calls pirsig-audit with withDrift: true and the workspace root', async () => {
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport()));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, makeStream() as never);
    expect(mockCallMcpTool).toHaveBeenCalledWith(FAKE_CLIENT, {
      name: 'pirsig-audit',
      arguments: { projectRoot: WORKSPACE, withDrift: true },
    });
  });

  // ─── No baseline — score-only output ─────────────────────────────────────

  it('emits 📊 quality score line when no baseline is provided', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 82 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('📊');
    expect(emitted).toContain('82 pts');
  });

  it('includes violation count in no-baseline output', async () => {
    const stream = makeStream();
    const report = makeReport({
      violations: [
        { dimension: 'naming', symbolName: 'foo' },
        { dimension: 'naming', symbolName: 'bar' },
      ],
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('2 violations');
  });

  it('includes dimension detail in no-baseline output when violations exist', async () => {
    const stream = makeStream();
    const report = makeReport({
      violations: [
        { dimension: 'naming', symbolName: 'a' },
        { dimension: 'exports', symbolName: 'b' },
      ],
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('naming: 1');
    expect(emitted).toContain('exports: 1');
  });

  it('shows 0 violations when violations array is empty (no baseline)', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ violations: [] })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('0 violations');
  });

  it('handles missing violations field gracefully (defaults to 0 count)', async () => {
    const stream = makeStream();
    // report without `violations` key at all
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult({ kpis: { overall: 90 } }));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never);
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('0 violations');
  });

  // ─── With baseline — ✅ improved / unchanged ──────────────────────────────

  it('emits ✅ when quality score is unchanged (delta = 0)', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 90 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('✅');
    expect(emitted).toContain('90 → 90');
  });

  it('emits ✅ when quality improved (delta > 0)', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 97 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('✅');
    expect(emitted).toContain('90 → 97');
  });

  it('✅ line includes violation count', async () => {
    const stream = makeStream();
    const report = makeReport({
      kpis: { overall: 92 },
      violations: [{ dimension: 'testing', symbolName: 'x' }],
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('1 violations');
  });

  // ─── With baseline — ⚠️ minor regression (−1 to −4) ─────────────────────

  it('emits ⚠️ for a minor regression of 1 point', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 89 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('⚠️');
    expect(emitted).toContain('90 → 89');
  });

  it('emits ⚠️ for delta exactly -3', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 87 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('⚠️');
  });

  it('emits ⚠️ for delta exactly -4 (boundary)', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 86 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('⚠️');
  });

  it('includes violation dimension detail in ⚠️ line', async () => {
    const stream = makeStream();
    const report = makeReport({
      kpis: { overall: 87 },
      violations: [
        { dimension: 'naming', symbolName: 'a' },
        { dimension: 'naming', symbolName: 'b' },
        { dimension: 'exports', symbolName: 'c' },
      ],
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('naming: 2');
    expect(emitted).toContain('exports: 1');
  });

  // ─── With baseline — ❌ major regression (≤ −5) ──────────────────────────

  it('emits ❌ for delta exactly -5 (threshold boundary)', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 85 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('❌');
    expect(emitted).toContain('90 → 85');
  });

  it('emits ❌ for a large regression of -20 points', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 70 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('❌');
  });

  it('❌ line includes "review before merging" guidance', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(makeReport({ kpis: { overall: 80 } })));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('review before merging');
  });

  // ─── Violation grouping by dimension ─────────────────────────────────────

  it('groups violations by dimension correctly — multiple dimensions', async () => {
    const stream = makeStream();
    const report = makeReport({
      kpis: { overall: 87 },
      violations: [
        { dimension: 'naming' },
        { dimension: 'naming' },
        { dimension: 'testing' },
        { dimension: 'exports' },
      ],
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('naming: 2');
    expect(emitted).toContain('testing: 1');
    expect(emitted).toContain('exports: 1');
  });

  it('assigns undefined dimension to "other" bucket', async () => {
    const stream = makeStream();
    const report = makeReport({
      kpis: { overall: 87 },
      violations: [
        { symbolName: 'x' }, // dimension is undefined
      ],
    });
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult(report));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('other: 1');
  });

  // ─── Score rounding ───────────────────────────────────────────────────────

  it('rounds fractional scores before computing delta', async () => {
    const stream = makeStream();
    // round(87.4) = 87, round(90) = 90 => delta = -3 => ⚠️
    mockCallMcpTool.mockResolvedValueOnce(
      makeMcpTextResult(makeReport({ kpis: { overall: 87.4 } })),
    );
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    const emitted: string = stream.markdown.mock.calls[0][0];
    expect(emitted).toContain('⚠️');
    expect(emitted).toContain('87');
  });

  // ─── Error handling — all exceptions must be swallowed ───────────────────

  it('resolves to void and does not throw when MCP throws', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockRejectedValueOnce(new Error('connection refused'));
    await expect(
      runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90)),
    ).resolves.toBeUndefined();
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  it('does not emit when MCP returns empty content array', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce({ content: [], isError: false });
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  it('does not emit when report JSON has no kpis field', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce(makeMcpTextResult({ violations: [] }));
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  it('does not emit when MCP returns invalid JSON text', async () => {
    const stream = makeStream();
    mockCallMcpTool.mockResolvedValueOnce({
      content: [{ type: 'text' as const, text: 'CORRUPT}{JSON' }],
      isError: false,
    });
    await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(90));
    expect(stream.markdown).not.toHaveBeenCalled();
  });

  // ─── Battle test — full delta spectrum ───────────────────────────────────

  it('battle test — correctly classifies the full delta range (±10)', async () => {
    const BASE = 90;
    const scenarios: Array<{ current: number; expectedEmoji: string }> = [
      { current: 100, expectedEmoji: '✅' },
      { current: 95, expectedEmoji: '✅' },
      { current: 90, expectedEmoji: '✅' }, // delta = 0
      { current: 89, expectedEmoji: '⚠️' }, // delta = -1
      { current: 87, expectedEmoji: '⚠️' }, // delta = -3
      { current: 86, expectedEmoji: '⚠️' }, // delta = -4
      { current: 85, expectedEmoji: '❌' }, // delta = -5
      { current: 83, expectedEmoji: '❌' }, // delta = -7
      { current: 80, expectedEmoji: '❌' }, // delta = -10
    ];

    for (const { current, expectedEmoji } of scenarios) {
      mockCallMcpTool.mockResolvedValueOnce(
        makeMcpTextResult(makeReport({ kpis: { overall: current } })),
      );
      const stream = makeStream();
      await runPirsigPostflight(FAKE_CLIENT, WORKSPACE, stream as never, makeBaseline(BASE));
      const emitted: string = stream.markdown.mock.calls[0][0];
      expect(emitted).toContain(expectedEmoji);
    }
  });
});
