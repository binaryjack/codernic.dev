'use client'

import { useEffect, useId, useState } from 'react'
import type { ErrorLike, FormBridge } from './form-provider.js'
import { useForm } from './form-provider.js'

export interface FieldSnapshot<T = unknown> {
  id:               string
  name:             string
  value:            T
  errors:           ErrorLike[]
  hasError:         boolean
  isDirty:          boolean
  isTouched:        boolean
  setIsTouched:     (v: boolean) => void
  isFocused:        boolean
  setIsFocused:     (v: boolean) => void
  // form actions — so components never need a second useForm() call
  updateField:      FormBridge['updateField']
  validate:         FormBridge['validate']
  submit:           FormBridge['submit']
  reset:            FormBridge['reset']
  isValid:          boolean
  isBusy:           boolean
  submitAttemptCount: number
}

/**
 * Single hook that owns all field-level state and exposes form actions.
 * Components only need this — never call useForm(), useId(), or useState() separately.
 *
 * @param fieldName   - The field key in the form.
 * @param externalId  - Optional: pass an existing DOM id to override the generated one.
 */
export function useFormularField<T = unknown>(
  fieldName:   string,
  externalId?: string,
): FieldSnapshot<T> {
  const bridge = useForm()
  const newId  = useId()
  const id     = externalId ?? newId

  const [isFocused,  setIsFocused]  = useState(false)
  const [isTouched,  setIsTouched]  = useState(false)

  const errors   = bridge.getErrors(fieldName)
  const hasError = errors.length > 0

  useEffect(() => {
    if (bridge.submitAttemptCount > 0) setIsTouched(true)
  }, [bridge.submitAttemptCount])

  return {
    id,
    name:               fieldName,
    value:              bridge.getValue<T>(fieldName),
    errors,
    hasError,
    isDirty:            bridge.isDirty,
    isTouched,
    setIsTouched,
    isFocused,
    setIsFocused,
    updateField:        bridge.updateField.bind(bridge),
    validate:           bridge.validate.bind(bridge),
    submit:             bridge.submit.bind(bridge),
    reset:              bridge.reset.bind(bridge),
    isValid:            bridge.isValid,
    isBusy:             bridge.isBusy,
    submitAttemptCount: bridge.submitAttemptCount,
  }
}