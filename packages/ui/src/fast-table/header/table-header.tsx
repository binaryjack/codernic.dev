'use client'

import type { ColumnDef, SortState } from '../types.js'
import { HeaderCell } from './header-cell.js'
import { SelectionHeaderCell } from './selection-header-cell.js'
import { useTestId } from '../../hooks/useTestId';

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

export function TableHeader<T>({ dataTestId,
  columns,
  sortState,
  onSort,
  allSelected,
  someSelected,
  onSelectAll,
  onSelectNone,
  gridTemplateColumns,
}: TableHeaderProps<T> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('table-header', dataTestId);
return (
    <div
      role="row"
      className="ft-header-row"
      style={{ gridTemplateColumns }}
    >
      <SelectionHeaderCell data-testid={getTestId('selection-header-cell')}
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectAll={onSelectAll}
        onSelectNone={onSelectNone}
      />
      {columns.map(col => (
        <HeaderCell data-testid={`${typeof rootId !== 'undefined' ? rootId : 'columns-item'}-header-cell`}
          key={String(col.key)}
          column={col}
          sortState={sortState}
          onSort={onSort}
        />
      ))}
    </div>
  )
}
