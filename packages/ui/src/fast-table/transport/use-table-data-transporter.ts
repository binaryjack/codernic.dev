'use client'

import { useCallback, useRef, useState } from 'react'
import type { ErrorLike, SortState } from '../types.js'
import type {
    DataTransporter,
    FetchParams,
    FilterState,
    PageResult,
    PatchRowParams,
    PatchSelectionParams,
    TableDataAdapter,
    TransporterOptions,
} from './transporter.types.js'

const DEFAULT_LIMIT = 50

interface TransporterState<T> {
  rows:           T[]
  isLoading:      boolean
  isFetchingMore: boolean
  hasMore:        boolean
  cursor:         string | null
  totalCount:     number | undefined
  error:          Error | null
}

const initialState = <T>(): TransporterState<T> => ({
  rows:           [],
  isLoading:      true,
  isFetchingMore: false,
  hasMore:        true,
  cursor:         null,
  totalCount:     undefined,
  error:          null,
})

export function useTableDataTransporter<T>(
  adapter:  TableDataAdapter<T>,
  options?: TransporterOptions<T>,
): DataTransporter<T> {
  const limit             = options?.limit            ?? DEFAULT_LIMIT
  const prefetchThreshold = options?.prefetchThreshold

  // Use refs for sort/filters so changes don't cause unnecessary re-renders
  const sortRef    = useRef<SortState<T> | null>(options?.initialSort ?? null)
  const filtersRef = useRef<FilterState<T>>(options?.initialFilters ?? [])

  // Track in-flight requests to prevent double-fetch
  const fetchingRef = useRef(false)

  const [state, setState] = useState<TransporterState<T>>(initialState)

  const executeFetch = useCallback(
    async (cursor: string | null, append: boolean): Promise<void> => {
      if (fetchingRef.current) return
      fetchingRef.current = true

      setState(prev => ({
        ...prev,
        isLoading:      !append,
        isFetchingMore: append,
        error:          null,
      }))

      const params: FetchParams<T> = {
        cursor,
        limit,
        sort:    sortRef.current,
        filters: filtersRef.current,
      }

      try {
        const result: PageResult<T> = await adapter.fetch(params)
        setState(prev => ({
          ...prev,
          rows:           append ? [...prev.rows, ...result.rows] : result.rows,
          cursor:         result.nextCursor,
          hasMore:        result.nextCursor !== null,
          totalCount:     result.totalCount ?? prev.totalCount,
          isLoading:      false,
          isFetchingMore: false,
        }))
      } catch (err) {
        setState(prev => ({
          ...prev,
          isLoading:      false,
          isFetchingMore: false,
          error:          err instanceof Error ? err : new Error(String(err)),
        }))
      } finally {
        fetchingRef.current = false
      }
    },
    [adapter, limit],
  )

  // Trigger initial load once on mount
  const mountedRef = useRef(false)
  if (!mountedRef.current) {
    mountedRef.current = true
    // Schedule via microtask to avoid calling setState during render
    void Promise.resolve().then(() => executeFetch(null, false))
  }

  const fetchMore = useCallback((): void => {
    if (!state.hasMore || state.isFetchingMore || state.isLoading) return
    void executeFetch(state.cursor, true)
  }, [executeFetch, state.cursor, state.hasMore, state.isFetchingMore, state.isLoading])

  const reload = useCallback((): void => {
    fetchingRef.current = false
    setState(initialState<T>())
    void executeFetch(null, false)
  }, [executeFetch])

  const patchRow = useCallback(
    async (params: PatchRowParams<T>): Promise<ErrorLike[] | null> => {
      if (!adapter.patchRow) return null

      // Optimistic update
      const prevRows = state.rows
      setState(prev => ({
        ...prev,
        rows: prev.rows.map(row => {
          const patchable = row as Record<keyof T, T[keyof T]>
          if (params.rowId === (row as Record<string, unknown>)['id']) {
            return { ...patchable, [params.key]: params.next } as unknown as T
          }
          return row
        }),
      }))

      try {
        const result = await adapter.patchRow(params)
        if (result.errors && result.errors.length > 0) {
          // Roll back optimistic update on server validation error
          setState(prev => ({ ...prev, rows: prevRows }))
          return result.errors
        }
        return null
      } catch (err) {
        setState(prev => ({ ...prev, rows: prevRows }))
        throw err
      }
    },
    [adapter, state.rows],
  )

  const patchSelection = useCallback(
    async (params: PatchSelectionParams): Promise<void> => {
      if (!adapter.patchSelection) return
      await adapter.patchSelection(params)
    },
    [adapter],
  )

  return {
    rows:           state.rows,
    isLoading:      state.isLoading,
    isFetchingMore: state.isFetchingMore,
    hasMore:        state.hasMore,
    cursor:         state.cursor,
    totalCount:     state.totalCount,
    error:          state.error,
    fetchMore,
    reload,
    patchRow,
    patchSelection,
  }
}
