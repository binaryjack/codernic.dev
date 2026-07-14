import { BaseSelect } from './base-select.js'
import { useTestId } from '../hooks/useTestId';

const LLM_MODELS_FALLBACK = [
  { value: 'gpt-4o',              label: 'GPT-4o' },
  { value: 'gpt-4-turbo',         label: 'GPT-4 Turbo' },
  { value: 'claude-3-5-sonnet',   label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus',       label: 'Claude 3 Opus' },
  { value: 'gemini-1.5-pro',      label: 'Gemini 1.5 Pro' },
  { value: 'llama-3.1-70b',       label: 'Llama 3.1 70B' },
] as const

interface LlmSelectProps {
  value: string
  onChange(v: string): void
  /** Dynamic options from vscode.lm. Falls back to built-in list when omitted. */
  options?: { value: string; label: string }[]
  isLoading?: boolean
  className?: string
  'aria-label'?: string
  dataTestId?: string;
}

export function LlmSelect({ dataTestId,
  value,
  onChange,
  options,
  isLoading,
  className,
  'aria-label': ariaLabel = 'LLM Model',
}: LlmSelectProps) {
  
  const { rootId, getTestId } = useTestId('llm-select', dataTestId);
const models = options && options.length > 0 ? options : LLM_MODELS_FALLBACK
  return (
    <BaseSelect data-testid={getTestId('base-select')}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      isLoading={isLoading}
      className={className}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <option value="">— Select LLM —</option>
      {models.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </BaseSelect>
  )
}
