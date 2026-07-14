import type { ErrorLike } from '../types.js'

// ─── Filtering ───────────────────────────────────────────────────────────────

export type FilterOperator =
  | 'eq' | 'neq'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in'
  | 'isNull' | 'isNotNull'

export interface FieldFilter<T, K extends keyof T = keyof T> {
  key:      K
  operator: FilterOperator
  value:    T[K]
}

export type FilterState<T> = FieldFilter<T, keyof T>[]

// ─── Page request / result ───────────────────────────────────────────────────

export interface FetchParams<T> {
  cursor:  string | null
  limit:   number
  sort:    import('../types.js').SortState<T> | null
  filters: FilterState<T>
}

export interface PageResult<T> {
  rows:        T[]
  nextCursor:  string | null
  totalCount?: number
}

// ─── Write operations ────────────────────────────────────────────────────────

export interface PatchRowParams<T> {
  rowId: string | number
  key:   keyof T
  prev:  T[keyof T]
  next:  T[keyof T]
}

export interface PatchRowResult {
  errors: ErrorLike[] | null
}

export interface PatchSelectionParams {
  rowIds:     (string | number)[]
  isSelected: boolean
}

// ─── Backend adapter (implemented by consumers) ──────────────────────────────

export interface TableDataAdapter<T> {
  fetch(params: FetchParams<T>): Promise<PageResult<T>>
  patchRow?(params: PatchRowParams<T>): Promise<PatchRowResult>
  patchSelection?(params: PatchSelectionParams): Promise<void>
}

// ─── Transporter options ─────────────────────────────────────────────────────

export interface TransporterOptions<T> {
  limit?:              number
  initialSort?:        import('../types.js').SortState<T>
  initialFilters?:     FilterState<T>
  prefetchThreshold?:  number
}

// ─── Transporter state (what FastTable reads) ─────────────────────────────────

export interface DataTransporter<T> {
  rows:           T[]
  isLoading:      boolean
  isFetchingMore: boolean
  hasMore:        boolean
  cursor:         string | null
  totalCount:     number | undefined
  error:          Error | null

  fetchMore():    void
  reload():       void
  patchRow(params: PatchRowParams<T>): Promise<ErrorLike[] | null>
  patchSelection(params: PatchSelectionParams): Promise<void>
}
