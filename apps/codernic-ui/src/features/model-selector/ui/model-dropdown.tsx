import type { SelectOption } from '../../../entities/kernel';
import { Select } from '../../../shared';

interface ModelDropdownProps {
  llmOptions: SelectOption[];
  sessionLlm: string;
  onChange: (llm: string) => void;
  loading: boolean;
}

export function ModelDropdown({
  llmOptions,
  sessionLlm,
  onChange,
  loading,
}: ModelDropdownProps) {
  if (loading) {
    return (
      <span
        style={{
          opacity: 0.5,
          fontSize: '11px',
          fontStyle: 'italic',
          padding: '4px 8px',
          color: '#a1a1aa',
        }}
      >
        Loading Models…
      </span>
    );
  }

  if (llmOptions.length === 0) {
    return (
      <span
        style={{
          opacity: 0.8,
          fontSize: '11px',
          color: '#ef4444',
          fontWeight: 600,
          padding: '4px 8px',
        }}
      >
        ⚠️ Sign in to GitHub Copilot
      </span>
    );
  }

  const groups = Array.from(new Set(llmOptions.map((o) => o.group || 'Models')));

  return (
    <Select
      value={sessionLlm}
      onChange={(e) => onChange(e.currentTarget.value)}
      variant="full"
      style={{
        flex: 1,
        fontSize: '11px',
        fontFamily: 'var(--sans)',
        background: '#18181b',
        borderColor: 'var(--border, #27272a)',
        height: '24px',
        padding: '2px 6px',
      }}
    >
      {groups.map((group) => (
        <optgroup
          key={group}
          label={group}
          style={{ background: '#18181b', color: '#e4e4e7', fontStyle: 'normal' }}
        >
          {llmOptions
            .filter((o) => (o.group || 'Models') === group)
            .map((m) => (
              <option
                key={m.value}
                value={m.value}
                style={{ background: '#18181b', color: '#e4e4e7' }}
              >
                {m.label}
              </option>
            ))}
        </optgroup>
      ))}
    </Select>
  );
}
