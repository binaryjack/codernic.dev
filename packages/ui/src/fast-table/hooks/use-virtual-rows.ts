export interface VirtualWindow {
  startIndex:      number
  endIndex:        number
  totalHeight:     number
  topOffset:       number
  bottomOffset:    number
  shouldFetchMore: boolean
}

export function useVirtualRows(
  totalRows:          number,
  rowHeight:          number,
  containerHeight:    number,
  scrollTop:          number,
  overscan            = 3,
  prefetchThreshold?: number,
): VirtualWindow {
  const threshold = prefetchThreshold ?? Math.max(1, Math.floor(totalRows * 0.1))

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex   = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan)

  const totalHeight  = totalRows * rowHeight
  const topOffset    = startIndex * rowHeight
  const bottomOffset = Math.max(0, totalHeight - endIndex * rowHeight)

  const shouldFetchMore = totalRows > 0 && endIndex >= totalRows - threshold

  return { startIndex, endIndex, totalHeight, topOffset, bottomOffset, shouldFetchMore }
}
