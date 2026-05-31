import { describe, expect, it } from 'vitest'
import type { ColumnDef, TableRowState } from '../types.js'

describe('ColumnDef shape', () => {
  it('accepts a minimal column definition', () => {
    const col = { key: 'name' as const, label: 'Name' } satisfies ColumnDef<{ name: string }>
    expect(col.key).toBe('name')
  })

  it('accepts a format function', () => {
    const col: ColumnDef<{ salary: number }> = {
      key:    'salary',
      label:  'Salary',
      format: (v) => `$${Number(v).toFixed(2)}`,
    }
    expect(col.format?.(50000, { salary: 50000 })).toBe('$50000.00')
  })

  it('format receives both value and row', () => {
    const col: ColumnDef<{ salary: number; currency: string }> = {
      key:    'salary',
      label:  'Salary',
      format: (v, row) => `${row.currency}${Number(v).toFixed(0)}`,
    }
    expect(col.format?.(50000, { salary: 50000, currency: '€' })).toBe('€50000')
  })

  it('accepts cellRules array', () => {
    const col: ColumnDef<{ salary: number }> = {
      key:       'salary',
      label:     'Salary',
      cellRules: [
        { id: 'high', condition: v => Number(v) > 100_000, classes: 'text-green-600', priority: 1 },
      ],
    }
    expect(col.cellRules).toHaveLength(1)
    expect(col.cellRules?.[0].id).toBe('high')
  })

  it('cellRules condition receives value and rowState', () => {
    const col: ColumnDef<{ salary: number }> = {
      key:       'salary',
      label:     'Salary',
      cellRules: [
        {
          id:        'active-high',
          condition: (v, rs) => rs.isActive && Number(v) > 100_000,
          classes:   'font-bold',
          priority:  2,
        },
      ],
    }
    const base: TableRowState<{ salary: number }> = {
      data: { salary: 150_000 }, errors: {}, isActive: true, isSelected: false,
      isVisible: true, isInNearVisibleRange: false,
    }
    expect(col.cellRules?.[0].condition(150_000, base)).toBe(true)
    expect(col.cellRules?.[0].condition(150_000, { ...base, isActive: false })).toBe(false)
  })

  it('accepts editor union types', () => {
    const text:     ColumnDef<{ n: string }> = { key: 'n', label: 'N', editor: { type: 'text' } }
    const number_:  ColumnDef<{ n: string }> = { key: 'n', label: 'N', editor: { type: 'number', min: 0 } }
    const select:   ColumnDef<{ n: string }> = { key: 'n', label: 'N', editor: { type: 'select', options: [] } }
    const checkbox: ColumnDef<{ n: string }> = { key: 'n', label: 'N', editor: { type: 'checkbox' } }
    expect(text.editor?.type).toBe('text')
    expect(number_.editor?.type).toBe('number')
    expect(select.editor?.type).toBe('select')
    expect(checkbox.editor?.type).toBe('checkbox')
  })
})

describe('TableRowState shape', () => {
  it('has all required flags', () => {
    const row: TableRowState<{ id: number }> = {
      data:                 { id: 1 },
      errors:               {},
      isActive:             false,
      isSelected:           false,
      isVisible:            true,
      isInNearVisibleRange: false,
    }
    expect(row.isActive).toBe(false)
    expect(row.isVisible).toBe(true)
    expect(row.data.id).toBe(1)
  })

  it('errors allows per-field error arrays', () => {
    const row: TableRowState<{ name: string }> = {
      data: { name: '' }, errors: { name: [{ message: 'required' }] },
      isActive: false, isSelected: false, isVisible: true, isInNearVisibleRange: false,
    }
    expect(row.errors['name']).toHaveLength(1)
    expect(row.errors['name'][0].message).toBe('required')
  })
})
