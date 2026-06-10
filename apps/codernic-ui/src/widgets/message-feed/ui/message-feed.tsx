import { memo } from 'react';
import type { CodernicMode } from '../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import type {
  AgentRunState,
  ChatMsg,
  PhaseGateState,
  ThinkingState,
} from '../../../entities/kernel';
import { Button, Watermark } from '../../../shared';
import { MessageCard } from './message-card';
import { ThinkingIndicator } from './thinking-indicator';
import { AgentRunPanel } from '../../agent-run';
import { DagPipeline } from '../../dag-pipeline';

interface MessageFeedProps {
  mode: CodernicMode;
  messages: ChatMsg[];
  agentRun: AgentRunState | null;
  onAgentRunDismiss: () => void;
  phaseGate: PhaseGateState | null;
  onPhaseGateConfirm: () => void;
  onPhaseGateDismiss: () => void;
  sending: boolean;
  thinking: ThinkingState;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageFeed = memo(function MessageFeed({
  mode,
  messages,
  agentRun,
  onAgentRunDismiss,
  phaseGate,
  onPhaseGateConfirm,
  onPhaseGateDismiss,
  sending,
  thinking,
  messagesEndRef,
}: MessageFeedProps) {
  const isCompact = (mode === 'agent' && agentRun); 

  return (
    <div
      className={`message-list-container ${isCompact ? 'compact' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px 12px',
        position: 'relative',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Watermark size={100} opacity={0.03} />

      {/* Message History */}
      <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        {messages.map((msg) => (
          <MessageCard key={msg.id} msg={msg} />
        ))}
      </div>

      {/* Agent execution & pipeline metrics */}
      {agentRun && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border, #27272a)', paddingTop: '16px', zIndex: 1 }}>
          <AgentRunPanel run={agentRun} onDismiss={onAgentRunDismiss} />
        </div>
      )}


      {/* DAG node tracker */}
      <DagPipeline />

      {/* Confirmation Phase Gate Overlay */}
      {phaseGate && (
        <div
          style={{
            margin: '12px 0',
            padding: '12px',
            borderRadius: '6px',
            background: 'rgba(129, 140, 248, 0.08)',
            border: '1px solid rgba(129, 140, 248, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-h)' }}>
            🗺️ Phase {phaseGate.phase} complete — confirm to advance
          </div>
          <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{phaseGate.summary}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button onClick={onPhaseGateConfirm} variant="primary" size="sm">
              Confirm & Advance
            </Button>
            <Button onClick={onPhaseGateDismiss} variant="secondary" size="sm">
              Not Yet
            </Button>
          </div>
        </div>
      )}

      {sending && <ThinkingIndicator state={thinking} />}

      <div ref={messagesEndRef} />
    </div>
  );
});
