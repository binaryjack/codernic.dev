import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRowSelection } from '../hooks/use-row-selection.js'
import { useSort } from '../hooks/use-sort.js'

// ─── useRowSelection ─────────────────────────────────────────────────────────

describe('useRowSelection', () => {
  it('starts with empty selection by default', () => {
    const { result } = renderHook(() => useRowSelection())
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('accepts initialIds', () => {
    const { result } = renderHook(() => useRowSelection([1, 2]))
    expect(result.current.selectedIds.size).toBe(2)
    expect(result.current.isSelected(1)).toBe(true)
  })

  it('toggleRow adds an unselected row', () => {
    const { result } = renderHook(() => useRowSelection())
    act(() => result.current.toggleRow(5))
    expect(result.current.isSelected(5)).toBe(true)
  })

  it('toggleRow removes an already-selected row', () => {
    const { result } = renderHook(() => useRowSelection([5]))
    act(() => result.current.toggleRow(5))
    expect(result.current.isSelected(5)).toBe(false)
  })

  it('selectAll replaces selection with provided ids', () => {
    const { result } = renderHook(() => useRowSelection([1]))
    act(() => result.current.selectAll([2, 3, 4]))
    expect(result.current.selectedIds.size).toBe(3)
    expect(result.current.isSelected(1)).toBe(false)
    expect(result.current.isSelected(2)).toBe(true)
  })

  it('selectNone clears all selections', () => {
    const { result } = renderHook(() => useRowSelection([1, 2, 3]))
    act(() => result.current.selectNone())
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('invertSelection selects everything not currently selected', () => {
    const { result } = renderHook(() => useRowSelection([1, 2]))
    act(() => result.current.invertSelection([1, 2, 3, 4]))
    expect(result.current.isSelected(1)).toBe(false)
    expect(result.current.isSelected(2)).toBe(false)
    expect(result.current.isSelected(3)).toBe(true)
    expect(result.current.isSelected(4)).toBe(true)
  })

  it('returns a new Set reference on each change (immutability)', () => {
    const { result } = renderHook(() => useRowSelection())
    const first = result.current.selectedIds
    act(() => result.current.toggleRow(7))
    expect(result.current.selectedIds).not.toBe(first)
  })
})

// ─── useSort ─────────────────────────────────────────────────────────────────

type Item = { id: number; name: string; score: number }

const unsorted: Item[] = [
  { id: 3, name: 'charlie', score: 30 },
  { id: 1, name: 'alice',   score: 10 },
  { id: 2, name: 'bob',     score: 20 },
]

describe('useSort', () => {
  it('returns rows unchanged when no sort is set', () => {
    const { result } = renderHook(() => useSort(unsorted))
    expect(result.current.sortedRows).toStrictEqual(unsorted)
    expect(result.current.sortState).toBeNull()
  })

  it('sorts ascending by score when defaultSort provided', () => {
    const { result } = renderHook(() =>
      useSort(unsorted, { key: 'score', direction: 'asc' }),
    )
    const scores = result.current.sortedRows.map(r => r.score)
    expect(scores).toStrictEqual([10, 20, 30])
  })

  it('sorts descending by name', () => {
    const { result } = renderHook(() => useSort(unsorted))
    act(() => result.current.setSortState({ key: 'name', direction: 'desc' }))
    const names = result.current.sortedRows.map(r => r.name)
    expect(names).toStrictEqual(['charlie', 'bob', 'alice'])
  })

  it('does NOT mutate the original input array', () => {
    const { result } = renderHook(() =>
      useSort(unsorted, { key: 'id', direction: 'asc' }),
    )
    expect(result.current.sortedRows).not.toBe(unsorted)
    expect(unsorted[0]!.id).toBe(3) // original order unchanged
  })

  it('setSortState(null) returns rows in original order', () => {
    const { result } = renderHook(() =>
      useSort(unsorted, { key: 'score', direction: 'asc' }),
    )
    act(() => result.current.setSortState(null))
    expect(result.current.sortedRows).toStrictEqual(unsorted)
  })

  it('equal values preserve relative order (stable sort)', () => {
    const rows: Item[] = [
      { id: 1, name: 'x', score: 5 },
      { id: 2, name: 'y', score: 5 },
    ]
    const { result } = renderHook(() =>
      useSort(rows, { key: 'score', direction: 'asc' }),
    )
    expect(result.current.sortedRows[0]!.id).toBe(1)
    expect(result.current.sortedRows[1]!.id).toBe(2)
  })
})
