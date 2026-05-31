'use client'

import { useState } from 'react'
import type { FieldSnapshot } from '../formular-bridge/use-formular-field.js'

export interface FormatFieldResult<V> {
  displayValue: string
  isEditing:    boolean
  draft:        string
  setDraft:     (v: string) => void
  handleFocus:  () => void
  handleBlur:   (inputString: string) => void
}

export function useFormatField<V>(
  field:         FieldSnapshot<V>,
  formatValue?:  (value: V) => string,
  parseValue?:   (display: string) => V,
): FormatFieldResult<V> {
  const [isEditing, setIsEditing] = useState(false)
  const [draft,     setDraft]     = useState('')

  const handleFocus = () => {
    setIsEditing(true)
    setDraft(String(field.value ?? ''))
  }

  const handleBlur = (inputString: string) => {
    setIsEditing(false)
    const parsed = parseValue
      ? parseValue(inputString)
      : (inputString as unknown as V)
    field.updateField(field.name, parsed)
  }

  const displayValue = isEditing
    ? draft
    : formatValue
      ? formatValue(field.value)
      : String(field.value ?? '')

  return { displayValue, isEditing, draft, setDraft, handleFocus, handleBlur }
}
