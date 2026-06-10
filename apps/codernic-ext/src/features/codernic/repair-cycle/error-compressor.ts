/**
 * @file error-compressor.ts
 * @description Compresses raw test-runner output into a minimal structured form.
 *
 * Understands three output formats:
 *   - Jest / Vitest  — "● <suite> › <test>" blocks with Expected/Received diffs + "at file:line"
 *   - TypeScript     — "error TS\d{4}: <message>  <file>(<row>,<col>)"
 *   - Unknown        — first MAX_UNKNOWN_LINES lines preserved as a single entry
 *
 * Zero external dependencies. Pure function — safe to unit-test without any mocks.
 */

export type ErrorClass = 'import' | 'type' | 'syntax' | 'assertion' | 'architectural';

export interface CompressedError {
  /** Full test name, e.g. "auth handler > returns 401". Empty string for tsc errors. */
  readonly testName: string;
  /** Source file path extracted from stack frame or tsc output. */
  readonly file: string;
  /** 1-based line number, or 0 when unknown. */
  readonly line: number;
  /** First assertion mismatch line, e.g. "Expected: 401  Received: 200". */
  readonly assertion: string;
  /** Coarse category used by the classifier to select a model tier. */
  readonly errorClass: ErrorClass;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_UNKNOWN_LINES = 20;

// Regex patterns
/** Jest/Vitest failure header: "  ● Suite name › test name"  */
const JEST_BULLET_RE = /^\s*●\s+(.+)/;
/** TypeScript compiler error line */
const TSC_ERROR_RE = /error\s+TS(\d{4}):\s*(.+)/;
/** "at src/foo.ts:42:5" or "at Object.<anonymous> (src/foo.ts:42:5)" */
const STACK_AT_RE = /at\s+(?:\S+\s+\()?([^\s(]+\.(?:ts|tsx|js|jsx)):(\d+)/;
/** tsc location: "path/to/file.ts(12,3)" */
const TSC_LOCATION_RE = /([^\s(]+\.(?:ts|tsx)):?\((\d+),\d+\)/;
/** Keywords that suggest an architectural-level problem */
const ARCHITECTURAL_KEYWORDS = [
  'circular',
  'cannot find module',
  'has no exported member',
  'is not assignable to type',
  'does not satisfy',
  'missing in type',
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses the raw stdout+stderr string returned by `toolRunTerminal` and
 * returns a compact array of errors — one entry per failing test or tsc diagnostic.
 *
 * Empty / passing output → [].
 */
export function compressErrors(rawOutput: string): CompressedError[] {
  if (!rawOutput) return [];

  // Passing run: toolRunTerminal prefixes with "✅ Success"
  if (rawOutput.startsWith('✅')) return [];

  const lines = rawOutput.split('\n');

  // Detect tsc output by presence of "error TS\d{4}"
  const hasTscErrors = lines.some((l) => TSC_ERROR_RE.test(l));
  if (hasTscErrors) return parseTscErrors(lines);

  // Detect Jest/Vitest by presence of "● " failure bullets
  const hasJestBullets = lines.some((l) => JEST_BULLET_RE.test(l));
  if (hasJestBullets) return parseJestErrors(lines);

  // Unknown format — preserve raw first N lines as a single architectural entry
  return parseUnknownErrors(lines);
}

// ─── Jest / Vitest parser ─────────────────────────────────────────────────────

function parseJestErrors(lines: string[]): CompressedError[] {
  const errors: CompressedError[] = [];
  let i = 0;

  while (i < lines.length) {
    const bulletMatch = lines[i].match(JEST_BULLET_RE);
    if (!bulletMatch) {
      i++;
      continue;
    }

    const testName = bulletMatch[1].trim();
    let file = '';
    let line = 0;

    const blockEnd = findNextBulletOrEnd(lines, i + 1);
    const blockLines = lines.slice(i + 1, blockEnd);

    // Assertion: prefer Expected:/Received: pair; fall back to Error: line
    const assertion = extractAssertionFromBlock(blockLines);

    // File + line: first stack frame
    for (const l of blockLines) {
      const stackMatch = l.match(STACK_AT_RE);
      if (stackMatch) {
        file = stackMatch[1];
        line = parseInt(stackMatch[2], 10);
        break;
      }
    }

    errors.push({
      testName,
      file,
      line,
      assertion,
      errorClass: classifyJestError(testName, blockLines),
    });

    i = blockEnd;
  }

  return errors;
}

function findNextBulletOrEnd(lines: string[], from: number): number {
  for (let i = from; i < lines.length; i++) {
    if (JEST_BULLET_RE.test(lines[i])) return i;
  }
  return lines.length;
}

/**
 * Extracts the most informative one-liner from a Jest failure block.
 *
 * Priority:
 *   1. `Expected: …` [ + `Received: …` on next line ]
 *   2. `Received: …` standalone
 *   3. `AssertionError: …` or `Error: …`
 */
function extractAssertionFromBlock(blockLines: string[]): string {
  // Phase 1: Expected: / Received: pair
  for (let j = 0; j < blockLines.length; j++) {
    if (/^\s*Expected\s*[:=]/.test(blockLines[j])) {
      let s = blockLines[j].trim();
      if (j + 1 < blockLines.length && /^\s*Received\s*[:=]/.test(blockLines[j + 1])) {
        s += `  ${blockLines[j + 1].trim()}`;
      }
      return s.slice(0, 120);
    }
  }
  // Phase 2: Broader patterns
  for (const l of blockLines) {
    if (/^\s*(Received\s*[:=]|AssertionError|Error:)/.test(l)) {
      return l.trim().slice(0, 120);
    }
  }
  return '';
}

function classifyJestError(testName: string, blockLines: string[]): ErrorClass {
  // Inspect both the test name and the full block body for architectural signals
  const combined = (testName + ' ' + blockLines.join(' ')).toLowerCase();
  if (ARCHITECTURAL_KEYWORDS.some((kw) => combined.includes(kw))) return 'architectural';
  return 'assertion';
}

// ─── TypeScript compiler parser ───────────────────────────────────────────────

function parseTscErrors(lines: string[]): CompressedError[] {
  const errors: CompressedError[] = [];

  for (const rawLine of lines) {
    const tscMatch = rawLine.match(TSC_ERROR_RE);
    if (!tscMatch) continue;

    const tsCode = parseInt(tscMatch[1], 10);
    const message = tscMatch[2].trim();

    const locMatch = rawLine.match(TSC_LOCATION_RE);
    const file = locMatch ? locMatch[1] : '';
    const line = locMatch ? parseInt(locMatch[2], 10) : 0;

    errors.push({
      testName: '',
      file,
      line,
      assertion: `TS${tsCode}: ${message}`.slice(0, 120),
      errorClass: classifyTscError(tsCode, message),
    });
  }

  return errors;
}

function classifyTscError(tsCode: number, message: string): ErrorClass {
  // TS code-specific classification takes precedence over keyword matching
  // TS2307 = cannot find module / TS2305 = no exported member
  if (tsCode === 2307 || tsCode === 2305) return 'import';
  // TS2345/2322/2339/2741/2740 = type mismatches
  if ([2345, 2322, 2339, 2741, 2740].includes(tsCode)) return 'type';
  // TS1xxx = syntax errors
  if (tsCode >= 1000 && tsCode < 2000) return 'syntax';
  // Generic keyword check for remaining codes
  const lower = message.toLowerCase();
  if (ARCHITECTURAL_KEYWORDS.some((kw) => lower.includes(kw))) return 'architectural';
  return 'type';
}

// ─── Unknown format parser ────────────────────────────────────────────────────

function parseUnknownErrors(lines: string[]): CompressedError[] {
  const snippet = lines.slice(0, MAX_UNKNOWN_LINES).join('\n').trim().slice(0, 400);

  if (!snippet) return [];

  return [
    {
      testName: '',
      file: '',
      line: 0,
      assertion: snippet,
      errorClass: 'architectural',
    },
  ];
}
