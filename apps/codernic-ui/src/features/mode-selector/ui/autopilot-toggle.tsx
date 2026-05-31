import { Button } from '../../../shared';

interface AutopilotToggleProps {
  isAutoPilot: boolean;
  onToggle: () => void;
}

export function AutopilotToggle({ isAutoPilot, onToggle }: AutopilotToggleProps) {
  return (
    <Button
      onClick={onToggle}
      variant={isAutoPilot ? 'accent' : 'secondary'}
      size="xs"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '0.05em',
        padding: '3px 8px',
        boxShadow: isAutoPilot ? '0 0 8px rgba(59, 130, 246, 0.2)' : 'none',
      }}
    >
      {isAutoPilot ? '🤖 AUTO-PILOT ON' : '👤 MANUAL MODE'}
    </Button>
  );
}
