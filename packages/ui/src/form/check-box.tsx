import { BaseInput } from '../atoms/index.js'
import { FieldSet } from '../formular-bridge/field-set.js'
import { fieldBorder } from '../formular-bridge/field.classes.js'
import { useFormularField } from '../formular-bridge/use-formular-field.js'
import { cx } from '../lib/cx.js'

interface CheckBoxProps {
  name:       string
  label?:     string
  disabled?:  boolean
  isLoading?: boolean
  className?: string
}

export function CheckBox({
  name,
  label,
  disabled  = false,
  isLoading = false,
  className = '',
}: Readonly<CheckBoxProps>) {
  const field = useFormularField<boolean>(name)

  return (
    <FieldSet field={field} label={label} labelPosition="inline" disabled={disabled} className={className}>
      <BaseInput
        id={field.id}
        type="checkbox"
        name={name}
        checked={!!(field.value)}
        disabled={disabled}
        isLoading={isLoading}
        onChange={(e) => {
          field.updateField(name, e.target.checked)
        }}
        onFocus={() => field.setIsFocused(true)}
        onBlur={() => {
          field.setIsFocused(false)
          void field.validate(name)
        }}
        aria-invalid={field.hasError ? 'true' : undefined}
        aria-describedby={field.hasError ? `${field.id}-validation` : undefined}
        className={cx(
          'h-4 w-4 rounded border accent-brand-500',
          'focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
          field.hasError ? fieldBorder.error : fieldBorder.default,
        )}
      />
    </FieldSet>
  )
}
