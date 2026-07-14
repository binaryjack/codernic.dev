import { BaseInput } from '../atoms/index.js'
import { FieldSet } from '../formular-bridge/field-set.js'
import { fieldBase, fieldBorder, fieldDisabled, fieldFocus } from '../formular-bridge/field.classes.js'
import { useFormularField } from '../formular-bridge/use-formular-field.js'
import { cx } from '../lib/cx.js'
import { useTestId } from '../hooks/useTestId';

type InputType = 'text' | 'number' | 'email' | 'password' | 'url'

interface InputProps {
  name:         string
  label?:       string
  type?:        InputType
  placeholder?: string
  disabled?:    boolean
  isLoading?:   boolean
  className?:   string
  dataTestId?: string;
}

export function Input({ dataTestId,
  name,
  label,
  type        = 'text',
  placeholder,
  disabled    = false,
  isLoading   = false,
  className   = '',
}: Readonly<InputProps>) {
  
  const { rootId, getTestId } = useTestId('input', dataTestId);
const field = useFormularField<string | number>(name)

  return (
    <FieldSet data-testid={getTestId('field-set')} field={field} label={label} className={className}>
      <BaseInput data-testid={getTestId('base-input')}
        id={field.id}
        name={name}
        type={type}
        value={(field.value as string | number | undefined) ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        isLoading={isLoading}
        onChange={(e) => {
          const value = type === 'number' ? e.target.valueAsNumber : e.target.value
          field.updateField(name, value)
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
          fieldFocus,
          field.hasError ? fieldBorder.error : fieldBorder.default,
          disabled && fieldDisabled,
        )}
      />
    </FieldSet>
  )
}
