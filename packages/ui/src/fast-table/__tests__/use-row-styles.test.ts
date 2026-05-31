import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mergeRules, useRowStyles } from '../hooks/use-row-styles.js'
import { DEFAULT_ROW_RULES } from '../styles/default-row-rules.js'
import type { RowStyleRule, TableRowState } from '../types.js'

const base: TableRowState<unknown> = {
  data:                 {},
  errors:               {},
  isActive:             false,
  isSelected:           false,
  isVisible:            true,
  isInNearVisibleRange: false,
}

describe('mergeRules', () => {
  it('returns all defaults when overrides is empty', () => {
    expect(mergeRules(DEFAULT_ROW_RULES, [])).toHaveLength(DEFAULT_ROW_RULES.length)
  })

  it('same id — override replaces default', () => {
    const override: RowStyleRule<unknown>[] = [
      { id: 'selected', condition: () => true, classes: 'bg-amber-100', priority: 10 },
    ]
    const merged   = mergeRules(DEFAULT_ROW_RULES, override)
    const selected = merged.find(r => r.id === 'selected')!
    expect(selected.classes).toBe('bg-amber-100')
  })

  it('new id — appended to the merged set', () => {
    const extra: RowStyleRule<unknown>[] = [
      { id: 'vip', condition: () => true, classes: 'bg-purple-50', priority: 25 },
    ]
    const merged = mergeRules(DEFAULT_ROW_RULES, extra)
    expect(merged.some(r => r.id === 'vip')).toBe(true)
    expect(merged).toHaveLength(DEFAULT_ROW_RULES.length + 1)
  })

  it('result is sorted by priority ascending', () => {
    const merged     = mergeRules(DEFAULT_ROW_RULES, [])
    const priorities = merged.map(r => r.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })

  it('empty defaults + overrides returns only overrides', () => {
    const rules: RowStyleRule<unknown>[] = [
      { id: 'a', condition: () => true, classes: 'text-red-500', priority: 1 },
    ]
    expect(mergeRules([], rules)).toHaveLength(1)
  })

  it('empty defaults, empty overrides returns empty array', () => {
    expect(mergeRules([], [])).toHaveLength(0)
  })

  it('does not mutate the defaults array', () => {
    const copy = [...DEFAULT_ROW_RULES]
    mergeRules(DEFAULT_ROW_RULES, [{ id: 'x', condition: () => false, classes: 'x', priority: 99 }])
    expect(DEFAULT_ROW_RULES).toHaveLength(copy.length)
    expect(DEFAULT_ROW_RULES.every((r, i) => r.id === copy[i].id)).toBe(true)
  })
})

describe('useRowStyles', () => {
  it('returns empty string when rules array is empty', () => {
    const { result } = renderHook(() => useRowStyles(base, []))
    expect(result.current).toBe('')
  })

  it('returns empty string when no rules match', () => {
    const { result } = renderHook(() => useRowStyles(base, DEFAULT_ROW_RULES))
    expect(result.current).toBe('')
  })

  it('returns classes of matching rules', () => {
    const { result } = renderHook(() =>
      useRowStyles({ ...base, isSelected: true }, DEFAULT_ROW_RULES),
    )
    expect(result.current).toContain('bg-brand-50')
  })

  it('does not include classes of non-matching rules', () => {
    const { result } = renderHook(() => useRowStyles(base, DEFAULT_ROW_RULES))
    expect(result.current).not.toContain('ring-brand-400')
  })

  it('multiple matching rules are all included in output', () => {
    const { result } = renderHook(() =>
      useRowStyles({ ...base, isSelected: true, isActive: true }, DEFAULT_ROW_RULES),
    )
    const classes = result.current.split(' ').filter(Boolean)
    expect(classes.length).toBeGreaterThan(1)
    expect(result.current).toContain('bg-brand-50')
    expect(result.current).toContain('ring-brand-400')
  })
})
