import type { ColumnDef, TableRowState } from '../types.js'

export interface CellProps<T> {
  column:   ColumnDef<T>
  rowState: TableRowState<T>
}

export interface SelectionCellProps {
  rowId:      string | number
  isSelected: boolean
  onToggle:   (id: string | number) => void
}
