'use client'

import type { FieldSnapshot } from './use-formular-field.js'

interface ValidationResultProps {
  field: Pick<FieldSnapshot, 'id' | 'isFocused' | 'errors'>
}

/**
 * Renders field validation feedback in two modes:
 * - Guide: shown while the field is focused — soft hint style (brand colour)
 * - Error: shown after the field is blurred — assertive error style (danger colour, role="alert")
 */
export function ValidationResult({ field }: Readonly<ValidationResultProps>) {
  const { id, isFocused, errors } = field
  const validationId = `${id}-validation`
  if (errors.length === 0) return null

  if (isFocused) {
    return (
      <ul id={validationId} className="flex flex-col gap-0.5 mt-0.5" aria-live="polite">
        {errors.map((err, i) => (
          <li
            key={i}
            className="flex items-start gap-1 text-xs text-brand-500 dark:text-brand-400"
          >
            <span className="shrink-0 font-bold leading-none mt-0.5 select-none" aria-hidden="true">›</span>
            <span>{err.message}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul id={validationId} aria-live="assertive" aria-atomic="true" className="flex flex-col gap-0.5 mt-0.5">
      {errors.map((err, i) => (
        <li
          key={i}
          className="flex items-start gap-1 text-xs text-danger-700 dark:text-danger-500"
        >
          <span className="shrink-0 font-bold leading-none mt-0.5 select-none" aria-hidden="true">✕</span>
          <span>{err.message}</span>
        </li>
      ))}
    </ul>
  )
}
