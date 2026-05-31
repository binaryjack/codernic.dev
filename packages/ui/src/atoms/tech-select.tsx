import { BaseSelect } from './base-select.js'

export interface TechOption {
  value: string
  label: string
}

interface TechSelectProps {
  value: string
  onChange(v: string): void
  options?: TechOption[]
  isLoading?: boolean
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export function TechSelect({
  value,
  onChange,
  options = [],
  isLoading,
  placeholder = '— Select technology —',
  className,
  'aria-label': ariaLabel = 'Technology',
}: TechSelectProps) {
  return (
    <BaseSelect
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      isLoading={isLoading}
      className={className}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </BaseSelect>
  )
}
