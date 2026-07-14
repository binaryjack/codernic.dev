'use client'

interface SelectionHeaderCellProps {
  allSelected:    boolean
  someSelected:   boolean
  onSelectAll:    () => void
  onSelectNone:   () => void
}

export function SelectionHeaderCell({
  allSelected,
  someSelected,
  onSelectAll,
  onSelectNone,
}: SelectionHeaderCellProps) {
  const checked       = allSelected
  const indeterminate = !allSelected && someSelected

  return (
    <div role="columnheader" className="ft-header-cell ft-selection-header-cell">
      <input
        type="checkbox"
        checked={checked}
        ref={el => {
          if (el) el.indeterminate = indeterminate
        }}
        onChange={() => (allSelected ? onSelectNone() : onSelectAll())}
        aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
      />
    </div>
  )
}
