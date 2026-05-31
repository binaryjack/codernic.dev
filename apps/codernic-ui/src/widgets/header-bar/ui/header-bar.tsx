import { ContextWindowWidget } from '../../../../../vscode-extension/src/features/codernic/context-x-ray/ui/context-window-widget/index.js';
import type { CodernicMode } from '../../../../../vscode-extension/src/features/codernic/model/codernic-mode.types.js';
import type { JourneyPhase } from '../../../../../vscode-extension/src/features/codernic/model/journey-state.js';
import type { ContextWindowUI } from '../../../../../vscode-extension/src/shared/types/ai-agencee-types.js';
import { ModeDropdown, AutopilotToggle } from '../../../features/mode-selector';
import { ModelDropdown } from '../../../features/model-selector';
import type { SelectOption } from '../../../entities/kernel';
import { Button } from '../../../shared';

interface HeaderBarProps {
  mode: CodernicMode;
  onModeChange: (mode: CodernicMode) => void;
  journeyPhase: JourneyPhase;
  llmLoading: boolean;
  llmOptions: SelectOption[];
  sessionLlm: string;
  onLlmChange: (llm: string) => void;
  contextWindowUI: ContextWindowUI | null;
  onContextWarning: (severity: 'warning' | 'critical') => void;
  onSettingsToggle: () => void;
  isAutoPilot: boolean;
  onAutopilotToggle: () => void;
}

export function HeaderBar({
  mode,
  onModeChange,
  journeyPhase,
  llmLoading,
  llmOptions,
  sessionLlm,
  onLlmChange,
  contextWindowUI,
  onContextWarning,
  onSettingsToggle,
  isAutoPilot,
  onAutopilotToggle,
}: HeaderBarProps) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '6px 12px',
        borderBottom: '1px solid var(--border, #27272a)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#131316',
      }}
    >
      <ModeDropdown mode={mode} onChange={onModeChange} />
      
      {mode === 'journey' && (
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--mono)',
            fontWeight: 700,
            background: 'rgba(129, 140, 248, 0.15)',
            color: '#818cf8',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          Phase {journeyPhase}
        </span>
      )}

      <ModelDropdown
        llmOptions={llmOptions}
        sessionLlm={sessionLlm}
        onChange={onLlmChange}
        loading={llmLoading}
      />

      <ContextWindowWidget
        contextUI={contextWindowUI}
        size={24}
        showLabel={false}
        popupPosition="bottom"
        onContextWarning={onContextWarning}
      />

      <AutopilotToggle isAutoPilot={isAutoPilot} onToggle={onAutopilotToggle} />

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
  );
}
