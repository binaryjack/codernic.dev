import { describe, expect, it } from 'vitest';
import { useTableRows } from '../hooks/use-table-rows.js';
import type { VirtualWindow } from '../hooks/use-virtual-rows.js';

type Row = { id: number; name: string }

const rows: Row[] = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Row ${i}` }))
const getId       = (r: Row) => r.id
const win: VirtualWindow = {
  startIndex:      5,
  endIndex:        10,
  totalHeight:     800,
  topOffset:       200,
  bottomOffset:    400,
  shouldFetchMore: false,
}

describe('useTableRows', () => {
  it('returns same length as input', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states).toHaveLength(rows.length)
  })

  it('marks rows inside window as isVisible=true', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    for (let i = 5; i < 10; i++) {
      expect(states[i].isVisible).toBe(true)
    }
  })

  it('marks rows outside window as isVisible=false', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states[0].isVisible).toBe(false)
    expect(states[19].isVisible).toBe(false)
  })

  it('marks active row correctly', () => {
    const states = useTableRows(rows, getId, 3, new Set(), win)
    expect(states[3].isActive).toBe(true)
    expect(states[4].isActive).toBe(false)
  })

  it('marks selected rows correctly', () => {
    const states = useTableRows(rows, getId, null, new Set([2, 7]), win)
    expect(states[2].isSelected).toBe(true)
    expect(states[7].isSelected).toBe(true)
    expect(states[0].isSelected).toBe(false)
    expect(states[1].isSelected).toBe(false)
  })

  it('no row is active when activeRowId is null', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states.every(s => !s.isActive)).toBe(true)
  })

  it('no row is selected when selectedIds is empty', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states.every(s => !s.isSelected)).toBe(true)
  })

  it('preserves original data reference (no copy)', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states[0].data).toBe(rows[0])
    expect(states[5].data).toBe(rows[5])
  })

  it('initialises errors as empty object', () => {
    const states = useTableRows(rows, getId, null, new Set(), win)
    expect(states[0].errors).toEqual({})
  })

  it('handles empty rows array', () => {
    const states = useTableRows([], getId, null, new Set(), win)
    expect(states).toHaveLength(0)
  })
})
