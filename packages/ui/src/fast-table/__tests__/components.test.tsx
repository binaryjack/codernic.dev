import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectionCell } from '../cell/selection-cell.js'
import { TableCell } from '../cell/table-cell.js'
import { HeaderCell } from '../header/header-cell.js'
import { SelectionHeaderCell } from '../header/selection-header-cell.js'
import { TableRow } from '../row/table-row.js'
import type { ColumnDef, TableRowState } from '../types.js'

type Item = { id: number; name: string; salary: number }

const cols: ColumnDef<Item>[] = [
  { key: 'name',   label: 'Name',   sortable: true },
  { key: 'salary', label: 'Salary', sortable: true,
    format: (v) => `$${Number(v).toFixed(0)}` },
]

function makeRowState(overrides?: Partial<TableRowState<Item>>): TableRowState<Item> {
  return {
    data:                 { id: 1, name: 'Alice', salary: 50_000 },
    errors:               {},
    isActive:             false,
    isSelected:           false,
    isVisible:            true,
    isInNearVisibleRange: true,
    ...overrides,
  }
}

// ─── SelectionCell ────────────────────────────────────────────────────────────

describe('SelectionCell', () => {
  it('renders an unchecked checkbox when not selected', () => {
    render(<SelectionCell rowId={1} isSelected={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('renders a checked checkbox when selected', () => {
    render(<SelectionCell rowId={1} isSelected={true} onToggle={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onToggle with rowId on change', async () => {
    const onToggle = vi.fn()
    render(<SelectionCell rowId={42} isSelected={false} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(42)
  })
})

// ─── TableCell ───────────────────────────────────────────────────────────────

describe('TableCell', () => {
  it('renders formatted display value via format function', () => {
    render(<TableCell column={cols[1]!} rowState={makeRowState()} />)
    expect(screen.getByText('$50000')).toBeInTheDocument()
  })

  it('renders plain string value when no format function', () => {
    render(<TableCell column={cols[0]!} rowState={makeRowState()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('applies cellRules classes when condition passes', () => {
    const col: ColumnDef<Item> = {
      key:       'salary',
      label:     'Salary',
      cellRules: [
        { id: 'high', condition: v => Number(v) > 40_000, classes: 'text-green-600', priority: 1 },
      ],
    }
    const { container } = render(<TableCell column={col} rowState={makeRowState()} />)
    expect(container.firstChild).toHaveClass('text-green-600')
  })

  it('calls onActivate when editable cell is clicked in display mode', async () => {
    const onActivate = vi.fn()
    const col: ColumnDef<Item> = { key: 'name', label: 'Name', editable: true }
    render(
      <TableCell column={col} rowState={makeRowState()} onActivate={onActivate} />,
    )
    await userEvent.click(screen.getByRole('cell'))
    expect(onActivate).toHaveBeenCalledOnce()
  })
})

// ─── HeaderCell ──────────────────────────────────────────────────────────────

describe('HeaderCell', () => {
  it('renders column label', () => {
    render(<HeaderCell column={cols[0]!} sortState={null} onSort={vi.fn()} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('calls onSort with column key when sortable header is clicked', async () => {
    const onSort = vi.fn()
    render(<HeaderCell column={cols[0]!} sortState={null} onSort={onSort} />)
    await userEvent.click(screen.getByRole('columnheader'))
    expect(onSort).toHaveBeenCalledWith('name')
  })

  it('aria-sort is ascending when sorted asc', () => {
    render(
      <HeaderCell
        column={cols[0]!}
        sortState={{ key: 'name', direction: 'asc' }}
        onSort={vi.fn()}
      />,
    )
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending')
  })

  it('aria-sort is none when different column is sorted', () => {
    render(
      <HeaderCell
        column={cols[0]!}
        sortState={{ key: 'salary', direction: 'asc' }}
        onSort={vi.fn()}
      />,
    )
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'none')
  })
})

// ─── SelectionHeaderCell ─────────────────────────────────────────────────────

describe('SelectionHeaderCell', () => {
  it('checkbox is checked when allSelected=true', () => {
    render(
      <SelectionHeaderCell
        allSelected={true}
        someSelected={true}
        onSelectAll={vi.fn()}
        onSelectNone={vi.fn()}
      />,
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onSelectNone when all are selected and checkbox is clicked', async () => {
    const onSelectNone = vi.fn()
    render(
      <SelectionHeaderCell
        allSelected={true}
        someSelected={true}
        onSelectAll={vi.fn()}
        onSelectNone={onSelectNone}
      />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onSelectNone).toHaveBeenCalledOnce()
  })

  it('calls onSelectAll when none are selected and checkbox is clicked', async () => {
    const onSelectAll = vi.fn()
    render(
      <SelectionHeaderCell
        allSelected={false}
        someSelected={false}
        onSelectAll={onSelectAll}
        onSelectNone={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onSelectAll).toHaveBeenCalledOnce()
  })
})

// ─── TableRow ────────────────────────────────────────────────────────────────

describe('TableRow', () => {
  it('renders one cell per column plus a selection cell', () => {
    render(
      <TableRow
        rowState={makeRowState()}
        columns={cols}
        rowId={1}
        isSelected={false}
        onSelect={vi.fn()}
        onActivate={vi.fn()}
      />,
    )
    // role=cell: 1 selection + 2 data columns
    expect(screen.getAllByRole('cell')).toHaveLength(3)
  })

  it('has aria-selected=true when selected', () => {
    render(
      <TableRow
        rowState={makeRowState()}
        columns={cols}
        rowId={1}
        isSelected={true}
        onSelect={vi.fn()}
        onActivate={vi.fn()}
      />,
    )
    expect(screen.getByRole('row')).toHaveAttribute('aria-selected', 'true')
  })

  it('calls onActivate when row is clicked', async () => {
    const onActivate = vi.fn()
    render(
      <TableRow
        rowState={makeRowState()}
        columns={cols}
        rowId={7}
        isSelected={false}
        onSelect={vi.fn()}
        onActivate={onActivate}
      />,
    )
    await userEvent.click(screen.getByRole('row'))
    expect(onActivate).toHaveBeenCalledWith(7)
  })
})
