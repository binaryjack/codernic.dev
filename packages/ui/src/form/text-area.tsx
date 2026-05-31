import { FieldSet } from '../formular-bridge/field-set.js'
import { fieldBase, fieldBorder, fieldDisabled, fieldFocus } from '../formular-bridge/field.classes.js'
import { useFormularField } from '../formular-bridge/use-formular-field.js'
import { cx } from '../lib/cx.js'

interface TextAreaProps {
  name:         string
  label?:       string
  rows?:        number
  placeholder?: string
  disabled?:    boolean
  className?:   string
}

export function TextArea({
  name,
  label,
  rows        = 4,
  placeholder,
  disabled    = false,
  className   = '',
}: Readonly<TextAreaProps>) {
  const field = useFormularField<string>(name)

  return (
    <FieldSet field={field} label={label} className={className}>
      <textarea
        id={field.id}
        name={name}
        rows={rows}
        value={(field.value as string | undefined) ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          field.updateField(name, e.target.value)
          if (field.isTouched) void field.validate(name)
        }}
        onFocus={() => field.setIsFocused(true)}
        onBlur={() => {
          field.setIsFocused(false)
          field.setIsTouched(true)
          void field.validate(name)
        }}
        aria-invalid={field.hasError ? 'true' : undefined}
        aria-describedby={field.hasError ? `${field.id}-validation` : undefined}
        className={cx(
          fieldBase,
          'resize-y font-mono',
          fieldFocus,
          field.hasError ? fieldBorder.error : fieldBorder.default,
          disabled && fieldDisabled,
        )}
      />
    </FieldSet>
  )
}
