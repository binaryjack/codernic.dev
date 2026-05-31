import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FieldSnapshot } from '../../formular-bridge/use-formular-field.js'
import { useFormatField } from '../use-format-field.js'

function makeField(value: unknown): FieldSnapshot<unknown> {
  return {
    id:                 'field-1',
    name:               'salary',
    value,
    errors:             [],
    hasError:           false,
    isDirty:            false,
    isTouched:          false,
    setIsTouched:       vi.fn(),
    isFocused:          false,
    setIsFocused:       vi.fn(),
    updateField:        vi.fn(),
    validate:           vi.fn(),
    submit:             vi.fn(),
    reset:              vi.fn(),
    isValid:            true,
    isBusy:             false,
    submitAttemptCount: 0,
  }
}

describe('useFormatField', () => {
  it('displayValue is String(value) when no formatValue provided', () => {
    const { result } = renderHook(() =>
      useFormatField(makeField(42) as FieldSnapshot<number>),
    )
    expect(result.current.displayValue).toBe('42')
  })

  it('displayValue uses formatValue callback when provided', () => {
    const fmt = (v: number) => `$${v.toLocaleString()}`
    const { result } = renderHook(() =>
      useFormatField(makeField(50000) as FieldSnapshot<number>, fmt),
    )
    expect(result.current.displayValue).toBe(fmt(50000))
  })

  it('isEditing starts false', () => {
    const { result } = renderHook(() =>
      useFormatField(makeField('hello') as FieldSnapshot<string>),
    )
    expect(result.current.isEditing).toBe(false)
  })

  it('handleFocus sets isEditing=true and draft to current raw value', () => {
    const { result } = renderHook(() =>
      useFormatField(makeField('hello') as FieldSnapshot<string>),
    )
    act(() => result.current.handleFocus())
    expect(result.current.isEditing).toBe(true)
    expect(result.current.draft).toBe('hello')
  })

  it('displayValue returns draft (raw) while editing', () => {
    const fmt = (v: number) => `$${v}`
    const { result } = renderHook(() =>
      useFormatField(makeField(100) as FieldSnapshot<number>, fmt),
    )
    act(() => result.current.handleFocus())
    expect(result.current.displayValue).toBe('100')
  })

  it('handleBlur calls updateField with raw string (no parseValue)', () => {
    const field = makeField('old')
    const { result } = renderHook(() =>
      useFormatField(field as FieldSnapshot<string>),
    )
    act(() => result.current.handleFocus())
    act(() => result.current.handleBlur('new'))
    expect(field.updateField).toHaveBeenCalledWith('salary', 'new')
    expect(result.current.isEditing).toBe(false)
  })

  it('handleBlur uses parseValue and calls updateField with parsed result', () => {
    const field  = makeField(50_000 as unknown) // V = number
    const parse  = (s: string) => Number(s.replace(/[$,]/g, ''))
    const { result } = renderHook(() =>
      useFormatField(field as FieldSnapshot<number>, undefined, parse),
    )
    act(() => result.current.handleFocus())
    act(() => result.current.handleBlur('$75,000'))
    expect(field.updateField).toHaveBeenCalledWith('salary', 75000)
  })

  it('displayValue shows formatted string when not editing', () => {
    const fmt = (v: number) => `${(v * 100).toFixed(1)}%`
    const { result } = renderHook(() =>
      useFormatField(makeField(0.875) as FieldSnapshot<number>, fmt),
    )
    expect(result.current.displayValue).toBe('87.5%')
  })

  it('setDraft updates draft value', () => {
    const { result } = renderHook(() =>
      useFormatField(makeField('hello') as FieldSnapshot<string>),
    )
    act(() => result.current.handleFocus())
    act(() => result.current.setDraft('world'))
    expect(result.current.draft).toBe('world')
  })

  it('handles null/undefined value gracefully', () => {
    const { result } = renderHook(() =>
      useFormatField(makeField(null) as FieldSnapshot<null>),
    )
    expect(result.current.displayValue).toBe('')
  })
})
