'use client'

import { SelectionCell } from '../cell/selection-cell.js'
import { TableCell } from '../cell/table-cell.js'
import type { RowProps } from './row.types.js'
import { useTestId } from '../../hooks/useTestId';

export function TableRow<T>({ dataTestId,
  rowState,
  columns,
  rowId,
  isSelected,
  onSelect,
  onActivate,
  style,
}: RowProps<T> & { dataTestId?: string }) {
  
  const { rootId, getTestId } = useTestId('table-row', dataTestId);
return (
    <div
      role="row"
      aria-selected={isSelected}
      className={`ft-row${rowState.isActive ? ' ft-row--active' : ''}${isSelected ? ' ft-row--selected' : ''}`}
      style={style}
      onClick={() => onActivate(rowId)}
    >
      <SelectionCell data-testid={getTestId('selection-cell')}
        rowId={rowId}
        isSelected={isSelected}
        onToggle={id => {
          onSelect(id)
        }}
      />
      {columns.map(col => (
        <TableCell data-testid={`${typeof rootId !== 'undefined' ? rootId : 'columns-item'}-table-cell`}
          key={String(col.key)}
          column={col}
          rowState={rowState}
          onActivate={() => onActivate(rowId)}
        />
      ))}
    </div>
  )
}
