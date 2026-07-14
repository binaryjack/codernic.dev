'use client'

import { cx } from '../lib/cx.js'
import { FieldSet } from './field-set.js'
import { fieldBase, fieldBorder, fieldDisabled, fieldFocus } from './field.classes.js'
import { useFormularField } from './use-formular-field.js'
import { useTestId } from '../hooks/useTestId';

interface InputProps {
  name:        string
  label?:      string
  type?:       'text' | 'number' | 'email' | 'password' | 'url'
  placeholder?: string
  disabled?:   boolean
  className?:  string
  dataTestId?: string;
}

export function Input({ dataTestId,
  name,
  label,
  type        = 'text',
  placeholder = '',
  disabled    = false,
  className   = '',
}: Readonly<InputProps>) {
  
  const { rootId, getTestId } = useTestId('input', dataTestId);
const field = useFormularField<string | number>(name)

  return (
    <FieldSet data-testid={getTestId('field-set')} field={field} label={label} disabled={disabled} className={className}>
      <input
        id={field.id}
        name={name}
        type={type}
        value={field.value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={field.hasError}
        aria-describedby={field.hasError ? `${field.id}-error` : undefined}
        className={cx(
          fieldBase,
          fieldFocus,
          'w-full',
          field.hasError ? fieldBorder.error : fieldBorder.default,
          disabled && fieldDisabled,
        )}
        onFocus={() => field.setIsFocused(true)}
        onBlur={() => {
          field.setIsFocused(false)
          field.setIsTouched(true)
          void field.validate(name)
        }}
        onChange={(e) => {
          const raw = e.target.value
          field.updateField(name, type === 'number' ? (raw === '' ? '' : Number(raw)) : raw)
        }}
      />
    </FieldSet>
  )
}
