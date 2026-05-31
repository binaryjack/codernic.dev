'use client'

import { createForm } from '@pulsar-framework/formular.dev'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IFormularLike } from '../formular-bridge/form-provider.js'
import { ActiveRowContext } from './active-row-context.js'
import { FastTableContext } from './fast-table-context.js'
import { fastTableClasses as cls } from './fast-table.classes.js'
import { TableHeader } from './header/table-header.js'
import { useColSizes } from './hooks/use-col-sizes.js'
import { useRowSelection } from './hooks/use-row-selection.js'
import { mergeRules } from './hooks/use-row-styles.js'
import { useSort } from './hooks/use-sort.js'
import { useTableRows } from './hooks/use-table-rows.js'
import { useVirtualRows } from './hooks/use-virtual-rows.js'
import { ActiveRowFormProvider } from './row/active-row-form-provider.js'
import { TableRow } from './row/table-row.js'
import { DEFAULT_ROW_RULES } from './styles/default-row-rules.js'
import type { FastTableProps } from './types.js'

const DEFAULT_ROW_HEIGHT       = 40
const DEFAULT_CONTAINER_HEIGHT = 400

export function FastTable<T extends Record<string, unknown>>({
  transporter,
  rows: staticRows,
  columns,
  getRowId,
  schema,
  rowHeight       = DEFAULT_ROW_HEIGHT,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
  onCellChange,
  className,
  rowRules,
}: FastTableProps<T>) {
  // ── Data source ────────────────────────────────────────────────────────────
  const rawRows = transporter?.rows ?? staticRows ?? []

  // ── Sort ───────────────────────────────────────────────────────────────────
  const { sortState, setSortState, sortedRows } = useSort(rawRows)

  // ── Active row ─────────────────────────────────────────────────────────────
  const [activeRowId, setActiveRowIdRaw] = useState<string | number | null>(null)

  const setActiveRowId = useCallback(
    (id: string | number | null) => setActiveRowIdRaw(id),
    [],
  )

  // ── Selection ──────────────────────────────────────────────────────────────
  const {
    selectedIds, toggleRow, selectAll, selectNone,
  } = useRowSelection()

  const allIds      = useMemo(() => sortedRows.map(getRowId), [sortedRows, getRowId])
  const allSelected = selectedIds.size > 0 && selectedIds.size === allIds.length
  const someSelected= selectedIds.size > 0 && !allSelected

  // ── Virtual window ─────────────────────────────────────────────────────────
  const [scrollTop, setScrollTop] = useState(0)
  const virtualWindow = useVirtualRows(
    sortedRows.length, rowHeight, containerHeight, scrollTop,
  )
  const { startIndex, endIndex } = virtualWindow

  // ── Decorated rows ─────────────────────────────────────────────────────────
  const windowSlice = useMemo(
    () => sortedRows.slice(startIndex, endIndex + 1),
    [sortedRows, startIndex, endIndex],
  )

  const decoratedRows = useTableRows(
    windowSlice, getRowId, activeRowId, selectedIds,
    virtualWindow,
  )

  // ── Style rules ────────────────────────────────────────────────────────────
  const mergedRules = useMemo(
    () => mergeRules(DEFAULT_ROW_RULES as typeof DEFAULT_ROW_RULES, rowRules ?? []),
    [rowRules],
  )

  // ── Column sizes ───────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0]?.contentRect.width ?? 800)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const { gridTemplateColumns } = useColSizes(columns as { key: string; width?: number }[], containerWidth, 'fast-table')

  // ── Form (one per table) ───────────────────────────────────────────────────
  const [form, setForm] = useState<IFormularLike | null>(null)

  useEffect(() => {
    let alive = true
    void createForm({ schema: schema as Parameters<typeof createForm>[0]['schema'] })
      .then(f => { if (alive) setForm(f as unknown as IFormularLike) })
    return () => { alive = false }
  }, [schema])

  // Track active row data for form seeding when FormProvider mounts
  const activeRowDataRef = useRef<T | null>(null)
  useEffect(() => {
    if (!activeRowId) { activeRowDataRef.current = null; return }
    const row = sortedRows.find(r => getRowId(r) === activeRowId)
    activeRowDataRef.current = row ?? null
  }, [activeRowId, sortedRows, getRowId])

  // ── Sort handler ───────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (key: keyof T) => {
      const current = sortState
      setSortState(
        current?.key === key
          ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
          : { key, direction: 'asc' },
      )
    },
    [setSortState, sortState],
  )

  // ── Context values ─────────────────────────────────────────────────────────
  const fastTableCtx = useMemo(
    () => ({
      transporter:        transporter ?? null,
      visibleRows:        decoratedRows,
      columns,
      sortState,
      setSortState,
      rowRules:           mergedRules,
      rowHeight,
      containerHeight,
      scrollTop,
      setScrollTop,
      getRowId,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transporter, decoratedRows, columns, sortState, mergedRules, rowHeight, containerHeight, scrollTop, getRowId],
  )

  const activeRowCtx = useMemo(
    () => ({ activeRowId, setActiveRowId }),
    [activeRowId, setActiveRowId],
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <FastTableContext.Provider value={fastTableCtx}>
      <ActiveRowContext.Provider value={activeRowCtx}>
        <div
          ref={containerRef}
          className={`${cls.root}${className ? ` ${className}` : ''}`}
          role="grid"
          aria-rowcount={sortedRows.length}
        >
          {/* Header */}
          <TableHeader
            columns={columns}
            sortState={sortState}
            onSort={handleSort}
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={() => selectAll(allIds)}
            onSelectNone={selectNone}
            gridTemplateColumns={gridTemplateColumns}
          />

          {/* Scroll container */}
          <div
            className={cls.scrollContainer}
            style={{ height: containerHeight, overflowY: 'auto', position: 'relative' }}
            onScroll={e => setScrollTop((e.target as HTMLElement).scrollTop)}
          >
            {/* Spacer to maintain total scroll height */}
            <div style={{ height: sortedRows.length * rowHeight, position: 'relative' }}>
              {decoratedRows.map(rowState => {
                const id       = getRowId(rowState.data)
                const isActive = rowState.isActive
                const offsetTop = (sortedRows.findIndex(r => getRowId(r) === id) * rowHeight)

                const rowEl = (
                  <TableRow
                    key={String(id)}
                    rowState={rowState}
                    columns={columns}
                    rowId={id}
                    isSelected={selectedIds.has(id)}
                    onSelect={toggleRow}
                    onActivate={setActiveRowId}
                    style={{
                      position: 'absolute',
                      top:    offsetTop,
                      width:  '100%',
                      height: rowHeight,
                      gridTemplateColumns,
                      display: 'grid',
                    }}
                  />
                )

                if (isActive && form && schema) {
                  return (
                    <ActiveRowFormProvider
                      key={`form-${String(id)}`}
                      form={form}
                      schema={schema}
                    >
                      {rowEl}
                    </ActiveRowFormProvider>
                  )
                }

                return rowEl
              })}
            </div>
          </div>

          {/* Loading overlay */}
          {transporter?.isLoading && (
            <div className={cls.loadingOverlay} aria-label="Loading" />
          )}
        </div>
      </ActiveRowContext.Provider>
    </FastTableContext.Provider>
  )
}
