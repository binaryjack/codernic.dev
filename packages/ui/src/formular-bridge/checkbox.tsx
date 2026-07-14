'use client'

import { cx } from '../lib/cx.js'
import { FieldSet } from './field-set.js'
import { fieldDisabled } from './field.classes.js'
import { useFormularField } from './use-formular-field.js'
import { useTestId } from '../hooks/useTestId';

interface CheckBoxProps {
  name:       string
  label?:     string
  disabled?:  boolean
  className?: string
  dataTestId?: string;
}

export function CheckBox({ dataTestId,
  name,
  label,
  disabled   = false,
  className  = '',
}: Readonly<CheckBoxProps>) {
  
  const { rootId, getTestId } = useTestId('check-box', dataTestId);
const field = useFormularField<boolean>(name)

  return (
    <FieldSet data-testid={getTestId('field-set')}
      field={field}
      label={label}
      labelPosition="inline"
      disabled={disabled}
      className={className}
    >
      <input
        id={field.id}
        name={name}
        type="checkbox"
        checked={field.value ?? false}
        disabled={disabled}
        aria-invalid={field.hasError}
        aria-describedby={field.hasError ? `${field.id}-error` : undefined}
        className={cx(
          'h-4 w-4 rounded border-neutral-300 dark:border-neutral-600',
          'text-brand-500 focus:ring-brand-500 focus:ring-2 outline-none',
          'transition-colors cursor-pointer',
          disabled && fieldDisabled,
        )}
        onFocus={() => field.setIsFocused(true)}
        onBlur={() => {
          field.setIsFocused(false)
          field.setIsTouched(true)
          void field.validate(name)
        }}
        onChange={(e) => {
          field.updateField(name, e.target.checked)
        }}
      />
    </FieldSet>
  )
}
