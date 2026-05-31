'use client'

import type { ColumnDef, SortState } from '../types.js'
import { HeaderCell } from './header-cell.js'
import { SelectionHeaderCell } from './selection-header-cell.js'

interface TableHeaderProps<T> {
  columns:          ColumnDef<T>[]
  sortState:        SortState<T> | null
  onSort:           (key: keyof T) => void
  allSelected:      boolean
  someSelected:     boolean
  onSelectAll:      () => void
  onSelectNone:     () => void
  gridTemplateColumns: string
}

export function TableHeader<T>({
  columns,
  sortState,
  onSort,
  allSelected,
  someSelected,
  onSelectAll,
  onSelectNone,
  gridTemplateColumns,
}: TableHeaderProps<T>) {
  return (
    <div
      role="row"
      className="ft-header-row"
      style={{ gridTemplateColumns }}
    >
      <SelectionHeaderCell
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectAll={onSelectAll}
        onSelectNone={onSelectNone}
      />
      {columns.map(col => (
        <HeaderCell
          key={String(col.key)}
          column={col}
          sortState={sortState}
          onSort={onSort}
        />
      ))}
    </div>
  )
}
