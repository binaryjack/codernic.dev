'use client'

import type { SelectionCellProps } from './cell.types.js'

export function SelectionCell({ rowId, isSelected, onToggle }: SelectionCellProps) {
  return (
    <div role="cell" className="ft-selection-cell">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(rowId)}
        aria-label={isSelected ? 'Deselect row' : 'Select row'}
      />
    </div>
  )
}
