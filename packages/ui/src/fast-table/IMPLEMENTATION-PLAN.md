# FastTable — Machine-Oriented Implementation Plan

> **AI AGENT: READ THIS FIRST — NON-NEGOTIABLE**
>
> Before writing a single line of code, read and ingest:
> ```
> _private/docs/copilot/copilot-instructions.md
> ```
> The rules below are derived from it but the source file is authoritative.
> Violating any rule is a HARD REJECT. The CI pipeline **will** catch it.

---

## 0 — Standing Rules (Derived from `copilot-instructions.md`)

Every file produced in this plan MUST satisfy ALL of the following. No exceptions.

| Rule | Enforcement |
|------|-------------|
| `NAMING=kebab` | All filenames are `kebab-case.ts(x)`. No PascalCase, no camelCase in filenames. |
| `FILE=one-item-per-file` | One exported symbol (function/type/const) per file is the target. Barrel `index.ts` files are the only exception. |
| `ANY=0` | Zero uses of ` any `. Use `unknown`, generics, or explicit narrowing. |
| `UNION=strict` | No implicit `string \| undefined` without `?:`. All union arms must be exhausted. |
| `REACT=declarative-only` | No imperative DOM mutations. No direct `document.*` calls in components. |
| `CLASS=forbidden` | No `class` keyword anywhere. Use the `PROTO.*` pattern for any prototype work. |
| `REACT` hooks | Named exports only. No default exports. |
| `CHECKS=["tsc","eslint","jest"]` | Run `pnpm typecheck` + `pnpm lint` + `pnpm test` in the UI package after each step. |
| `REJECT=["useImperativeHandle","class "," any ","camelCase","verbose"]` | Grep for these strings in every file before committing. |
| `TEST.min_coverage=95` | Each step ships with tests covering ≥95% of the new lines. |
| `PERF.target="<=10% solid-js"` | No unnecessary re-renders; memoize context values and derived data. |

**Barrel file rule:** Every subfolder gets an `index.ts` that re-exports via named `export { X } from './x.js'`.  
**Import extension:** Always use `.js` extension in import paths (ESM, `"type": "module"`).  
**Types file:** All interfaces/types for a feature go in `feature.types.ts`.  
**Classes file:** All Tailwind class maps go in `feature.classes.ts`.

---

## 1 — Pipeline Contract

After **every numbered step** the agent MUST:

```
cd _private/ui
pnpm typecheck   # must exit 0
pnpm lint        # must exit 0
pnpm test        # must exit 0, coverage ≥95% of new lines
```

If any check fails: **stop, fix, re-check**. Do not proceed to the next step.

---

## Step 1 — Foundation Types

### Files to create

```
fast-table/
  types.ts
  transport/
    transporter.types.ts
```

### `fast-table/types.ts`

Export (one export group = acceptable in a types file):

```ts
// Naming: PascalCase for interfaces/types, kebab for files
export type CellEditorDef = ...         // union — see §7 BRAINSTORM
export interface ColumnDef<T> { ... }   // see §3, §6, §7, §11, §20a, §21a
export interface TableRowState<T> { ... } // see §8
export interface CellChangeEvent<T> { ... }
export interface FastTableProps<T> { ... } // see §18g, §21d
export type SortState<T> = { key: keyof T; direction: 'asc' | 'desc' }
```

`ColumnDef<T>` must include:
- `key: keyof T`
- `label: string`
- `editable?: boolean`
- `locked?: boolean`
- `sortable?: boolean`
- `sortFn?: (a: T, b: T) => number`
- `editor?: CellEditorDef`
- `format?: (value: T[keyof T], row: T) => string`
- `cellRules?: CellStyleRule<T>[]`  ← imported from styles/row-style-rule.types.ts
- `width?: number`

`FastTableProps<T>` must include `rowRules?`, `rulePreset?`.

### `fast-table/transport/transporter.types.ts`

All transporter protocol types from §18a–§18c:
`FilterOperator`, `FieldFilter<T,K>`, `FilterState<T>`, `FetchParams<T>`, `PageResult<T>`,
`PatchRowParams<T>`, `PatchRowResult`, `PatchSelectionParams`,
`TableDataAdapter<T>`, `DataTransporter<T>`, `TransporterOptions<T>`.

### Battle tests

**`fast-table/__tests__/types.test.ts`** — compile-time shape tests via `satisfies`:

```ts
import { describe, it, expect } from 'vitest'
import type { ColumnDef, TableRowState } from '../types.js'

describe('ColumnDef shape', () => {
  it('accepts a minimal column definition', () => {
    const col = { key: 'name', label: 'Name' } satisfies ColumnDef<{ name: string }>
    expect(col.key).toBe('name')
  })

  it('accepts format prop as function', () => {
    const col: ColumnDef<{ salary: number }> = {
      key: 'salary',
      label: 'Salary',
      format: (v) => `$${Number(v).toLocaleString()}`,
    }
    expect(col.format?.(50000, { salary: 50000 })).toBe('$50,000')
  })

  it('accepts cellRules array', () => {
    const col: ColumnDef<{ salary: number }> = {
      key: 'salary', label: 'Salary',
      cellRules: [{ id: 'high', condition: v => Number(v) > 100_000, classes: 'text-green-600', priority: 1 }],
    }
    expect(col.cellRules).toHaveLength(1)
  })
})

describe('TableRowState shape', () => {
  it('has all required flags', () => {
    const row: TableRowState<{ id: number }> = {
      data:                 { id: 1 },
      errors:               { id: [] },
      isActive:             false,
      isSelected:           false,
      isVisible:            true,
      isInNearVisibleRange: false,
    }
    expect(row.isActive).toBe(false)
  })
})
```

> **Style check:** grep the two new files for ` any `, `class `, camelCase filenames. Must return 0 matches.

---

## Step 2 — Style System Types + Default Rules

### Files to create

```
fast-table/styles/
  row-style-rule.types.ts
  default-row-rules.ts
```

### `row-style-rule.types.ts`

```ts
import type { TableRowState } from '../types.js'

export interface RowStyleRule<T> {
  id:        string
  condition: (rowState: TableRowState<T>) => boolean
  classes:   string
  priority:  number
}

export interface CellStyleRule<T> {
  id:        string
  condition: (value: T[keyof T], rowState: TableRowState<T>) => boolean
  classes:   string
  priority:  number
}
```

### `default-row-rules.ts`

```ts
import type { RowStyleRule } from './row-style-rule.types.js'

export const DEFAULT_ROW_RULES: RowStyleRule<unknown>[] = [
  { id: 'dirty',      condition: r => (r.data as Record<string, unknown>).isDirty === true,
                      classes: 'border-l-2 border-yellow-400', priority: 5 },
  { id: 'selected',   condition: r => r.isSelected,
                      classes: 'bg-brand-50 dark:bg-brand-950/60', priority: 10 },
  { id: 'has-errors', condition: r => Object.values(r.errors).some(e => (e as unknown[]).length > 0),
                      classes: 'bg-red-50/40 dark:bg-red-900/20', priority: 15 },
  { id: 'active',     condition: r => r.isActive,
                      classes: 'ring-2 ring-inset ring-brand-400 z-10 relative', priority: 20 },
]
```

### Battle tests

**`fast-table/__tests__/default-row-rules.test.ts`**:

```ts
import { describe, it, expect } from 'vitest'
import { DEFAULT_ROW_RULES } from '../styles/default-row-rules.js'
import type { TableRowState } from '../types.js'

const base: TableRowState<unknown> = {
  data: {}, errors: {}, isActive: false, isSelected: false, isVisible: true, isInNearVisibleRange: false,
}

describe('DEFAULT_ROW_RULES', () => {
  it('has 4 rules', () => expect(DEFAULT_ROW_RULES).toHaveLength(4))

  it('dirty — fires when data.isDirty === true', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'dirty')!
    expect(rule.condition({ ...base, data: { isDirty: true } })).toBe(true)
    expect(rule.condition({ ...base, data: { isDirty: false } })).toBe(false)
  })

  it('selected — fires when isSelected === true', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'selected')!
    expect(rule.condition({ ...base, isSelected: true })).toBe(true)
    expect(rule.condition(base)).toBe(false)
  })

  it('has-errors — fires when at least one error array is non-empty', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'has-errors')!
    expect(rule.condition({ ...base, errors: { name: [{ message: 'required' }] } })).toBe(true)
    expect(rule.condition({ ...base, errors: { name: [] } })).toBe(false)
  })

  it('active — fires when isActive === true', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'active')!
    expect(rule.condition({ ...base, isActive: true })).toBe(true)
    expect(rule.condition(base)).toBe(false)
  })

  it('rules are sorted by priority asc', () => {
    const priorities = DEFAULT_ROW_RULES.map(r => r.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })

  it('all rules have non-empty classes', () => {
    DEFAULT_ROW_RULES.forEach(r => expect(r.classes.trim().length).toBeGreaterThan(0))
  })
})
```

> **Style check:** no `class `, no ` any `, no default exports.

---

## Step 3 — Virtual Windowing Hook

### File to create

```
fast-table/hooks/use-virtual-rows.ts
```

### Signature

```ts
export interface VirtualWindow {
  startIndex:      number
  endIndex:        number
  totalHeight:     number
  topOffset:       number
  bottomOffset:    number
  shouldFetchMore: boolean
}

export function useVirtualRows(
  totalRows:          number,
  rowHeight:          number,
  containerHeight:    number,
  scrollTop:          number,
  overscan?:          number,          // default 3
  prefetchThreshold?: number,          // default = Math.floor(totalRows * 0.1)
): VirtualWindow
```

Pure math — no React state inside. Returns a plain object. Caller owns `scrollTop` state.

### Battle tests

**`fast-table/__tests__/use-virtual-rows.test.ts`**:

```ts
import { describe, it, expect } from 'vitest'
import { useVirtualRows } from '../hooks/use-virtual-rows.js'

describe('useVirtualRows', () => {
  const TOTAL = 5000, RH = 40, CH = 400, OVER = 3

  it('startIndex is 0 when scrollTop is 0', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER)
    expect(w.startIndex).toBe(0)
  })

  it('topOffset equals startIndex × rowHeight', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 800, OVER)
    expect(w.topOffset).toBe(w.startIndex * RH)
  })

  it('endIndex never exceeds totalRows', () => {
    const w = useVirtualRows(TOTAL, RH, CH, TOTAL * RH - CH, OVER)
    expect(w.endIndex).toBeLessThanOrEqual(TOTAL)
  })

  it('totalHeight = totalRows × rowHeight', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER)
    expect(w.totalHeight).toBe(TOTAL * RH)
  })

  it('bottomOffset = totalHeight - endIndex × rowHeight', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER)
    expect(w.bottomOffset).toBe(w.totalHeight - w.endIndex * RH)
  })

  it('shouldFetchMore is false when endIndex is far from total', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER, 500)
    expect(w.shouldFetchMore).toBe(false)
  })

  it('shouldFetchMore is true when endIndex >= total - threshold', () => {
    const w = useVirtualRows(TOTAL, RH, CH, (TOTAL - 3) * RH, OVER, 5)
    expect(w.shouldFetchMore).toBe(true)
  })

  it('overscan defaults to 3 and does not crash', () => {
    expect(() => useVirtualRows(TOTAL, RH, CH, 0)).not.toThrow()
  })

  it('handles 0 total rows', () => {
    const w = useVirtualRows(0, RH, CH, 0, OVER)
    expect(w.startIndex).toBe(0)
    expect(w.endIndex).toBe(0)
    expect(w.totalHeight).toBe(0)
    expect(w.shouldFetchMore).toBe(false)
  })
})
```

> Minimum 9 cases. Pure function — no mocking needed.

---

## Step 4 — Row Decoration Hook

### File to create

```
fast-table/hooks/use-table-rows.ts
```

### Signature

```ts
import type { VirtualWindow } from './use-virtual-rows.js'
import type { TableRowState } from '../types.js'

export function useTableRows<T>(
  rawRows:       T[],
  getRowId:      (row: T) => string | number,
  activeRowId:   string | number | null,
  selectedIds:   ReadonlySet<string | number>,
  window:        VirtualWindow,
): TableRowState<T>[]
```

Rules:
- `isVisible = index >= window.startIndex && index < window.endIndex`
- `isInNearVisibleRange = !isVisible && Math.abs(index - midpoint) <= overscanPad` (overscanPad = 5)
- `isActive = getRowId(row) === activeRowId`
- `isSelected = selectedIds.has(getRowId(row))`
- `errors` initialised as `{} as Record<keyof T, ErrorLike[]>` — populated externally

### Battle tests

**`fast-table/__tests__/use-table-rows.test.ts`**:

```ts
import { describe, it, expect } from 'vitest'
import { useTableRows } from '../hooks/use-table-rows.js'
import type { VirtualWindow } from '../hooks/use-virtual-rows.js'

type Row = { id: number; name: string }
const rows: Row[] = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Row ${i}` }))
const getId = (r: Row) => r.id
const win: VirtualWindow = { startIndex: 5, endIndex: 10, totalHeight: 800, topOffset: 200, bottomOffset: 400, shouldFetchMore: false }

describe('useTableRows', () => {
  it('returns same length as input', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states).toHaveLength(rows.length)
  })

  it('marks rows inside window as isVisible', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states[5].isVisible).toBe(true)
    expect(states[9].isVisible).toBe(true)
  })

  it('marks rows outside window as NOT isVisible', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states[0].isVisible).toBe(false)
  })

  it('marks active row correctly', () => {
    const states = useTableRows(rows, getId, 3, new Set(), win)
    expect(states[3].isActive).toBe(true)
    expect(states[4].isActive).toBe(false)
  })

  it('marks selected rows correctly', () => {
    const states = useTableRows(rows, getId, null, new Set([2, 7]), win)
    expect(states[2].isSelected).toBe(true)
    expect(states[7].isSelected).toBe(true)
    expect(states[1].isSelected).toBe(false)
  })

  it('no row is active when activeRowId is null', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states.every(s => !s.isActive)).toBe(true)
  })

  it('preserves original data reference', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states[0].data).toBe(rows[0])
  })
})
```

---

## Step 5 — Column Sizes Hook

### File to create

```
fast-table/hooks/use-col-sizes.ts
```

### Signature

```ts
export interface ColSizesResult {
  colWidths:            number[]
  gridTemplateColumns:  string
  setColWidth:          (index: number, width: number) => void
  reorderColumns:       (fromIndex: number, toIndex: number) => void
}

export function useColSizes(
  columns:     { key: string; width?: number }[],
  containerWidth: number,
  tableId:     string,          // localStorage key prefix
  minColWidth?: number,         // default 80
): ColSizesResult
```

Rules:
- Fixed columns use `column.width ?? null`
- Flex columns share remaining space equally
- `gridTemplateColumns` is derived string e.g. `"120px 1fr 1fr 200px"`
- State persisted to `localStorage` under key `ft-col-widths-${tableId}`
- `reorderColumns` mutates the order index mapping (not the `columns` array — that belongs to the parent)

### Battle tests

**`fast-table/__tests__/use-col-sizes.test.ts`**:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColSizes } from '../hooks/use-col-sizes.js'

const cols = [
  { key: 'id', width: 80 },
  { key: 'name' },
  { key: 'email' },
]

beforeEach(() => localStorage.clear())

describe('useColSizes', () => {
  it('returns colWidths array same length as columns', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test'))
    expect(result.current.colWidths).toHaveLength(3)
  })

  it('fixed column width is respected', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test'))
    expect(result.current.colWidths[0]).toBe(80)
  })

  it('flex columns share remaining space equally', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test'))
    expect(result.current.colWidths[1]).toBe(result.current.colWidths[2])
  })

  it('setColWidth updates the width', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test'))
    act(() => result.current.setColWidth(1, 200))
    expect(result.current.colWidths[1]).toBe(200)
  })

  it('persists widths to localStorage', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'persist-test'))
    act(() => result.current.setColWidth(0, 120))
    const stored = JSON.parse(localStorage.getItem('ft-col-widths-persist-test') ?? '[]')
    expect(stored[0]).toBe(120)
  })

  it('restores widths from localStorage on mount', () => {
    localStorage.setItem('ft-col-widths-restore-test', JSON.stringify([99, 200, 200]))
    const { result } = renderHook(() => useColSizes(cols, 800, 'restore-test'))
    expect(result.current.colWidths[0]).toBe(99)
  })

  it('gridTemplateColumns contains a string per column', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test'))
    const parts = result.current.gridTemplateColumns.trim().split(/\s+/)
    expect(parts).toHaveLength(3)
  })
})
```

---

## Step 6 — Row Styles Hook

### File to create

```
fast-table/hooks/use-row-styles.ts
```

### Exports

```ts
export function mergeRules<T>(
  defaults:  RowStyleRule<T>[],
  overrides: RowStyleRule<T>[],
): RowStyleRule<T>[]

export function useRowStyles<T>(
  rowState: TableRowState<T>,
  rules:    RowStyleRule<T>[],
): string
```

`mergeRules`: same `id` → override wins; new `id` → appended; result sorted by `priority` asc.  
`useRowStyles`: `useMemo` — filters rules by `condition(rowState)`, maps `.classes`, joins with `' '`.

### Battle tests

**`fast-table/__tests__/use-row-styles.test.ts`**:

```ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { mergeRules, useRowStyles } from '../hooks/use-row-styles.js'
import { DEFAULT_ROW_RULES } from '../styles/default-row-rules.js'
import type { RowStyleRule } from '../styles/row-style-rule.types.js'
import type { TableRowState } from '../types.js'

const base: TableRowState<unknown> = {
  data: {}, errors: {}, isActive: false, isSelected: false, isVisible: true, isInNearVisibleRange: false,
}

describe('mergeRules', () => {
  it('returns all defaults when overrides is empty', () => {
    expect(mergeRules(DEFAULT_ROW_RULES, [])).toHaveLength(DEFAULT_ROW_RULES.length)
  })

  it('same id — override replaces default', () => {
    const override: RowStyleRule<unknown>[] = [{ id: 'selected', condition: () => true, classes: 'bg-amber-100', priority: 10 }]
    const merged = mergeRules(DEFAULT_ROW_RULES, override)
    const selected = merged.find(r => r.id === 'selected')!
    expect(selected.classes).toBe('bg-amber-100')
  })

  it('new id — appended', () => {
    const extra: RowStyleRule<unknown>[] = [{ id: 'vip', condition: () => true, classes: 'bg-purple-50', priority: 25 }]
    const merged = mergeRules(DEFAULT_ROW_RULES, extra)
    expect(merged.some(r => r.id === 'vip')).toBe(true)
    expect(merged).toHaveLength(DEFAULT_ROW_RULES.length + 1)
  })

  it('result is sorted by priority asc', () => {
    const merged = mergeRules(DEFAULT_ROW_RULES, [])
    const priorities = merged.map(r => r.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })
})

describe('useRowStyles', () => {
  it('returns empty string when no rules fire', () => {
    const rules: RowStyleRule<unknown>[] = []
    const { result } = renderHook(() => useRowStyles(base, rules))
    expect(result.current).toBe('')
  })

  it('returns classes of matching rules', () => {
    const { result } = renderHook(() => useRowStyles({ ...base, isSelected: true }, DEFAULT_ROW_RULES))
    expect(result.current).toContain('bg-brand-50')
  })

  it('does not include classes of non-matching rules', () => {
    const { result } = renderHook(() => useRowStyles(base, DEFAULT_ROW_RULES))
    expect(result.current).not.toContain('ring-brand-400')
  })

  it('multiple matching rules are joined with space', () => {
    const { result } = renderHook(() => useRowStyles({ ...base, isSelected: true, isActive: true }, DEFAULT_ROW_RULES))
    expect(result.current.split(' ').filter(Boolean).length).toBeGreaterThan(1)
  })
})
```

---

## Step 7 — Format Field Hook

### File to create

```
src/form/use-format-field.ts
```

> Note: This file lives in `src/form/`, **not** `fast-table/`. It extends the existing form layer.

### Signature

```ts
'use client'
import { useState } from 'react'
import type { FieldSnapshot } from '../formular-bridge/use-formular-field.js'

export interface FormatFieldResult<V> {
  displayValue:  string
  isEditing:     boolean
  draft:         string
  setDraft:      (v: string) => void
  handleFocus:   () => void
  handleBlur:    (inputString: string) => void
}

export function useFormatField<V>(
  field:         FieldSnapshot<V>,
  formatValue?:  (value: V) => string,
  parseValue?:   (display: string) => V,
): FormatFieldResult<V>
```

Rules:
- When no `formatValue`: `displayValue = String(field.value ?? '')`
- When no `parseValue`: `handleBlur` casts the string to `V` via `inputString as unknown as V`
- `handleFocus` → `setIsEditing(true)`, `setDraft(String(field.value))`
- `handleBlur(str)` → `setIsEditing(false)`, calls `field.updateField(field.name, parsed)`

### Battle tests

**`src/form/__tests__/use-format-field.test.ts`**:

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormatField } from '../use-format-field.js'
import type { FieldSnapshot } from '../../formular-bridge/use-formular-field.js'

const makeField = (value: unknown): FieldSnapshot<unknown> => ({
  id: 'field-1', value,
  name: 'salary',
  errors: [], hasError: false, isDirty: false, isTouched: false,
  setIsTouched: vi.fn(), isFocused: false, setIsFocused: vi.fn(),
  updateField: vi.fn(), validate: vi.fn(), submit: vi.fn(), reset: vi.fn(),
  isValid: true, isBusy: false, submitAttemptCount: 0,
})

describe('useFormatField', () => {
  it('displayValue is String(value) when no formatValue', () => {
    const { result } = renderHook(() => useFormatField(makeField(42) as FieldSnapshot<number>))
    expect(result.current.displayValue).toBe('42')
  })

  it('displayValue uses formatValue when provided', () => {
    const fmt = (v: number) => `$${v.toLocaleString()}`
    const { result } = renderHook(() => useFormatField(makeField(50000) as FieldSnapshot<number>, fmt))
    expect(result.current.displayValue).toBe(fmt(50000))
  })

  it('isEditing starts false', () => {
    const { result } = renderHook(() => useFormatField(makeField('hello') as FieldSnapshot<string>))
    expect(result.current.isEditing).toBe(false)
  })

  it('handleFocus sets isEditing to true and draft to current value', () => {
    const { result } = renderHook(() => useFormatField(makeField('hello') as FieldSnapshot<string>))
    act(() => result.current.handleFocus())
    expect(result.current.isEditing).toBe(true)
    expect(result.current.draft).toBe('hello')
  })

  it('handleBlur calls field.updateField with raw value (no parseValue)', () => {
    const field = makeField('old')
    const { result } = renderHook(() => useFormatField(field as FieldSnapshot<string>))
    act(() => result.current.handleFocus())
    act(() => result.current.handleBlur('new'))
    expect(field.updateField).toHaveBeenCalledWith('salary', 'new')
    expect(result.current.isEditing).toBe(false)
  })

  it('handleBlur calls parseValue and passes result to updateField', () => {
    const field = makeField('$50,000')
    const parse = (s: string) => Number(s.replace(/[$,]/g, ''))
    const { result } = renderHook(() => useFormatField(field as FieldSnapshot<string>, undefined, parse))
    act(() => result.current.handleFocus())
    act(() => result.current.handleBlur('$75,000'))
    expect(field.updateField).toHaveBeenCalledWith('salary', 75000)
  })

  it('displayValue shows formatted value when NOT editing', () => {
    const fmt = (v: number) => `${(v * 100).toFixed(1)}%`
    const { result } = renderHook(() => useFormatField(makeField(0.875) as FieldSnapshot<number>, fmt))
    expect(result.current.displayValue).toBe('87.5%')
  })

  it('displayValue shows raw draft when editing', () => {
    const fmt = (v: number) => `$${v}`
    const { result } = renderHook(() => useFormatField(makeField(100) as FieldSnapshot<number>, fmt))
    act(() => result.current.handleFocus())
    expect(result.current.displayValue).toBe('100')
  })
})
```

> After this step, also update [src/form/index.ts](../form/index.ts) to `export { useFormatField } from './use-format-field.js'`.

---

## Step 8 — Data Transporter Hook

### Files to create

```
fast-table/transport/
  use-table-data-transporter.ts
  create-mock-adapter.ts
```

### `use-table-data-transporter.ts`

Full implementation from §18d. Key invariants:
- Internal `sort` and `filters` stored in **refs** (not state) so `fetchMore()` never closes over stale values.
- `fetchMore()` guard: `if (!hasMore || isFetchingMore || isLoading) return`
- `patchRow()` optimistic mutate → API → rollback on error (see §18d).
- No `class` syntax. No ` any `.

### `create-mock-adapter.ts`

Full mock from §18h. Exports:
```ts
export function createMockAdapter<T>(allRows: T[], latencyMs?: number): TableDataAdapter<T>
```

Helper functions inside the file: `applyFilter`, `applySort`, `sleep`. These are NOT exported.

### Battle tests

**`fast-table/__tests__/use-table-data-transporter.test.ts`**:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTableDataTransporter } from '../transport/use-table-data-transporter.js'
import { createMockAdapter } from '../transport/create-mock-adapter.js'

type Row = { id: number; name: string; isSelected?: boolean }
const ALL_ROWS: Row[] = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Row ${i}` }))

describe('useTableDataTransporter — initial load', () => {
  it('starts with empty rows and isLoading=true', () => {
    const adapter = createMockAdapter(ALL_ROWS, 0)
    const { result } = renderHook(() => useTableDataTransporter(adapter, { limit: 10 }))
    expect(result.current.rows).toHaveLength(0)
    expect(result.current.isLoading).toBe(true)
  })

  it('populates rows after first fetch', async () => {
    const adapter = createMockAdapter(ALL_ROWS, 0)
    const { result } = renderHook(() => useTableDataTransporter(adapter, { limit: 10 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.rows).toHaveLength(10)
  })

  it('sets hasMore=true when more pages exist', async () => {
    const adapter = createMockAdapter(ALL_ROWS, 0)
    const { result } = renderHook(() => useTableDataTransporter(adapter, { limit: 10 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasMore).toBe(true)
  })

  it('sets hasMore=false when all rows loaded in one page', async () => {
    const small = ALL_ROWS.slice(0, 5)
    const adapter = createMockAdapter(small, 0)
    const { result } = renderHook(() => useTableDataTransporter(adapter, { limit: 10 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasMore).toBe(false)
  })
})

describe('useTableDataTransporter — fetchMore', () => {
  it('appends rows on fetchMore', async () => {
    const adapter = createMockAdapter(ALL_ROWS, 0)
    const { result } = renderHook(() => useTableDataTransporter(adapter, { limit: 10 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.fetchMore())
    await waitFor(() => expect(result.current.isFetchingMore).toBe(false))
    expect(result.current.rows).toHaveLength(20)
  })

  it('does nothing if hasMore is false', async () => {
    const small = ALL_ROWS.slice(0, 3)
    const adapter = createMockAdapter(small, 0)
    const { result } = renderHook(() => useTableDataTransporter(adapter, { limit: 10 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.fetchMore())
    expect(result.current.rows).toHaveLength(3)
  })
})

describe('useTableDataTransporter — patchRow', () => {
  it('optimistically updates a row', async () => {
    const adapter = createMockAdapter([...ALL_ROWS], 0)
    const { result } = renderHook(() => useTableDataTransporter(adapter, { limit: 20 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.patchRow({ rowId: 0, key: 'name', prev: 'Row 0', next: 'Updated' })
    })
    expect(result.current.rows.find(r => r.id === 0)?.name).toBe('Updated')
  })
})
```

---

## Step 9 — Context Definitions

### Files to create

```
fast-table/fast-table-context.ts
fast-table/active-row-context.ts
```

### `fast-table-context.ts`

Full `FastTableContext` shape from §13. Must use `createContext` with a `null` default. Companion hook:

```ts
export function useFastTableContext<T>(): FastTableContextValue<T> {
  const ctx = useContext(FastTableContext)
  if (!ctx) throw new Error('useFastTableContext must be used inside FastTable')
  return ctx as FastTableContextValue<T>
}
```

### `active-row-context.ts`

Full `ActiveRowContext` from §13. Same null-default + throwing hook pattern:

```ts
export function useActiveRow(): ActiveRowContextValue {
  const ctx = useContext(ActiveRowContext)
  if (!ctx) throw new Error('useActiveRow must be used inside ActiveRowFormProvider')
  return ctx
}
```

### Battle tests

**`fast-table/__tests__/contexts.test.tsx`**:

```ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { FastTableContext, useFastTableContext } from '../fast-table-context.js'
import { useActiveRow } from '../active-row-context.js'

describe('useFastTableContext', () => {
  it('throws when used outside provider', () => {
    const Comp = () => { useFastTableContext(); return null }
    expect(() => render(<Comp />)).toThrow('useFastTableContext must be used inside FastTable')
  })
})

describe('useActiveRow', () => {
  it('throws when used outside provider', () => {
    const Comp = () => { useActiveRow(); return null }
    expect(() => render(<Comp />)).toThrow('useActiveRow must be used inside ActiveRowFormProvider')
  })
})
```

---

## Step 10 — Row Selection Hook

### File to create

```
fast-table/hooks/use-row-selection.ts
```

### Exports

```ts
export interface RowSelectionResult {
  selectedIds:     ReadonlySet<string | number>
  toggleRow:       (rowId: string | number, extend?: boolean) => void
  selectAll:       (allIds: (string | number)[]) => void
  selectNone:      () => void
  invertSelection: (allIds: (string | number)[]) => void
}

export function useRowSelection(): RowSelectionResult
```

### Battle tests

**`fast-table/__tests__/use-row-selection.test.ts`**:

```ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRowSelection } from '../hooks/use-row-selection.js'

describe('useRowSelection', () => {
  it('starts with empty selection', () => {
    const { result } = renderHook(() => useRowSelection())
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('toggleRow adds a row', () => {
    const { result } = renderHook(() => useRowSelection())
    act(() => result.current.toggleRow(1))
    expect(result.current.selectedIds.has(1)).toBe(true)
  })

  it('toggleRow removes an already-selected row', () => {
    const { result } = renderHook(() => useRowSelection())
    act(() => result.current.toggleRow(1))
    act(() => result.current.toggleRow(1))
    expect(result.current.selectedIds.has(1)).toBe(false)
  })

  it('selectAll selects all provided ids', () => {
    const { result } = renderHook(() => useRowSelection())
    act(() => result.current.selectAll([1, 2, 3]))
    expect(result.current.selectedIds.size).toBe(3)
  })

  it('selectNone clears selection', () => {
    const { result } = renderHook(() => useRowSelection())
    act(() => result.current.selectAll([1, 2, 3]))
    act(() => result.current.selectNone())
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('invertSelection flips each row', () => {
    const { result } = renderHook(() => useRowSelection())
    act(() => result.current.selectAll([1, 2]))
    act(() => result.current.invertSelection([1, 2, 3]))
    expect(result.current.selectedIds.has(1)).toBe(false)
    expect(result.current.selectedIds.has(2)).toBe(false)
    expect(result.current.selectedIds.has(3)).toBe(true)
  })
})
```

---

## Step 11 — Sort Hook

### File to create

```
fast-table/hooks/use-sort.ts
```

### Exports

```ts
export interface SortResult<T> {
  sortState:   SortState<T> | null
  setSortState:(s: SortState<T> | null) => void
  sortedRows:  T[]
}

export function useSort<T>(rows: T[], defaultSort?: SortState<T>): SortResult<T>
```

Cycle on `setSortState`: `null → asc → desc → null`.

### Battle tests

**`fast-table/__tests__/use-sort.test.ts`**:

```ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSort } from '../hooks/use-sort.js'

type Row = { id: number; name: string; salary: number }
const rows: Row[] = [
  { id: 1, name: 'Charlie', salary: 80000 },
  { id: 2, name: 'Alice',   salary: 50000 },
  { id: 3, name: 'Bob',     salary: 120000 },
]

describe('useSort', () => {
  it('returns rows in original order when sortState is null', () => {
    const { result } = renderHook(() => useSort(rows))
    expect(result.current.sortedRows[0].id).toBe(1)
  })

  it('sorts strings ascending', () => {
    const { result } = renderHook(() => useSort(rows))
    act(() => result.current.setSortState({ key: 'name', direction: 'asc' }))
    expect(result.current.sortedRows.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('sorts strings descending', () => {
    const { result } = renderHook(() => useSort(rows))
    act(() => result.current.setSortState({ key: 'name', direction: 'desc' }))
    expect(result.current.sortedRows.map(r => r.name)).toEqual(['Charlie', 'Bob', 'Alice'])
  })

  it('sorts numbers ascending', () => {
    const { result } = renderHook(() => useSort(rows))
    act(() => result.current.setSortState({ key: 'salary', direction: 'asc' }))
    expect(result.current.sortedRows.map(r => r.salary)).toEqual([50000, 80000, 120000])
  })

  it('does not mutate input array', () => {
    const original = [...rows]
    const { result } = renderHook(() => useSort(rows))
    act(() => result.current.setSortState({ key: 'name', direction: 'asc' }))
    expect(rows).toEqual(original)
  })

  it('applies defaultSort on mount', () => {
    const { result } = renderHook(() => useSort(rows, { key: 'name', direction: 'asc' }))
    expect(result.current.sortedRows[0].name).toBe('Alice')
  })
})
```

---

## Step 12 — Cell Components

### Files to create

```
fast-table/cell/
  cell.types.ts
  cell-editor.tsx
  selection-cell.tsx
  table-cell.tsx
```

### `cell.types.ts`

```ts
import type { ColumnDef, TableRowState } from '../types.js'
export interface TableCellProps<T> {
  column:   ColumnDef<T>
  rowState: TableRowState<T>
}
```

### `cell-editor.tsx`

Maps `CellEditorDef` to the appropriate `src/form/` component. Imports `Input`, `Select`, `CheckBox` from `@ai-agencee/ui/form`.

Rules:
- `type: 'custom'` → calls `editor.render(field)` directly
- All other types → import from `../../form/index.js`
- No `class`, no ` any `

### `table-cell.tsx`

```tsx
// When isActive: render <CellEditor>
// When NOT isActive: render <span>{displayValue}</span> with cell style rules applied
// cellClasses from column.cellRules via useMemo
```

### Battle tests

**`fast-table/__tests__/cell-editor.test.tsx`**:

```ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CellEditor } from '../cell/cell-editor.js'
// wrap with FormProvider mock

describe('CellEditor', () => {
  it('renders Input for type=text', () => { ... })
  it('renders Input for type=number', () => { ... })
  it('renders Select for type=select', () => { ... })
  it('renders CheckBox for type=checkbox', () => { ... })
  it('calls render() for type=custom', () => { ... })
})
```

Minimum 5 cases (one per union arm).

---

## Step 13 — Row Components

### Files to create

```
fast-table/row/
  row.types.ts
  active-row-form-provider.tsx
  table-row.tsx
```

### `active-row-form-provider.tsx`

Implements §8a. Always mounted. Only context value changes on activation.

Props: `form`, `schema`, `activeRowId`, `onCellChange`, `children`.

Must call `form.reset(initialValues)` inside `activateRow`. Must never unmount/remount children.

### `table-row.tsx`

Reads `isActive`, `isVisible`, `isInNearVisibleRange` from `rowState`.  
Early returns `null` if `!isVisible && !isInNearVisibleRange`.  
Applies `useRowStyles` for row-level Tailwind classes.  
Renders `TableCell` per column.

### Battle tests

**`fast-table/__tests__/table-row.test.tsx`**:

```ts
describe('TableRow', () => {
  it('renders null when not visible and not in near range', () => { ... })
  it('renders cells when isVisible', () => { ... })
  it('applies active ring class when row is active', () => { ... })
  it('applies selected bg class when row is selected', () => { ... })
  it('renders cells count equal to columns count', () => { ... })
})
```

---

## Step 14 — Header Components

### Files to create

```
fast-table/header/
  table-header.tsx
  header-cell.tsx
  selection-header-cell.tsx
```

### `header-cell.tsx`

Resize handle: `onPointerDown` → `onPointerMove` on document → `onPointerUp`. No `class`. Uses `useRef` for dragging start state.

Sort indicator: `↑` / `↓` / none.

Drag reorder: `draggable`, `onDragStart`, `onDragOver`, `onDrop`.

### Battle tests

**`fast-table/__tests__/header-cell.test.tsx`**:

```ts
describe('HeaderCell', () => {
  it('renders column label', () => { ... })
  it('renders sort indicator ↑ when asc', () => { ... })
  it('renders sort indicator ↓ when desc', () => { ... })
  it('no sort indicator when sortState is null', () => { ... })
  it('resize handle is present when column is not fixed', () => { ... })
})
```

---

## Step 15 — Root `FastTable` Component

### Files to create

```
fast-table/fast-table.tsx
fast-table/fast-table.classes.ts
fast-table/index.ts
```

### `fast-table.tsx`

- Creates **one** formular instance via `useMemo` (`useFormular(schema)`) → never recreated.
- Wires `FastTableContext` and `ActiveRowFormProvider` at root.
- Handles `transporter` prop: reads `transporter.rows`, wires `shouldFetchMore` via `useEffect`.
- Scroll container: `onScroll` → updates `scrollTop` ref → calls `useVirtualRows`.
- Renders `TableHeader` + virtual row list.

### `fast-table.classes.ts`

```ts
export const tableRoot     = 'flex flex-col overflow-hidden rounded-node border border-neutral-200 dark:border-neutral-700'
export const scrollArea    = 'overflow-y-auto relative flex-1'
export const sentinel      = 'relative w-full'
export const rowSpacer     = 'w-full'
```

### `index.ts`

Barrel — exports every public symbol from the fast-table subtree.

### Battle tests

**`fast-table/__tests__/fast-table.test.tsx`**:

```ts
describe('FastTable', () => {
  it('renders without crashing with empty rows', () => { ... })
  it('renders header with column labels', () => { ... })
  it('renders visible rows', () => { ... })
  it('does not render more rows than containerHeight allows + overscan', () => { ... })
  it('calls transporter.fetchMore when shouldFetchMore fires', async () => { ... })
})
```

---

## Step 16 — Test Page

### File to create

```
_private/showcase-web/src/pages/fast-table-demo.tsx
```

### Requirements from §14

- 5 000 rows: `{ id, name, email, role, salary, active, department }` — deterministic seeder, no library.
- `createMockAdapter` from `fast-table/transport/create-mock-adapter.js`.
- `useTableDataTransporter` wired to `FastTable` via `transporter` prop.
- Columns: id (locked), name (text/editable), email (email/editable), role (select), salary (number, `format: v => '$'+Number(v).toLocaleString()`), active (checkbox), department (select).
- Exercises: sort, select all/invert, edit name → blur.
- Salary column has `cellRules` for low/mid/high colour thresholds (§21g example 1).
- `rowRules` prop passes an `inactive` rule (§21g example 4).

No test needed for this file — it is a manual demo page.

---

## Step 17 — Package Export Registration

### Files to update

```
_private/ui/package.json          ← add "./fast-table" sub-path
_private/ui/src/fast-table/index.ts ← already created in Step 15
```

Add to `package.json` exports:

```json
"./fast-table": "./src/fast-table/index.ts"
```

---

## Step 18 — Final Validation

```
cd _private/ui
pnpm typecheck
pnpm lint
pnpm test

cd _private/showcase-web
pnpm typecheck
```

All must exit 0 before declaring the implementation complete.

---

## Appendix A — Forbidden Patterns (grep before every commit)

```powershell
# Run from _private/ui/src/fast-table/
Select-String -Path "**\*.ts","**\*.tsx" -Pattern " any " -Recurse
Select-String -Path "**\*.ts","**\*.tsx" -Pattern "class " -Recurse
Select-String -Path "**\*.ts","**\*.tsx" -Pattern "useImperativeHandle" -Recurse
```

All must return **0 matches**.

---

## Appendix B — File Naming Quick-Reference

| Pattern | Example |
|---------|---------|
| Feature constructor | `fast-table.tsx` |
| Types | `fast-table.types.ts` / `cell.types.ts` |
| Classes (Tailwind maps) | `fast-table.classes.ts` |
| Factory function | `create-mock-adapter.ts` |
| Hook | `use-virtual-rows.ts` |
| Context file | `fast-table-context.ts` |
| Barrel | `index.ts` |
| Test | `__tests__/fast-table.test.tsx` |

---

## Appendix C — Dependency Graph (build bottom-up)

```
Step 1: types.ts, transporter.types.ts                    ← zero deps
Step 2: row-style-rule.types.ts, default-row-rules.ts     ← depends on Step 1
Step 3: use-virtual-rows.ts                               ← depends on Step 1
Step 4: use-table-rows.ts                                 ← depends on Step 1, Step 3
Step 5: use-col-sizes.ts                                  ← depends on Step 1
Step 6: use-row-styles.ts                                 ← depends on Step 1, Step 2
Step 7: use-format-field.ts                               ← depends on formular-bridge (existing)
Step 8: use-table-data-transporter.ts, create-mock-adapter.ts ← depends on Step 1
Step 9: fast-table-context.ts, active-row-context.ts      ← depends on Step 1
Step 10: use-row-selection.ts                             ← zero deps
Step 11: use-sort.ts                                      ← depends on Step 1
Step 12: cell/*.tsx                                       ← depends on Step 1, 9
Step 13: row/*.tsx                                        ← depends on Step 1, 2, 6, 9
Step 14: header/*.tsx                                     ← depends on Step 1, 9
Step 15: fast-table.tsx, index.ts                         ← depends on all previous
Step 16: showcase-web demo page                           ← depends on Step 15
Step 17: package.json export registration                 ← depends on Step 15
Step 18: final validation                                 ← depends on all
```
