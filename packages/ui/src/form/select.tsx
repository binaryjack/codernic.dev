import { BaseSelect } from '../atoms/index.js';
import { FieldSet } from '../formular-bridge/field-set.js';
import {
  fieldBase,
  fieldBorder,
  fieldDisabled,
  fieldFocus,
} from '../formular-bridge/field.classes.js';
import { useFormularField } from '../formular-bridge/use-formular-field.js';
import { cx } from '../lib/cx.js';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name: string;
  label?: string;
  options: SelectOption[];
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function Select({
  name,
  label,
  options,
  disabled = false,
  isLoading = false,
  className = '',
}: Readonly<SelectProps>) {
  const field = useFormularField<string>(name);

  return (
    <FieldSet field={field} label={label} className={className}>
      <BaseSelect
        id={field.id}
        name={name}
        value={(field.value as string | undefined) ?? ''}
        disabled={disabled}
        isLoading={isLoading}
        onFocus={() => field.setIsFocused(true)}
        onChange={(e) => {
          field.updateField(name, e.target.value);
          void field.validate(name);
        }}
        onBlur={() => {
          field.setIsFocused(false);
          void field.validate(name);
        }}
        aria-invalid={field.hasError ? 'true' : undefined}
        aria-describedby={field.hasError ? `${field.id}-validation` : undefined}
        className={cx(
          fieldBase,
          'cursor-pointer',
          fieldFocus,
          field.hasError ? fieldBorder.error : fieldBorder.default,
          disabled && fieldDisabled,
        )}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </BaseSelect>
    </FieldSet>
  );
}
