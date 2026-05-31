'use client'

import { SelectionCell } from '../cell/selection-cell.js'
import { TableCell } from '../cell/table-cell.js'
import type { RowProps } from './row.types.js'

export function TableRow<T>({
  rowState,
  columns,
  rowId,
  isSelected,
  onSelect,
  onActivate,
  style,
}: RowProps<T>) {
  return (
    <div
      role="row"
      aria-selected={isSelected}
      className={`ft-row${rowState.isActive ? ' ft-row--active' : ''}${isSelected ? ' ft-row--selected' : ''}`}
      style={style}
      onClick={() => onActivate(rowId)}
    >
      <SelectionCell
        rowId={rowId}
        isSelected={isSelected}
        onToggle={id => {
          onSelect(id)
        }}
      />
      {columns.map(col => (
        <TableCell
          key={String(col.key)}
          column={col}
          rowState={rowState}
          onActivate={() => onActivate(rowId)}
        />
      ))}
    </div>
  )
}
