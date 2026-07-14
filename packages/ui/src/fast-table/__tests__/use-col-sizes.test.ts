import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useColSizes } from '../hooks/use-col-sizes.js'

const cols = [
  { key: 'id',    width: 80 },
  { key: 'name' },
  { key: 'email' },
]

beforeEach(() => {
  localStorage.clear()
})

describe('useColSizes', () => {
  it('returns colWidths array with same length as columns', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-a'))
    expect(result.current.colWidths).toHaveLength(3)
  })

  it('fixed column width is respected', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-b'))
    expect(result.current.colWidths[0]).toBe(80)
  })

  it('flex columns share remaining space equally', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-c'))
    expect(result.current.colWidths[1]).toBe(result.current.colWidths[2])
  })

  it('flex columns use at least minColWidth', () => {
    const { result } = renderHook(() => useColSizes(cols, 100, 'test-min', 80))
    expect(result.current.colWidths[1]).toBeGreaterThanOrEqual(80)
  })

  it('setColWidth updates the specific column width', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-d'))
    act(() => result.current.setColWidth(1, 200))
    expect(result.current.colWidths[1]).toBe(200)
    expect(result.current.colWidths[0]).toBe(80)
  })

  it('setColWidth enforces minColWidth floor', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-min2', 80))
    act(() => result.current.setColWidth(1, 20))
    expect(result.current.colWidths[1]).toBe(80)
  })

  it('persists widths to localStorage on change', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'persist-test'))
    act(() => result.current.setColWidth(0, 120))
    const stored = JSON.parse(localStorage.getItem('ft-col-widths-persist-test') ?? '[]') as number[]
    expect(stored[0]).toBe(120)
  })

  it('restores widths from localStorage on mount', () => {
    localStorage.setItem('ft-col-widths-restore-test', JSON.stringify([99, 200, 150]))
    const { result } = renderHook(() => useColSizes(cols, 800, 'restore-test'))
    expect(result.current.colWidths[0]).toBe(99)
    expect(result.current.colWidths[1]).toBe(200)
  })

  it('ignores stale localStorage entry with wrong length', () => {
    localStorage.setItem('ft-col-widths-stale', JSON.stringify([100, 200]))   // 2 items not 3
    const { result } = renderHook(() => useColSizes(cols, 800, 'stale'))
    expect(result.current.colWidths).toHaveLength(3)
    expect(result.current.colWidths[0]).toBe(80)   // fixed width still respected
  })

  it('gridTemplateColumns has one token per column', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-e'))
    const parts = result.current.gridTemplateColumns.trim().split(/\s+/)
    expect(parts).toHaveLength(3)
  })

  it('gridTemplateColumns uses px values', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-f'))
    const parts = result.current.gridTemplateColumns.trim().split(/\s+/)
    parts.forEach(p => expect(p).toMatch(/^\d+px$/))
  })

  it('reorderColumns swaps widths correctly', () => {
    const { result } = renderHook(() => useColSizes(cols, 800, 'test-reorder'))
    const w0Before = result.current.colWidths[0]
    const w1Before = result.current.colWidths[1]
    act(() => result.current.reorderColumns(0, 1))
    expect(result.current.colWidths[0]).toBe(w1Before)
    expect(result.current.colWidths[1]).toBe(w0Before)
  })
})
