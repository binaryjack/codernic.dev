import { describe, expect, it } from 'vitest'
import { DEFAULT_ROW_RULES } from '../styles/default-row-rules.js'
import type { TableRowState } from '../types.js'

const base: TableRowState<unknown> = {
  data:                 {},
  errors:               {},
  isActive:             false,
  isSelected:           false,
  isVisible:            true,
  isInNearVisibleRange: false,
}

describe('DEFAULT_ROW_RULES', () => {
  it('has 4 rules', () => {
    expect(DEFAULT_ROW_RULES).toHaveLength(4)
  })

  it('all rules have an id', () => {
    DEFAULT_ROW_RULES.forEach(r => expect(r.id.length).toBeGreaterThan(0))
  })

  it('all rules have non-empty classes', () => {
    DEFAULT_ROW_RULES.forEach(r => expect(r.classes.trim().length).toBeGreaterThan(0))
  })

  it('rules are ordered by priority ascending', () => {
    const priorities = DEFAULT_ROW_RULES.map(r => r.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })

  it('dirty — fires when data.isDirty === true', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'dirty')!
    expect(rule).toBeDefined()
    expect(rule.condition({ ...base, data: { isDirty: true } })).toBe(true)
    expect(rule.condition({ ...base, data: { isDirty: false } })).toBe(false)
    expect(rule.condition(base)).toBe(false)
  })

  it('dirty — does not fire for non-boolean isDirty', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'dirty')!
    expect(rule.condition({ ...base, data: { isDirty: 'yes' } })).toBe(false)
  })

  it('selected — fires when isSelected === true', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'selected')!
    expect(rule).toBeDefined()
    expect(rule.condition({ ...base, isSelected: true })).toBe(true)
    expect(rule.condition(base)).toBe(false)
  })

  it('has-errors — fires when at least one error array is non-empty', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'has-errors')!
    expect(rule).toBeDefined()
    expect(rule.condition({ ...base, errors: { name: [{ message: 'required' }] } })).toBe(true)
    expect(rule.condition({ ...base, errors: { name: [] } })).toBe(false)
    expect(rule.condition(base)).toBe(false)
  })

  it('has-errors — fires when multiple fields have errors', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'has-errors')!
    expect(rule.condition({
      ...base,
      errors: { name: [{ message: 'required' }], email: [{ message: 'invalid' }] },
    })).toBe(true)
  })

  it('active — fires when isActive === true', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'active')!
    expect(rule).toBeDefined()
    expect(rule.condition({ ...base, isActive: true })).toBe(true)
    expect(rule.condition(base)).toBe(false)
  })

  it('active has highest priority among defaults', () => {
    const rule = DEFAULT_ROW_RULES.find(r => r.id === 'active')!
    const maxPriority = Math.max(...DEFAULT_ROW_RULES.map(r => r.priority))
    expect(rule.priority).toBe(maxPriority)
  })

  it('no rule fires on a plain base row', () => {
    const firing = DEFAULT_ROW_RULES.filter(r => r.condition(base))
    expect(firing).toHaveLength(0)
  })
})
