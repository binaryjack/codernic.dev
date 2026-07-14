import type { SortState } from '../types.js'
import type {
    FetchParams,
    FilterState,
    PageResult,
    PatchRowParams,
    PatchRowResult,
    TableDataAdapter,
} from './transporter.types.js'

// ─── Internal helpers (not exported) ─────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function applyFilter<T>(rows: T[], filters: FilterState<T>): T[] {
  if (filters.length === 0) return rows

  return rows.filter(row =>
    filters.every(f => {
      const cell = row[f.key]
      switch (f.operator) {
        case 'eq':         return cell === f.value
        case 'neq':        return cell !== f.value
        case 'isNull':     return cell == null
        case 'isNotNull':  return cell != null
        case 'gt':         return (cell as number) > (f.value as number)
        case 'gte':        return (cell as number) >= (f.value as number)
        case 'lt':         return (cell as number) < (f.value as number)
        case 'lte':        return (cell as number) <= (f.value as number)
        case 'contains':   return String(cell).toLowerCase().includes(String(f.value).toLowerCase())
        case 'startsWith': return String(cell).toLowerCase().startsWith(String(f.value).toLowerCase())
        case 'endsWith':   return String(cell).toLowerCase().endsWith(String(f.value).toLowerCase())
        case 'in':         return (f.value as unknown[]).includes(cell)
        default:           return true
      }
    }),
  )
}

function applySort<T>(rows: T[], sort: SortState<T> | null): T[] {
  if (!sort) return rows

  return [...rows].sort((a, b) => {
    const av = a[sort.key]
    const bv = b[sort.key]
    if (av === bv) return 0
    const asc = av < bv ? -1 : 1
    return sort.direction === 'asc' ? asc : -asc
  })
}

// ─── Public factory ───────────────────────────────────────────────────────────

export interface MockAdapterOptions {
  latencyMs?:         number
  /** 0–1 probability that patchRow returns a server error */
  errorRate?:         number
}

export function createMockAdapter<T extends Record<string, unknown>>(
  allRows:  T[],
  options?: MockAdapterOptions,
): TableDataAdapter<T> {
  const latency   = options?.latencyMs ?? 200
  const errorRate = options?.errorRate ?? 0.05

  return {
    async fetch(params: FetchParams<T>): Promise<PageResult<T>> {
      await sleep(latency)

      const filtered = applyFilter(allRows, params.filters)
      const sorted   = applySort(filtered, params.sort)

      const cursorIndex = params.cursor
        ? parseInt(params.cursor, 10)
        : 0

      const page = sorted.slice(cursorIndex, cursorIndex + params.limit)

      const nextOffset = cursorIndex + page.length
      const nextCursor = nextOffset < sorted.length
        ? String(nextOffset)
        : null

      return {
        rows:        page,
        nextCursor,
        totalCount:  sorted.length,
      }
    },

    async patchRow(params: PatchRowParams<T>): Promise<PatchRowResult> {
      await sleep(latency)

      // Simulate random server error
      if (Math.random() < errorRate) {
        return { errors: [{ message: 'Simulated server error' }] }
      }

      const idx = allRows.findIndex(r => r['id'] === params.rowId)
      if (idx !== -1) {
        allRows[idx] = { ...allRows[idx], [params.key]: params.next }
      }

      return { errors: null }
    },
  }
}
