'use client'

import type { ColumnDef, SortState } from '../types.js'

interface HeaderCellProps<T> {
  column:    ColumnDef<T>
  sortState: SortState<T> | null
  onSort:    (key: keyof T) => void
}

export function HeaderCell<T>({ column, sortState, onSort }: HeaderCellProps<T>) {
  const isActive    = sortState?.key === column.key
  const direction   = isActive ? sortState!.direction : null
  const nextDir     = direction === 'asc' ? 'desc' : 'asc'
  const ariaSort    = isActive
    ? (direction === 'asc' ? 'ascending' : 'descending')
    : 'none'

  return (
    <div
      role="columnheader"
      className={`ft-header-cell${column.sortable ? ' ft-header-cell--sortable' : ''}`}
      aria-sort={ariaSort}
      onClick={column.sortable ? () => onSort(column.key) : undefined}
      data-sort-direction={direction ?? undefined}
      title={column.sortable ? `Sort by ${column.label} (${nextDir})` : undefined}
    >
      <span>{column.label}</span>
      {column.sortable && isActive && (
        <span aria-hidden className={`ft-sort-icon ft-sort-icon--${direction}`} />
      )}
    </div>
  )
}
