import { Text } from '../atoms/index.js'
import { cx } from '../lib/cx.js'
import { optionClass } from './tri-state-toggle.classes.js'
import type { Option } from './tri-state-toggle.types.js'
import { OPTIONS } from './tri-state-toggle.types.js'
import { useTestId } from '../hooks/useTestId';

type TriState = boolean | undefined

function fromOption(opt: Option): TriState {
  if (opt === 'yes') return true
  if (opt === 'no')  return false
  return undefined
}

function toOption(value: TriState): Option {
  if (value === true)  return 'yes'
  if (value === false) return 'no'
  return '—'
}

interface Props {
  label: string
  value: TriState
  onChange: (value: TriState) => void
  dataTestId?: string;
}

export function TriStateToggle({ dataTestId, label, value, onChange }: Props) {
  
  const { rootId, getTestId } = useTestId('tri-state-toggle', dataTestId);
const active = toOption(value)

  return (
    <div className="flex flex-col gap-1">
      <Text data-testid={getTestId('text')} size="sm" variant="muted">{label}</Text>
      <div className="flex gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(fromOption(opt))}
            className={cx(
              'px-3 py-1 rounded-md border text-sm transition-colors',
              active === opt ? optionClass.active : optionClass.inactive,
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
