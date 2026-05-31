import type { ReactNode } from 'react'
import type { ErrorLike, SchemaLike } from '../formular-bridge/form-provider.js'

export type { ErrorLike }

// ─── Style rules ────────────────────────────────────────────────────────────

export interface RowStyleRule<T> {
  /** Stable identifier — same id in `rowRules` prop replaces the default. */
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

// ─── Cell editor union ───────────────────────────────────────────────────────

export type CellEditorDef<T = unknown> =
  | { type: 'text';     placeholder?: string }
  | { type: 'number';   min?: number; max?: number }
  | { type: 'email' }
  | { type: 'password' }
  | { type: 'select';   options: { value: string; label: string }[] }
  | { type: 'checkbox' }
  | { type: 'custom';   render: (field: import('../formular-bridge/use-formular-field.js').FieldSnapshot) => ReactNode }

// ─── Column definition ───────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key:          keyof T
  label:        string
  editable?:    boolean
  locked?:      boolean
  sortable?:    boolean
  sortFn?:      (a: T, b: T) => number
  editor?:      CellEditorDef<T>
  /** Applied when cell is in display mode (isActive === false). Both editable and locked cells. */
  format?:      (value: T[keyof T], row: T) => string
  cellRules?:   CellStyleRule<T>[]
  /** Fixed pixel width. Absent = flex (1fr). */
  width?:       number
}

// ─── Row runtime state ───────────────────────────────────────────────────────

export interface TableRowState<T> {
  data:                 T
  errors:               Record<string, ErrorLike[]>
  isActive:             boolean
  isSelected:           boolean
  isVisible:            boolean
  isInNearVisibleRange: boolean
}

// ─── Cell change event ───────────────────────────────────────────────────────

export interface CellChangeEvent<T> {
  rowId: string | number
  key:   keyof T
  prev:  T[keyof T]
  next:  T[keyof T]
}

// ─── Sort state ──────────────────────────────────────────────────────────────

export interface SortState<T = Record<string, unknown>> {
  key:       keyof T
  direction: 'asc' | 'desc'
}

// ─── FastTable props ─────────────────────────────────────────────────────────

export interface FastTableProps<T> {
  // data — choose one
  transporter?:      import('./transport/transporter.types.js').DataTransporter<T>
  rows?:             T[]

  // required
  columns:           ColumnDef<T>[]
  getRowId:          (row: T) => string | number
  schema:            SchemaLike

  // layout
  rowHeight?:        number
  containerHeight?:  number

  // behaviour
  onCellChange?:     (event: CellChangeEvent<T>) => Promise<ErrorLike[] | null>
  className?:        string

  // styling
  rowRules?:         RowStyleRule<T>[]
  rulePreset?:       'default' | 'striped' | 'compact' | 'none'
}
