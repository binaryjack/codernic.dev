import { Button } from '../../../shared';

interface HeaderBarProps {
  sessionName?: string;
  onSettingsToggle: () => void;
  onNewSession: () => void;
}

export function HeaderBar({
  sessionName,
  onSettingsToggle,
  onNewSession,
}: HeaderBarProps) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '6px 12px',
        borderBottom: '1px solid var(--border, #27272a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#131316',
      }}
    >
      <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--vscode-descriptionForeground)] select-none">
        <span>AI Agencee Project</span>
        {sessionName && (
          <>
            <span className="opacity-50">/</span>
            <span className="text-[var(--vscode-editor-foreground)]">{sessionName}</span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          title="New Session"
          onClick={onNewSession}
          variant="secondary"
          size="xs"
          style={{
            padding: '4px',
            fontSize: '11px',
            aspectRatio: '1',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </Button>
        <Button
          title="Settings"
          onClick={onSettingsToggle}
          variant="secondary"
          size="xs"
          style={{
            padding: '4px',
            fontSize: '11px',
            aspectRatio: '1',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ⚙
        </Button>
      </div>
    </div>
  );
}
