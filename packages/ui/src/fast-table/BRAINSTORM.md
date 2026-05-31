# FastTable — Architecture & Design Brainstorm

> Follow-up to the initial session. All decisions below are deliberate, not proposals.

---

## 1 — Purpose

A fully-featured virtualized data grid that:
- renders thousands of rows without DOM bloat (virtual window)
- supports inline editing with validation gated through formular.dev
- dispatches cell changes as aggregates (redux/saga → API → feedback)
- aligns column widths between header and rows at the CSS level
- supports user-resizable columns, row/column reordering, sorting, and multi-select

---

## 2 — Rendering Strategy

### CSS Grid (not `<table>`)

`<table>` breaks virtual scrolling because `tbody` cannot be a scroll container while `<col>` widths are respected.  
CSS Grid solves this: the same `grid-template-columns` string is applied to **both header and every row**, so they are always aligned without any JS measurement.

```
┌──────────────────────────────────────────────────────────────┐
│ TableHeader  (position: sticky; top: 0; z-index: 10)         │
│ display:grid; grid-template-columns: {colSizes}              │
├──────────────────────────────────────────────────────────────┤
│ Scroll container  (overflow-y: auto; height: containerHeight)│
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Sentinel  (height = totalRows × rowHeight)             │  │
│  │  ┌ top-spacer (height = startIndex × rowHeight) ─────┐ │  │
│  │  │ TableRow × visible slice                          │ │  │
│  │  │   display:grid; grid-template-columns: {colSizes} │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  │  bottom-spacer                                          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3 — Column Width System

### Default sizing
- Available `containerWidth` is divided equally among all columns.
- Each column gets at least `MIN_COL_WIDTH = 80px`.
- If `ColumnDef.width` is provided (px number), that column is fixed; remaining space is redistributed among flex columns.
- Result is a `cssMinMax(min, 1fr)` expression per column or a fixed `px` value.
- The computed `grid-template-columns` string is the **single source of truth** derived in `use-col-sizes.ts`.

### User resizing
- Each `HeaderCell` has an absolutely-positioned resize handle on its right edge (4px wide, full height).
- `onPointerDown` on the handle stores the starting `clientX` and starting column width.
- `onPointerMove` (captured on `document`) computes `delta = clientX - startX` and calls `setColWidths(prev => ...)`.
- `onPointerUp` releases capture and persists the widths to `localStorage` (keyed by `tableId`).
- The widths array lives in `use-col-sizes.ts`; both the header and all rows read the same derived `gridTemplateColumns` string from context.

### Column reorder (drag)
- `HeaderCell` is draggable (`draggable={true}`).
- Drop target is any other `HeaderCell`.
- On drop: reorder `columns` array in state → `use-col-sizes.ts` recomputes `gridTemplateColumns` → all rows update automatically via context.
- Persisted to `localStorage` as `columnOrder: string[]` (array of column keys).

---

## 4 — Row Height

- Fixed uniform height required by virtual window math.
- `rowHeight: number` (px) — **required** prop on `FastTable`.
- Default value: `40`.
- Passed into context so individual rows never need to re-receive it.

---

## 5 — Virtual Windowing (`use-virtual-rows.ts`)

```ts
interface VirtualWindow {
  startIndex:     number   // first row to render
  endIndex:       number   // last row to render (exclusive)
  totalHeight:    number   // sentinel height = totalRows × rowHeight
  topOffset:      number   // px to push rendered rows down
  bottomOffset:   number   // spacer below rendered rows
}

// = f(totalRows, rowHeight, containerHeight, scrollTop, overscan = 3)
```

- `startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)`
- `endIndex   = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan)`
- `topOffset  = startIndex × rowHeight`
- `bottomOffset = totalHeight - endIndex × rowHeight`
- `scrollTop` tracked via `useRef` + `onScroll` handler on the scroll container.
- Re-render happens only when `startIndex` or `endIndex` actually changes (stable reference check).

**Container height**: either a required `containerHeight` prop **or** auto-measured via `ResizeObserver`. We expose both paths — prop wins, observer is fallback.

---

## 6 — Cell Edit Modes: `editable` / `locked`

Each cell has a mode driven by `ColumnDef.editable` and an optional per-row override:

| mode       | display | behaviour |
|------------|---------|-----------|
| `locked`   | read-only span | no focus, no edit |
| `editable` | activates on click | shows form control |

Cell activation flow:
1. User clicks cell → `isFocused = true`
2. Form control renders inside the cell (Input / Select / CheckBox from `src/form/`)
3. User edits, control is controlled by `useFormularField` inside a `RowFormProvider`
4. On `blur` or `Enter` → validation runs → if valid, `onCellChange` fires
5. On `Escape` → draft is discarded, previous value restored

---

## 7 — Cell Types (reusing `src/form/`)

Cells do **not** re-implement form controls. They accept a `ColumnDef.editor` union:

```ts
type CellEditorDef =
  | { type: 'text';     placeholder?: string }
  | { type: 'number';   min?: number; max?: number }
  | { type: 'email' }
  | { type: 'password' }
  | { type: 'select';   options: { value: string; label: string }[] }
  | { type: 'checkbox' }
  | { type: 'custom';   render: (field: FieldSnapshot) => ReactNode }
```

`TableCell` maps this to the matching component from `src/form/`:
- `text | number | email | password` → `<Input type={...} />`
- `select` → `<Select options={...} />`
- `checkbox` → `<CheckBox />`
- `custom` → calls `render(field)` directly

The cell passes `name={columnKey}` and the cell is always a child of a `RowFormProvider` — so `useFormularField(columnKey)` resolves correctly.

---

## 8 — Row Model

Every entry in the `rows` array is decorated with runtime flags:

```ts
interface TableRowState<T> {
  data:               T
  errors:             Record<keyof T, ErrorLike[]>   // last known server errors per field
  isActive:           boolean   // user is editing this row (one at a time)
  isSelected:         boolean   // checkbox selection — independent of isActive
  isVisible:          boolean   // inside the virtual window — render eagerly
  isInNearVisibleRange: boolean // just outside the window — render lazily (no form, no handlers)
}
```

These flags are derived state managed by `use-table-rows.ts`. The original `T` data is never mutated — flags live alongside.

---

## 8a — Formular Integration: Single `ActiveRowFormProvider`

### The challenge
- `FormProvider` wraps a single `form` (one `IFormularLike` per provider).
- A table can have 10 000 rows. One `FormProvider` per visible row would create up to 40 formular instances — each with its own React state tree.
- Creating/destroying providers as rows scroll in/out causes remounts → frame drops.
- Structurally adding/removing a Provider node in the tree forces React to unmount all children beneath it → guaranteed flicker.

### Solution: one provider, always mounted — swap its data, never its position

```
FastTable
  └── ActiveRowFormProvider   ← ONE instance, always in the tree at this fixed position
       └── scroll container
            └── TableRow × N  (virtual — only visible rows rendered)
                 └── TableCell × M
                      if row.isActive
                        → <Input|Select|CheckBox />  (consumes ActiveRowFormProvider via context)
                      else
                        → <span>{displayValue}</span>  (pure display, zero form overhead)
```

### How activation works (zero flicker)

1. User clicks/focuses any cell in row R  
   → `setActiveRowId(R.id)` (table-level state)  
   → `form.reset(R.data)` on the **single** pre-created formular instance  
   → `ActiveRowFormProvider` updates its context value — **no structural tree change**  
   → cells in row R read the new context value and switch from display to form-control mode via conditional render

2. User leaves row (blur away, click another row, press Escape / Tab out)  
   → pending valid changes are dispatched via `onCellChange`  
   → `setActiveRowId(null)`  
   → context value becomes `null`  
   → all cells fall back to display mode — **no unmount, no flicker**

### Why this works without flicker

Flicker comes from **structural** React tree changes (mounting/unmounting nodes).  
Here the tree is **static** — `ActiveRowFormProvider` is always at the same position.  
Only its **context value** changes, which triggers a context re-render in cells that consume it.  
Cells switch render path (display ↔ form control) via a conditional inside a single component — same DOM node, just different children.  
CSS opacity/transition can soften the state switch further if needed.

### `ActiveRowFormProvider` API

```ts
interface ActiveRowFormProviderProps {
  form:         IFormularLike   // single instance created once by FastTable
  schema:       SchemaLike
  activeRowId:  string | number | null
  onCellChange: (event: CellChangeEvent) => Promise<ErrorLike[] | null>
  children:     ReactNode
}
```

Exposes via context:
```ts
interface ActiveRowContextValue {
  bridge:      FormBridge | null   // null when no row is active
  activeRowId: string | number | null
  activateRow: (rowId: string | number, initialValues: Record<string, unknown>) => void
  deactivateRow: () => void
}
```

Cells call `useActiveRow()` to get this context. Bridge is only non-null when the cell's row matches `activeRowId`.

### Server error injection

When the saga returns errors after a PATCH:
- `onCellChange` resolves with `ErrorLike[]`
- The errors are written into `TableRowState.errors` for that row
- Display cells read `rowState.errors[colKey]` directly — no formular instance needed
- If the row is still active, errors are also pushed into the live bridge via a ref callback

---

## 9 — Aggregate / Dispatch Pattern

```
Cell blur/Enter
  → useFormularField.validate(name)
  → if valid: onCellChange({ rowId, key, prev, next })
    → FastTable.onCellChange (prop)
      → dispatch(updateCellAggregate({ rowId, key, value: next }))
        → saga: await api.patch(...)
          → dispatch(updateCellSuccess(...))  → store → row re-renders
          → dispatch(updateCellFailure(...))  → cell shows server error via field.errors
```

Server errors fed back into cells:
- `onCellChange` returns a `Promise<ErrorLike[] | null>`.
- If errors are returned, `RowFormProvider` calls `bridge.getErrors(name)` setter to inject them.
- The cell then shows validation state without the user having to re-submit.

---

## 10 — Row Selection

### Model
```ts
interface SelectableRow {
  isSelected: boolean
  // ... domain fields
}
```

### Header checkbox
| state | meaning |
|-------|---------|
| unchecked | 0 rows selected |
| indeterminate | some rows selected |
| checked | all visible rows selected |

### Actions (header row)
- **Select all** — sets `isSelected = true` for all rows in current filter/sort view
- **Select none** — clears all
- **Invert** — toggles each row's `isSelected`

### Per-row checkbox
- First cell of every `TableRow` is always a fixed-width (40px) checkbox cell.
- Clicking toggles `isSelected` on the row model.
- Dispatches `selectRow({ rowId, isSelected })` aggregate → saga → PATCH `{ isSelected }` to API.

### Multi-select keyboard support
- `Shift+Click` selects a range.
- `Ctrl/Cmd+Click` toggles individual rows.

---

## 11 — Sorting

```ts
interface ColumnDef<T> {
  // ...
  sortable?:  boolean           // default false
  sortFn?:    (a: T, b: T) => number  // custom comparator
}

interface SortState {
  key:        string
  direction:  'asc' | 'desc'
}
```

- Clicking a sortable header cycles: `none → asc → desc → none`.
- Sort indicator (↑ / ↓) rendered in `HeaderCell`.
- Sort happens on the rows array **before** slicing for virtual window.
- If `sortFn` is not provided, uses default string/number/boolean comparison.
- Multiple column sort is a phase-2 feature.

---

## 12 — File Structure

```
fast-table/
  types.ts                        ← ColumnDef, CellEditorDef, CellChangeEvent, SortState, FastTableProps
  fast-table.tsx                  ← root component, scroll listener, passes context
  fast-table.classes.ts           ← Tailwind class maps
  fast-table-context.ts           ← React context (colSizes, rowHeight, onCellChange, etc.)
  index.ts                        ← public exports

  header/
    table-header.tsx              ← sticky grid row
    header-cell.tsx               ← resize handle, sort indicator, drag reorder
    selection-header-cell.tsx     ← select-all / invert checkbox

  row/
    table-row.tsx                 ← grid row, wraps RowFormProvider
    row-form-provider.tsx         ← thin FormProvider wrapper, creates/recycles form instance
    row.types.ts

  cell/
    table-cell.tsx                ← click-to-activate, maps CellEditorDef → form component
    cell-editor.tsx               ← switch on editor.type → Input | Select | CheckBox | custom
    selection-cell.tsx            ← per-row isSelected checkbox (always first cell)
    cell.types.ts

  hooks/
    use-virtual-rows.ts           ← startIndex, endIndex, offsets
    use-col-sizes.ts              ← widths state, gridTemplateColumns string, localStorage sync
    use-column-drag.ts            ← drag-reorder logic
    use-row-selection.ts          ← selection state, selectAll/none/invert
    use-sort.ts                   ← sort state, sorted rows derivation
```

---

## 13 — Context Shape

Two separate contexts to prevent unnecessary re-renders:

### `FastTableContext` — layout, columns, sort, selection (stable references)
```ts
interface FastTableContextValue<T> {
  // Layout
  gridTemplateColumns:  string
  rowHeight:            number
  containerRef:         RefObject<HTMLDivElement>

  // Column management
  columns:              ColumnDef<T>[]
  colWidths:            number[]
  setColWidth:          (index: number, width: number) => void
  reorderColumns:       (fromIndex: number, toIndex: number) => void

  // Sort
  sortState:            SortState | null
  setSortState:         (s: SortState | null) => void

  // Selection
  selectedIds:          Set<string | number>
  toggleRow:            (rowId: string | number, extend?: boolean) => void
  selectAll:            () => void
  selectNone:           () => void
  invertSelection:      () => void

  // Edit
  onCellChange:         (event: CellChangeEvent<T>) => Promise<ErrorLike[] | null>
}
```

### `ActiveRowContext` — changes on every row activation, isolated to minimise re-renders
```ts
interface ActiveRowContextValue {
  bridge:       FormBridge | null
  activeRowId:  string | number | null
  activateRow:  (rowId: string | number, initialValues: Record<string, unknown>) => void
  deactivateRow: () => void
}
```

Cells subscribe to `ActiveRowContext` only. Layout/sort consumers never re-render on row activation.

---

## 14 — Test Page (Priority 1)

Create `_private/showcase-web/src/pages/fast-table-demo.tsx`:

### Mock data
- 5 000 rows of `{ id, name, email, role, salary, active, department }`
- Generated with a simple deterministic seeder (no library needed)

### Columns
| key | type | sortable | editable |
|-----|------|----------|----------|
| id | number | yes | locked |
| name | text | yes | yes |
| email | email | yes | yes |
| role | select | yes | yes |
| salary | number | yes | yes |
| active | checkbox | no | yes |
| department | select | yes | yes |

### Demo features to exercise
- Scroll speed with 5 000 rows
- Column resize drag
- Column reorder drag
- Sort by name, salary
- Select all / invert / clear
- Edit name → blur → simulated aggregate (console.log)
- Edit role → select

---

## 15 — Open Decisions

| # | Decision | Choice made |
|---|----------|-------------|
| 1 | Grid engine | CSS Grid (not table) |
| 2 | Column widths | Flex 1fr default, user-draggable, persisted to localStorage |
| 3 | Row height | Fixed uniform, configurable |
| 4 | Formular integration | **Single `ActiveRowFormProvider` always mounted at table root — context value swaps, tree never changes → zero flicker** |
| 5 | Cell editors | Reuse `src/form/` components, no duplication |
| 6 | Aggregate dispatch | `onCellChange` prop returns `Promise<ErrorLike[] | null>` |
| 7 | Server error feedback | Errors written into `TableRowState.errors`; pushed to live bridge if row still active |
| 8 | Selection persistence | Dispatches `selectRow` aggregate → API PATCH |
| 9 | Container height | Prop-first, `ResizeObserver` fallback |
| 10 | Multi-col sort | Phase 2 |
| 11 | Row virtualisation | Index math only, no third-party lib |
| 12 | Row flags | `isActive`, `isSelected`, `isVisible`, `isInNearVisibleRange` on `TableRowState<T>` |
| 13 | React context split | `FastTableContext` (layout/sort/selection) + `ActiveRowContext` (edit) — isolated re-renders |
| 14 | Conditional formatting | `ColumnDef.format` for table cell display mode (all cells, both editable and locked); `formatValue`/`parseValue` props on `Input`/`TextArea` for standalone form display↔edit duality — `useFormatField<V>` hook extracts the logic |
| 15 | Conditional coloration | `RowStyleRule<T>[]` with `id`/`priority`/`condition`/`classes`; built-in `DEFAULT_ROW_RULES` for `dirty`, `selected`, `has-errors`, `active`; `CellStyleRule<T>[]` per `ColumnDef`; `mergeRules` by id; `rulePreset` prop (`default`\|`striped`\|`compact`\|`none`) |

---

## 16 — File Structure (revised)

```
fast-table/
  BRAINSTORM.md
  types.ts                            ← ColumnDef, CellEditorDef, CellChangeEvent, SortState, TableRowState, FastTableProps
  fast-table.tsx                      ← root: creates single formular instance, mounts ActiveRowFormProvider + FastTableContext
  fast-table.classes.ts
  fast-table-context.ts               ← FastTableContext (layout/sort/selection)
  active-row-context.ts               ← ActiveRowContext (edit bridge, activateRow, deactivateRow)
  index.ts

  header/
    table-header.tsx
    header-cell.tsx                   ← resize handle, sort indicator, drag reorder
    selection-header-cell.tsx

  row/
    table-row.tsx                     ← reads isActive/isVisible/isInNearVisibleRange from TableRowState
    active-row-form-provider.tsx      ← single FormProvider wrapper, always mounted, swaps context value
    row.types.ts

  cell/
    table-cell.tsx                    ← useActiveRow(); if activeRowId === rowId → form control; else → display span
    cell-editor.tsx                   ← maps CellEditorDef → Input | Select | CheckBox
    selection-cell.tsx
    cell.types.ts

  hooks/
    use-virtual-rows.ts               ← startIndex, endIndex, offsets, isVisible, isInNearVisibleRange flags
    use-col-sizes.ts                  ← widths state, gridTemplateColumns, localStorage
    use-column-drag.ts
    use-row-selection.ts
    use-sort.ts
    use-table-rows.ts                 ← decorates raw rows[] with TableRowState flags
```

---

## 17 — Build Order

1. `types.ts` + `transport/transporter.types.ts` — all types, zero dependencies
2. `hooks/use-virtual-rows.ts` — pure math, unit-testable (outputs `isVisible` + `isInNearVisibleRange` + `shouldFetchMore`)
3. `hooks/use-table-rows.ts` — decorates row data with runtime flags from virtual window
4. `hooks/use-col-sizes.ts` — widths state + `gridTemplateColumns`
5. `fast-table-context.ts` + `active-row-context.ts` — both context shapes
6. `transport/use-table-data-transporter.ts` — standalone, no React dependency except useState/useRef
7. `row/active-row-form-provider.tsx` — single FormProvider at table root, always mounted
8. `fast-table.tsx` — root shell: accepts `transporter` prop, creates formular instance once, wires contexts
9. `header/table-header.tsx` + `header/header-cell.tsx` (display only, no resize yet)
10. `row/table-row.tsx` + `cell/table-cell.tsx` + `cell/cell-editor.tsx` — virtual rows + cell edit/display toggle
11. **Test page with 5 000 rows** — mock adapter, exercise virtual core + single-provider activation + fetchMore
12. `cell/selection-cell.tsx` + `header/selection-header-cell.tsx` + `hooks/use-row-selection.ts`
13. `hooks/use-sort.ts` + sort indicators (sort state flows into transporter as `FetchParams.sort`)
14. Column resize handle
15. `hooks/use-column-drag.ts` — drag reorder
16. `localStorage` persistence
17. Server error injection path
18. Unit tests for all hooks + transporter
19. `src/form/use-format-field.ts` + add `formatValue`/`parseValue` props to `Input` and `TextArea`
20. `fast-table/styles/row-style-rule.types.ts` — `RowStyleRule<T>`, `CellStyleRule<T>`
21. `fast-table/styles/default-row-rules.ts` — `DEFAULT_ROW_RULES` built-in set
22. `fast-table/hooks/use-row-styles.ts` — `mergeRules`, `useRowStyles`; wire into `table-row.tsx` and `table-cell.tsx`

---

## 18 — Data Transporter

### Responsibility

The transporter is the **only** layer that knows about pagination and backend protocol.  
The table knows nothing about cursors, pages, or HTTP — it only sees `rows: T[]`.

```
FastTable
  props.transporter.rows    ← accumulated, sorted, filtered rows (all pages loaded so far)
  props.transporter.isLoading
  props.transporter.hasMore
  ↓ when scroll nears end:
  props.transporter.fetchMore()   ← appends next page
  ↓ on cell blur (valid):
  props.transporter.patchRow(...)  ← optimistic update + API call
  ↓ on selection toggle:
  props.transporter.patchSelection(...)
```

---

### 18a — Protocol Types

```ts
// ── Filtering ──────────────────────────────────────────────

type FilterOperator =
  | 'eq' | 'neq'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in'
  | 'isNull' | 'isNotNull'

interface FieldFilter<T, K extends keyof T = keyof T> {
  key:      K
  operator: FilterOperator
  value:    K extends keyof T ? T[K] : never
}

type FilterState<T> = FieldFilter<T>[]

// ── Sorting (generic — replaces the plain SortState in §11) ──

interface SortState<T = Record<string, unknown>> {
  key:       keyof T
  direction: 'asc' | 'desc'
}

// ── Cursor page request sent to the adapter ──────────────────

interface FetchParams<T> {
  cursor:  string | null    // null = first page / after reset
  limit:   number
  sort:    SortState<T> | null
  filters: FilterState<T>
}

// ── What the adapter must return ─────────────────────────────

interface PageResult<T> {
  rows:        T[]
  nextCursor:  string | null   // null = no more pages
  totalCount?: number          // optional — powers progress indicator
}

// ── Write operations ─────────────────────────────────────────

interface PatchRowParams<T> {
  rowId: string | number
  key:   keyof T
  prev:  T[keyof T]
  next:  T[keyof T]
}

interface PatchRowResult {
  errors: ErrorLike[] | null   // null = success
}

interface PatchSelectionParams {
  rowIds:     (string | number)[]
  isSelected: boolean
}
```

---

### 18b — Backend Adapter Interface

The user implements this. One per API/transport style (REST, GraphQL, mock).

```ts
interface TableDataAdapter<T> {
  /**
   * Fetch a page of rows. Called on first load, after sort/filter changes (cursor=null),
   * and on fetchMore() (cursor = last nextCursor).
   */
  fetch(params: FetchParams<T>): Promise<PageResult<T>>

  /**
   * Persist a single cell change. Optional — if absent, patchRow() is a no-op.
   * Return errors to surface server validation back into the cell.
   */
  patchRow?(params: PatchRowParams<T>): Promise<PatchRowResult>

  /**
   * Persist selection state for one or more rows.
   * Optional — if absent, selection is local-only.
   */
  patchSelection?(params: PatchSelectionParams): Promise<void>
}
```

---

### 18c — Transporter State (what the table reads)

```ts
interface DataTransporter<T> {
  // ── readable state ───────────────────────────────────────
  rows:           T[]                    // accumulated across all loaded pages
  isLoading:      boolean                // true during initial load or after reset
  isFetchingMore: boolean                // true during incremental fetchMore
  hasMore:        boolean                // false when nextCursor === null
  cursor:         string | null          // current cursor (last received nextCursor)
  totalCount:     number | undefined     // from last PageResult, if adapter provides it
  error:          Error | null           // last fetch-level error

  // ── actions ──────────────────────────────────────────────
  fetchMore():    void                   // appends next page; ignored if !hasMore || isFetchingMore
  reload():       void                   // resets cursor + rows, fetches from scratch; called on sort/filter change

  patchRow(
    params: PatchRowParams<T>
  ): Promise<ErrorLike[] | null>         // optimistic update → returns server errors if any

  patchSelection(
    params: PatchSelectionParams
  ): Promise<void>
}
```

---

### 18d — `useTableDataTransporter` hook

```ts
interface TransporterOptions<T> {
  limit?:         number              // page size, default 50
  initialSort?:   SortState<T>
  initialFilters?: FilterState<T>
  prefetchThreshold?: number          // rows from end to trigger fetchMore, default = limit / 2
}

function useTableDataTransporter<T>(
  adapter:  TableDataAdapter<T>,
  options?: TransporterOptions<T>,
): DataTransporter<T>
```

**Internal state:**
```ts
rows:        T[]          // accumulated mutable local copy
cursor:      string | null
hasMore:     boolean
isLoading:   boolean
isFetchingMore: boolean
error:       Error | null
totalCount:  number | undefined
```

**`fetchMore()` logic:**
1. Guard: if `!hasMore || isFetchingMore || isLoading` → return
2. `setIsFetchingMore(true)`
3. `await adapter.fetch({ cursor, limit, sort, filters })`
4. `setRows(prev => [...prev, ...result.rows])`
5. `setCursor(result.nextCursor)`
6. `setHasMore(result.nextCursor !== null)`
7. `setIsFetchingMore(false)`

**`reload()` logic** (called when sort/filter changes):
1. `setRows([])`  `setCursor(null)`  `setHasMore(true)`  `setIsLoading(true)`
2. `await adapter.fetch({ cursor: null, limit, sort, filters })`
3. Same as fetchMore steps 4–7 but sets `isLoading` instead of `isFetchingMore`

**`patchRow()` logic (optimistic):**
1. Find row in `rows` by `rowId`
2. Snapshot previous value
3. **Optimistically mutate** `rows[i][key] = next` → `setRows([...rows])` → table re-renders immediately
4. `const result = await adapter.patchRow?.({ rowId, key, prev, next })`
5. If `result?.errors?.length` → **rollback**: restore snapshot, return `result.errors`
6. If success → return `null`
7. If `adapter.patchRow` is absent → return `null` (no-op persistence, local only)

**`patchSelection()` logic:**
1. Mutate `rows` optimistically for each id (set `isSelected`)
2. `await adapter.patchSelection?.({ rowIds, isSelected })`
3. On error: rollback

---

### 18e — Scroll-triggered `fetchMore`

`use-virtual-rows.ts` gains a new output:

```ts
interface VirtualWindow {
  // ... existing fields ...
  shouldFetchMore: boolean   // true when endIndex >= totalLoadedRows - prefetchThreshold
}
```

`fast-table.tsx` watches it:

```tsx
const { shouldFetchMore } = useVirtualRows(...)

useEffect(() => {
  if (shouldFetchMore) transporter?.fetchMore()
}, [shouldFetchMore, transporter])
```

This keeps the scroll math pure and decouples it from the transport layer.

---

### 18f — Sort/Filter → reload wiring

Sort state lives in `FastTableContext`. When it changes, `fast-table.tsx` calls `transporter.reload()`:

```tsx
useEffect(() => {
  transporter?.reload()
  // reload() reads the latest sort/filters from a ref — no stale closure
}, [sortState, filters])
```

The transporter stores `sort` and `filters` in refs (not state) so `fetchMore()` always uses the current values without needing them as dependencies.

---

### 18g — FastTable prop surface

```ts
interface FastTableProps<T> {
  // ── data: choose one ──────────────────────────────────────
  transporter?: DataTransporter<T>   // backend-connected, paginated
  rows?:        T[]                  // static / already-loaded data

  // ── required ─────────────────────────────────────────────
  columns:      ColumnDef<T>[]
  getRowId:     (row: T) => string | number
  schema:       SchemaLike           // formular.dev schema for row validation

  // ── layout ───────────────────────────────────────────────
  rowHeight?:        number          // default 40
  containerHeight?:  number          // if absent, measured via ResizeObserver

  // ── behaviour ────────────────────────────────────────────
  onCellChange?:     (event: CellChangeEvent<T>) => Promise<ErrorLike[] | null>
  className?:        string
}
```

When `transporter` is provided, `rows` is ignored. `onCellChange` routes to `transporter.patchRow` internally unless the caller also passes it explicitly (override).

---

### 18h — Mock Adapter (for test page)

```ts
function createMockAdapter<T>(
  allRows: T[],
  latencyMs = 200,
): TableDataAdapter<T> {
  return {
    async fetch({ cursor, limit, sort, filters }) {
      await sleep(latencyMs)
      const offset = cursor ? parseInt(cursor, 10) : 0
      let view    = [...allRows]
      // apply filters
      for (const f of filters) view = applyFilter(view, f)
      // apply sort
      if (sort) view = applySort(view, sort)
      const page = view.slice(offset, offset + limit)
      return {
        rows:        page,
        nextCursor:  offset + limit < view.length ? String(offset + limit) : null,
        totalCount:  view.length,
      }
    },
    async patchRow({ rowId, key, next }) {
      await sleep(latencyMs / 2)
      // simulate occasional server error
      if (Math.random() < 0.05) {
        return { errors: [{ message: 'Server rejected value', code: 'SERVER_ERROR' }] }
      }
      const row = allRows.find(r => (r as Record<string, unknown>).id === rowId)
      if (row) (row as Record<string, unknown>)[key as string] = next
      return { errors: null }
    },
    async patchSelection({ rowIds, isSelected }) {
      await sleep(latencyMs / 2)
      for (const id of rowIds) {
        const row = allRows.find(r => (r as Record<string, unknown>).id === id)
        if (row) (row as Record<string, unknown>).isSelected = isSelected
      }
    },
  }
}
```

---

## 19 — Updated File Structure

```
fast-table/
  BRAINSTORM.md
  types.ts                              ← ColumnDef, CellEditorDef, CellChangeEvent, SortState<T>,
  fast-table.tsx                           TableRowState, FastTableProps
  fast-table.classes.ts
  fast-table-context.ts                 ← FastTableContext (layout/sort/selection)
  active-row-context.ts                 ← ActiveRowContext (edit bridge, activateRow, deactivateRow)
  index.ts

  transport/
    transporter.types.ts                ← FilterOperator, FieldFilter, FilterState, FetchParams,
                                           PageResult, PatchRowParams, PatchRowResult,
                                           PatchSelectionParams, TableDataAdapter, DataTransporter,
                                           TransporterOptions
    use-table-data-transporter.ts       ← useTableDataTransporter<T> hook
    create-mock-adapter.ts              ← deterministic mock for tests + demo page

  header/
    table-header.tsx
    header-cell.tsx
    selection-header-cell.tsx

  row/
    table-row.tsx
    active-row-form-provider.tsx
    row.types.ts

  cell/
    table-cell.tsx
    cell-editor.tsx
    selection-cell.tsx
    cell.types.ts

  hooks/
    use-virtual-rows.ts                 ← + shouldFetchMore output
    use-col-sizes.ts
    use-column-drag.ts
    use-row-selection.ts
    use-sort.ts
    use-table-rows.ts
    use-row-styles.ts                   ← mergeRules(), useRowStyles(); evaluates RowStyleRule[] against TableRowState

  styles/
    default-row-rules.ts                ← DEFAULT_ROW_RULES built-in set; exported for consumer extension
    row-style-rule.types.ts             ← RowStyleRule<T>, CellStyleRule<T>
```

> **`src/form/` addition (outside fast-table):**
> `src/form/use-format-field.ts` — `useFormatField<V>` hook: `displayValue`, `isEditing`, `handleFocus`, `handleBlur` for the `formatValue`/`parseValue` duality pattern.

---

## 20 — Conditional Formatting (Display ↔ Edit Duality)

Two independent layers — both needed, neither is a subset of the other.

---

### 20a — Column-level `format` (table cell display mode)

```ts
interface ColumnDef<T> {
  // ... existing fields ...
  format?: (value: T[keyof T], row: T) => string
}
```

**Where it applies:** `TableCell` **when `isActive === false`** (display span, not the live form control).  
**Works for both** `editable` and `locked` cells — anything not currently being edited shows the formatted string.  
**When active:** `isActive === true` → the raw value is passed directly into the form control; no formatting is applied — the user edits the real value.

```tsx
// table-cell.tsx (simplified)
const display = column.format
  ? column.format(cellValue, rowState.data)
  : String(cellValue ?? '')

return isThisRowActive
  ? <CellEditor column={column} />        // raw value, zero formatting
  : <span className={cx(...)}>{display}</span>  // formatted
```

**Why not use `formatValue` on the Input here?**  
In the table context, the whole cell *replaces* the display span with a form control on activation — a structural cell-level switch, not an Input-level one. No `formatValue` prop is needed or desired inside the table.

---

### 20b — Form component-level `formatValue` / `parseValue` (standalone use)

For `Input` and `TextArea` used **outside the table** (regular forms), two optional props enable display/edit duality within a single component instance:

```ts
// Additions to InputProps / TextAreaProps
formatValue?: (value: string | number) => string     // raw value → display string (shown when not focused)
parseValue?:  (display: string) => string | number   // typed string → raw value (applied on blur/commit)
```

**Behaviour:**

| state | render | value |
|-------|--------|-------|
| not focused | `<span className="cursor-text …">{formatValue(field.value)}</span>` | formatted |
| focused | `<input value={String(field.value)} />` | raw |
| on blur | `field.updateField(name, parseValue(inputString))` | parse→commit |

**Examples:**
```ts
// Salary (stored as number, displayed as currency)
formatValue: v => `$${Number(v).toLocaleString()}`    // "$1,234,567"
parseValue:  s => Number(s.replace(/[$,]/g, ''))       // 1234567

// ISO date (stored as ISO string, displayed as locale date)
formatValue: v => new Date(String(v)).toLocaleDateString()
parseValue:  s => new Date(s).toISOString()

// Percentage (stored as 0–1 decimal, displayed as %)
formatValue: v => `${(Number(v) * 100).toFixed(1)}%`  // "87.5%"
parseValue:  s => parseFloat(s) / 100                  // 0.875
```

---

### 20c — `useFormatField<V>` hook (`src/form/use-format-field.ts`)

Extracts the display/edit logic so `Input` and `TextArea` stay thin:

```ts
function useFormatField<V>(
  field:        FieldSnapshot<V>,
  formatValue?: (value: V) => string,
  parseValue?:  (display: string) => V,
) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const handleFocus = () => {
    setIsEditing(true)
    setDraft(String(field.value))           // switch to raw value on focus
  }

  const handleBlur = (inputString: string) => {
    setIsEditing(false)
    const parsed = parseValue ? parseValue(inputString) : (inputString as unknown as V)
    field.updateField(field.name, parsed)   // commit parsed value
  }

  const displayValue = isEditing
    ? draft
    : formatValue
      ? formatValue(field.value)
      : String(field.value ?? '')

  return { displayValue, isEditing, handleFocus, handleBlur, draft, setDraft }
}
```

`Input` and `TextArea` call this hook when `formatValue` is passed; otherwise behaviour is unchanged.  
`Select` and `CheckBox` do **not** receive these props — they have no typed-string edit model.

---

### 20d — Key invariants

- `ColumnDef.format` and form-component `formatValue`/`parseValue` are **orthogonal** — they coexist and never interfere.
- In the table, the formatter chain is: column `format` → `TableCell` display span. The form component never formats in the table path.
- In standalone forms, the formatter chain is: `useFormatField` → component render. `ColumnDef` does not exist in this context.
- `parseValue` must be the **exact inverse** of `formatValue` for the round-trip to be lossless. This is the developer's responsibility — no runtime enforcement.

---

## 21 — Conditional Coloration / Highlighting

Rule-based row and cell styling. A built-in default set covers the common cases; developers can override by matching `id`, add new rules by using a new `id`, or strip all defaults with `rulePreset="none"`.

---

### 21a — Type definitions (`fast-table/styles/row-style-rule.types.ts`)

```ts
/** Applied to the row container element. */
interface RowStyleRule<T> {
  /** Stable identifier — same id in `rowRules` prop replaces the default. */
  id:        string
  condition: (rowState: TableRowState<T>) => boolean
  /** Tailwind classes concatenated onto the row container. */
  classes:   string
  /**
   * Sort key — lower priority rules are applied first (their classes appear
   * earlier in the string). Higher priority classes therefore win CSS specificity
   * ties when using identical Tailwind utilities.
   */
  priority:  number
}

/** Applied to an individual cell in a specific column. */
interface CellStyleRule<T> {
  id:        string
  condition: (value: T[keyof T], rowState: TableRowState<T>) => boolean
  classes:   string
  priority:  number
}
```

`ColumnDef<T>` gains one new optional field:

```ts
interface ColumnDef<T> {
  // ... existing ...
  cellRules?: CellStyleRule<T>[]
}
```

---

### 21b — Default built-in rule set (`fast-table/styles/default-row-rules.ts`)

```ts
export const DEFAULT_ROW_RULES: RowStyleRule<unknown>[] = [
  {
    id:        'dirty',
    condition: r => (r.data as Record<string, unknown>).isDirty === true,
    classes:   'border-l-2 border-yellow-400',
    priority:  5,
  },
  {
    id:        'selected',
    condition: r => r.isSelected,
    classes:   'bg-brand-50 dark:bg-brand-950/60',
    priority:  10,
  },
  {
    id:        'has-errors',
    condition: r => Object.values(r.errors).some((e: unknown) => (e as unknown[]).length > 0),
    classes:   'bg-red-50/40 dark:bg-red-900/20',
    priority:  15,
  },
  {
    id:        'active',
    condition: r => r.isActive,
    classes:   'ring-2 ring-inset ring-brand-400 z-10 relative',
    priority:  20,
  },
]
```

This file is **exported from the package** so consumers can import it when they want to extend the defaults rather than replace them:

```ts
import { DEFAULT_ROW_RULES } from '@ai-agencee/ui/fast-table'

const myRules: RowStyleRule<Employee>[] = [
  ...DEFAULT_ROW_RULES,
  { id: 'vip', condition: r => r.data.tier === 'vip', classes: 'bg-purple-50 dark:bg-purple-900/20', priority: 25 },
]
```

---

### 21c — Merge logic (`hooks/use-row-styles.ts`)

```ts
/** Merges default and override rule sets. Same id = replace; new id = append. */
function mergeRules<T>(
  defaults:  RowStyleRule<T>[],
  overrides: RowStyleRule<T>[],
): RowStyleRule<T>[] {
  const map = new Map(defaults.map(r => [r.id, r]))
  for (const r of overrides) map.set(r.id, r)
  return [...map.values()].sort((a, b) => a.priority - b.priority)
}

/** Evaluates all rules against a row state and returns the combined class string. */
function useRowStyles<T>(
  rowState: TableRowState<T>,
  rules:    RowStyleRule<T>[],
): string {
  return useMemo(
    () => rules.filter(r => r.condition(rowState)).map(r => r.classes).join(' '),
    [rowState, rules],
  )
}
```

`mergeRules` is called **once** per table render with memoisation keyed on `rulePreset` + `rowRules` prop identity — not per-row, per-render.

---

### 21d — `FastTable` prop surface additions

```ts
interface FastTableProps<T> {
  // ... existing ...

  /**
   * Row-level style rules merged with DEFAULT_ROW_RULES.
   * - Same `id` as a default rule → replaces it.
   * - New `id` → added to the active set.
   */
  rowRules?:   RowStyleRule<T>[]

  /**
   * 'default'  — DEFAULT_ROW_RULES applied (default when prop is absent)
   * 'striped'  — DEFAULT_ROW_RULES + alternating even/odd row shading
   * 'compact'  — DEFAULT_ROW_RULES, row height CSS var tightened
   * 'none'     — DEFAULT_ROW_RULES stripped; only custom rowRules apply
   */
  rulePreset?: 'default' | 'striped' | 'compact' | 'none'
}
```

---

### 21e — Wiring in `table-row.tsx`

```tsx
// table-row.tsx
const { rulePreset, rowRules } = useFastTableContext()

const mergedRules = useMemo(
  () => mergeRules(rulePreset === 'none' ? [] : DEFAULT_ROW_RULES, rowRules ?? []),
  [rulePreset, rowRules],
)

// Inside render:
const rowClasses = useRowStyles(rowState, mergedRules)

return (
  <div
    className={cx(baseRowClasses, rowClasses)}
    style={{ gridTemplateColumns }}
  >
    {columns.map(col => <TableCell key={col.key} column={col} rowState={rowState} />)}
  </div>
)
```

---

### 21f — Wiring in `table-cell.tsx`

```tsx
// table-cell.tsx
const cellClasses = useMemo(
  () =>
    (column.cellRules ?? [])
      .filter(r => r.condition(cellValue, rowState))
      .sort((a, b) => a.priority - b.priority)
      .map(r => r.classes)
      .join(' '),
  [column.cellRules, cellValue, rowState],
)

return (
  <div className={cx(baseCellClasses, cellClasses)}>
    {isThisRowActive ? <CellEditor column={column} /> : <span>{displayValue}</span>}
  </div>
)
```

---

### 21g — Consumer examples

```tsx
// 1. Salary colour thresholds on the salary column
const salaryColumn: ColumnDef<Employee> = {
  key: 'salary',
  label: 'Salary',
  editor: { type: 'number' },
  format: v => `$${Number(v).toLocaleString()}`,
  cellRules: [
    { id: 'salary-low',  condition: v => Number(v) < 50_000,                            classes: 'text-red-600 font-medium',    priority: 1 },
    { id: 'salary-mid',  condition: v => Number(v) >= 50_000 && Number(v) < 100_000,    classes: 'text-yellow-600',             priority: 1 },
    { id: 'salary-high', condition: v => Number(v) >= 100_000,                          classes: 'text-green-600 font-semibold', priority: 1 },
  ],
}

// 2. Override the built-in 'selected' rule colour
<FastTable
  rowRules={[
    { id: 'selected', condition: r => r.isSelected, classes: 'bg-amber-100 dark:bg-amber-900/40', priority: 10 }
  ]}
/>

// 3. Strip defaults entirely, use one custom rule
<FastTable
  rulePreset="none"
  rowRules={[
    { id: 'vip', condition: r => r.data.tier === 'vip', classes: 'bg-purple-50 border-l-4 border-purple-500', priority: 1 }
  ]}
/>

// 4. Keep defaults, dim inactive/disabled rows
<FastTable
  rowRules={[
    { id: 'inactive', condition: r => r.data.active === false, classes: 'opacity-50 saturate-50', priority: 3 }
  ]}
/>
