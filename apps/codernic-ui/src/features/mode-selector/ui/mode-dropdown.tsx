import type { CodernicMode } from '../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import { getModeLabel } from '../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import { Select } from '../../../shared';

const MODE_COLORS: Record<CodernicMode, string> = {
  ask: 'var(--accent-ask, #3b82f6)',
  plan: 'var(--accent-plan, #f59e0b)',
  agent: 'var(--accent-agent, #ef4444)',
  journey: 'var(--accent-journey, #818cf8)',
  analyse: 'var(--accent-analyse, #06b6d4)',
};

interface ModeDropdownProps {
  mode: CodernicMode;
  onChange: (mode: CodernicMode) => void;
}

export function ModeDropdown({ mode, onChange }: ModeDropdownProps) {
  return (
    <Select
      value={mode}
      onChange={(e) => onChange(e.currentTarget.value as CodernicMode)}
      glowColor={MODE_COLORS[mode]}
      style={{
        flex: '0 0 110px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '10px',
      }}
    >
      <option value="ask" style={{ background: '#18181b', color: '#e4e4e7' }}>
        {getModeLabel('ask')}
      </option>
      <option value="plan" style={{ background: '#18181b', color: '#e4e4e7' }}>
        {getModeLabel('plan')}
      </option>
      <option value="agent" style={{ background: '#18181b', color: '#e4e4e7' }}>
        {getModeLabel('agent')}
      </option>
      <option value="journey" style={{ background: '#18181b', color: '#e4e4e7' }}>
        {getModeLabel('journey')}
      </option>
      <option value="analyse" style={{ background: '#18181b', color: '#e4e4e7' }}>
        {getModeLabel('analyse')}
      </option>
    </Select>
  );
}
