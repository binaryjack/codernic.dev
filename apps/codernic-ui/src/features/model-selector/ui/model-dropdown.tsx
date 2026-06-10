import { useEffect } from 'react';
import type { SelectOption } from '../../../entities/kernel';
import { Select } from '../../../shared';

interface ModelDropdownProps {
  llmOptions: SelectOption[];
  sessionLlm: string;
  onChange: (llm: string) => void;
  loading: boolean;
  routeProfiles: SelectOption[];
  routeProfile: string;
  onRouteProfileChange: (p: string) => void;
}

export function ModelDropdown({
  llmOptions,
  sessionLlm,
  onChange,
  loading,
  routeProfiles,
  routeProfile,
  onRouteProfileChange,
}: ModelDropdownProps) {

  const filteredLlms = llmOptions.filter((opt) => {
    if (routeProfile === 'default') {
      return true; // Show all models if Default is selected
    }
    if (routeProfile === 'github_copilot') {
      // Show Copilot models (options that do NOT start with 'custom:')
      return !opt.value.startsWith('custom:');
    }
    // For custom providers, the value starts with 'custom:providerId:'
    return opt.value.startsWith(`custom:${routeProfile}:`);
  });

  // Automatically adjust selected LLM if it's not valid for the current route profile
  useEffect(() => {
    if (filteredLlms.length > 0 && !filteredLlms.some((opt) => opt.value === sessionLlm)) {
      onChange(filteredLlms[0].value);
    }
  }, [routeProfile, sessionLlm, filteredLlms, onChange]);

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

  const groups = Array.from(new Set(filteredLlms.map((o) => o.group || 'Models')));

  return (
    <div style={{ display: 'flex', gap: '6px', flex: 1, alignItems: 'center' }}>
      {/* Route Profile Dropdown */}
      <Select
        value={routeProfile}
        onChange={(e) => onRouteProfileChange(e.currentTarget.value)}
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
        {routeProfiles.map((p) => (
          <option
            key={p.value}
            value={p.value}
            style={{ background: '#18181b', color: '#e4e4e7' }}
          >
            {p.label}
          </option>
        ))}
      </Select>

      {/* Model Dropdown */}
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
            {filteredLlms
              .filter((o) => (o.group || 'Models') === group)
              .map((m, i) => (
                <option
                  key={`${group}-${m.value}-${i}`}
                  value={m.value}
                  style={{ background: '#18181b', color: '#e4e4e7' }}
                >
                  {m.label}
                </option>
              ))}
          </optgroup>
        ))}
      </Select>
    </div>
  );
}
