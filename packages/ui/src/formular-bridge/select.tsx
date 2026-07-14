'use client'

import { cx } from '../lib/cx.js'
import { FieldSet } from './field-set.js'
import { fieldBase, fieldBorder, fieldDisabled, fieldFocus } from './field.classes.js'
import { useFormularField } from './use-formular-field.js'
import { useTestId } from '../hooks/useTestId';

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  name:       string
  label?:     string
  options:    SelectOption[]
  disabled?:  boolean
  className?: string
  dataTestId?: string;
}

export function Select({ dataTestId,
  name,
  label,
  options,
  disabled   = false,
  className  = '',
}: Readonly<SelectProps>) {
  
  const { rootId, getTestId } = useTestId('select', dataTestId);
const field = useFormularField<string>(name)

  return (
    <FieldSet data-testid={getTestId('field-set')} field={field} label={label} disabled={disabled} className={className}>
      <select
        id={field.id}
        name={name}
        value={field.value ?? ''}
        disabled={disabled}
        aria-invalid={field.hasError}
        aria-describedby={field.hasError ? `${field.id}-error` : undefined}
        className={cx(
          fieldBase,
          fieldFocus,
          'w-full appearance-none cursor-pointer',
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
          field.updateField(name, e.target.value)
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldSet>
  )
}
