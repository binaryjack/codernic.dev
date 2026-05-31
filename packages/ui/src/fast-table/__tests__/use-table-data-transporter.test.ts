import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type {
    FetchParams,
    PageResult,
    PatchRowParams,
    PatchRowResult,
    TableDataAdapter,
} from '../transport/transporter.types.js'
import { useTableDataTransporter } from '../transport/use-table-data-transporter.js'

type Row = { id: number; name: string; salary: number }

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id:     i + 1,
    name:   `Employee ${i + 1}`,
    salary: 30_000 + i * 1_000,
  }))
}

/** Instant adapter — no latency, returns immediately with Promise.resolve */
function makeAdapter(
  allRows:   Row[],
  errorRate = 0,
): TableDataAdapter<Row> {
  const stored = [...allRows]

  return {
    fetch: (params: FetchParams<Row>): Promise<PageResult<Row>> => {
      const offset = params.cursor ? parseInt(params.cursor, 10) : 0
      const page   = stored.slice(offset, offset + params.limit)
      const next   = offset + page.length < stored.length ? String(offset + page.length) : null

      return Promise.resolve({ rows: page, nextCursor: next, totalCount: stored.length })
    },

    patchRow: (params: PatchRowParams<Row>): Promise<PatchRowResult> => {
      if (Math.random() < errorRate) {
        return Promise.resolve({ errors: [{ message: 'server error', field: String(params.key) }] })
      }
      const idx = stored.findIndex(r => r.id === params.rowId)
      if (idx !== -1) stored[idx] = { ...stored[idx]!, [params.key]: params.next }
      return Promise.resolve({ errors: null })
    },
  }
}

describe('useTableDataTransporter', () => {
  it('starts in loading state with empty rows', () => {
    const adapter = makeAdapter(makeRows(10))
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 5 }),
    )
    expect(result.current.isLoading).toBe(true)
    expect(result.current.rows).toHaveLength(0)
  })

  it('loads initial page after first fetch resolves', async () => {
    const adapter = makeAdapter(makeRows(10))
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 5 }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.rows).toHaveLength(5)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.totalCount).toBe(10)
  })

  it('fetchMore appends next page', async () => {
    const adapter = makeAdapter(makeRows(10))
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 5 }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.fetchMore())
    await waitFor(() => expect(result.current.isFetchingMore).toBe(false))

    expect(result.current.rows).toHaveLength(10)
    expect(result.current.hasMore).toBe(false)
  })

  it('hasMore=false when all rows fit in one page', async () => {
    const adapter = makeAdapter(makeRows(3))
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 10 }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.rows).toHaveLength(3)
    expect(result.current.hasMore).toBe(false)
  })

  it('patchRow applies optimistic update immediately', async () => {
    const adapter = makeAdapter(makeRows(5))
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 10 }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      void result.current.patchRow({ rowId: 1, key: 'name', prev: 'Employee 1', next: 'Renamed' })
    })
    expect(result.current.rows[0]!.name).toBe('Renamed')
  })

  it('patchRow rolls back on server validation errors', async () => {
    const adapter = makeAdapter(makeRows(5), 1) // 100% error rate
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 10 }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const originalName = result.current.rows[0]!.name
    let errors: import('../types.js').ErrorLike[] | null = null

    await act(async () => {
      errors = await result.current.patchRow({
        rowId: 1, key: 'name', prev: originalName, next: 'Bad',
      })
    })

    expect(errors).not.toBeNull()
    // Rolled back
    await waitFor(() => expect(result.current.rows[0]!.name).toBe(originalName))
  })

  it('reload resets rows and re-fetches', async () => {
    const adapter = makeAdapter(makeRows(5))
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 5 }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.rows).toHaveLength(5)

    act(() => result.current.reload())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.rows).toHaveLength(5)
  })

  it('error state is set when fetch throws', async () => {
    const adapter: TableDataAdapter<Row> = {
      fetch: () => Promise.reject(new Error('network failure')),
    }
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 5 }),
    )
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('network failure')
    expect(result.current.isLoading).toBe(false)
  })

  it('does not double-fetch when fetchMore called while already loading', async () => {
    let fetchCount = 0
    const adapter: TableDataAdapter<Row> = {
      fetch: () => {
        fetchCount++
        return Promise.resolve({ rows: makeRows(5), nextCursor: null, totalCount: 5 })
      },
    }
    const { result } = renderHook(() =>
      useTableDataTransporter(adapter, { limit: 5 }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchCount).toBe(1)

    // Call fetchMore when hasMore=false — should be ignored
    act(() => result.current.fetchMore())
    expect(fetchCount).toBe(1)
  })
})

