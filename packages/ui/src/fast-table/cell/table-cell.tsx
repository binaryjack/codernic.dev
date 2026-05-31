'use client'

import { CellEditor } from './cell-editor.js'
import type { CellProps } from './cell.types.js'

interface TableCellProps<T> extends CellProps<T> {
  onActivate?: () => void
}

function formatDisplayValue<T>(
  column: CellProps<T>['column'],
  rowState: CellProps<T>['rowState'],
): string {
  const value = rowState.data[column.key]
  if (column.format) {
    return column.format(value, rowState.data)
  }
  return value == null ? '' : String(value)
}

export function TableCell<T>({ column, rowState, onActivate }: TableCellProps<T>) {
  const isEditMode = rowState.isActive && column.editable

  // Compute cell style classes from cellRules
  const cellClasses = column.cellRules
    ? column.cellRules
        .filter(rule => rule.condition(rowState.data[column.key], rowState))
        .sort((a, b) => a.priority - b.priority)
        .map(rule => rule.classes)
        .join(' ')
    : ''

  return (
    <div
      role="cell"
      className={`ft-cell${cellClasses ? ` ${cellClasses}` : ''}`}
      onClick={!isEditMode && column.editable ? onActivate : undefined}
      aria-readonly={!column.editable}
    >
      {isEditMode && column.editor ? (
        <CellEditor name={String(column.key)} editor={column.editor} />
      ) : (
        <span className="ft-cell-display">{formatDisplayValue(column, rowState)}</span>
      )}
    </div>
  )
}
