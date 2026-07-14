// ── Root component ────────────────────────────────────────────────────────────
export { FastTable } from './fast-table.js'

// ── Types (public API) ────────────────────────────────────────────────────────
export type {
    CellChangeEvent,
    CellEditorDef,
    CellStyleRule,
    ColumnDef,
    FastTableProps,
    RowStyleRule,
    SortState,
    TableRowState
} from './types.js'

// ── Transport ─────────────────────────────────────────────────────────────────
export { createMockAdapter } from './transport/create-mock-adapter.js'
export type {
    DataTransporter,
    FetchParams,
    FilterOperator,
    FilterState,
    PageResult,
    PatchRowParams,
    PatchRowResult,
    PatchSelectionParams,
    TableDataAdapter,
    TransporterOptions
} from './transport/transporter.types.js'
export { useTableDataTransporter } from './transport/use-table-data-transporter.js'

// ── Contexts ──────────────────────────────────────────────────────────────────
export { ActiveRowContext, useActiveRow } from './active-row-context.js'
export type { ActiveRowContextValue } from './active-row-context.js'
export { FastTableContext, useFastTableContext } from './fast-table-context.js'
export type { FastTableContextValue } from './fast-table-context.js'

// ── Hooks (for advanced composability) ────────────────────────────────────────
export { useColSizes } from './hooks/use-col-sizes.js'
export type { ColSizesResult } from './hooks/use-col-sizes.js'
export { useRowSelection } from './hooks/use-row-selection.js'
export type { RowSelectionResult } from './hooks/use-row-selection.js'
export { mergeRules, useRowStyles } from './hooks/use-row-styles.js'
export { useSort } from './hooks/use-sort.js'
export type { SortResult } from './hooks/use-sort.js'
export { useTableRows } from './hooks/use-table-rows.js'
export { useVirtualRows } from './hooks/use-virtual-rows.js'
export type { VirtualWindow } from './hooks/use-virtual-rows.js'

// ── Style rules ───────────────────────────────────────────────────────────────
export { DEFAULT_ROW_RULES } from './styles/default-row-rules.js'
export type {
    CellStyleRule as CellStyleRuleType, RowStyleRule as RowStyleRuleType
} from './styles/row-style-rule.types.js'

// ── Class names ───────────────────────────────────────────────────────────────
export { fastTableClasses } from './fast-table.classes.js'
