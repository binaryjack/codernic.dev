import { describe, expect, it } from 'vitest'
import { useVirtualRows } from '../hooks/use-virtual-rows.js'

const TOTAL = 5000
const RH    = 40
const CH    = 400
const OVER  = 3

describe('useVirtualRows', () => {
  it('startIndex is 0 when scrollTop is 0', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER)
    expect(w.startIndex).toBe(0)
  })

  it('totalHeight equals totalRows × rowHeight', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER)
    expect(w.totalHeight).toBe(TOTAL * RH)
  })

  it('topOffset equals startIndex × rowHeight', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 800, OVER)
    expect(w.topOffset).toBe(w.startIndex * RH)
  })

  it('bottomOffset equals totalHeight - endIndex × rowHeight', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER)
    expect(w.bottomOffset).toBe(w.totalHeight - w.endIndex * RH)
  })

  it('endIndex never exceeds totalRows', () => {
    const w = useVirtualRows(TOTAL, RH, CH, TOTAL * RH, OVER)
    expect(w.endIndex).toBeLessThanOrEqual(TOTAL)
  })

  it('overscan extends window below visible area', () => {
    const scrollTop    = 0
    const visibleRows  = Math.ceil(CH / RH)
    const w            = useVirtualRows(TOTAL, RH, CH, scrollTop, OVER)
    expect(w.endIndex).toBeGreaterThan(visibleRows)
  })

  it('shouldFetchMore is false when endIndex is far from total', () => {
    const w = useVirtualRows(TOTAL, RH, CH, 0, OVER, 500)
    expect(w.shouldFetchMore).toBe(false)
  })

  it('shouldFetchMore is true when endIndex >= total - threshold', () => {
    const threshold = 5
    const w = useVirtualRows(TOTAL, RH, CH, (TOTAL - threshold + 1) * RH, OVER, threshold)
    expect(w.shouldFetchMore).toBe(true)
  })

  it('handles 0 total rows — no crash, all zeros', () => {
    const w = useVirtualRows(0, RH, CH, 0, OVER)
    expect(w.startIndex).toBe(0)
    expect(w.endIndex).toBe(0)
    expect(w.totalHeight).toBe(0)
    expect(w.shouldFetchMore).toBe(false)
  })

  it('defaults overscan to 3 without crashing', () => {
    expect(() => useVirtualRows(TOTAL, RH, CH, 0)).not.toThrow()
  })

  it('startIndex respects overscan on non-zero scroll', () => {
    const scrollTop        = 10 * RH   // visible start = row 10
    const expectedStart    = Math.max(0, 10 - OVER)
    const w = useVirtualRows(TOTAL, RH, CH, scrollTop, OVER)
    expect(w.startIndex).toBe(expectedStart)
  })

  it('bottomOffset is 0 when scrolled to very end', () => {
    const w = useVirtualRows(TOTAL, RH, CH, TOTAL * RH, OVER)
    expect(w.bottomOffset).toBe(0)
  })
})
