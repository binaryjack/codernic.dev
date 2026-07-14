import { memo } from 'react';
import type { CodernicMode } from '../../../../../../codernic-ext/src/features/codernic/model/codernic-mode.types';
import type { AgentRunState, PhaseGateState } from '../../../../entities/kernel/model/types';
import type { ChatMsg, ThinkingState } from '../../../../entities/kernel/model/types';
import { Button, Watermark } from '@ai-agencee/ui';
import { MessageCard } from './message-card';
import { ThinkingIndicator } from '../molecules/thinking-indicator';

import { DagPipeline } from '../../../../widgets/dag-pipeline/ui/dag-pipeline';
import { useTestId } from '@ai-agencee/ui';

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
  onSuggestionClick: (text: string) => void;
  sessionId?: string | null;
  renderWelcomeHero?: (onDismiss: () => void) => React.ReactNode;
  dataTestId?: string;
  'data-demo-desc'?: string;
}

export const MessageFeed = memo(function MessageFeed({ dataTestId, 'data-demo-desc': dataDemoDesc,
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
  onSuggestionClick,
  sessionId,
  renderWelcomeHero,
}: MessageFeedProps) {
  
  const { rootId, getTestId } = useTestId('message-feed', dataTestId);
const isCompact = (mode === 'agent' && agentRun); 

  return (
    <div
      data-testid={dataTestId || 'message-feed'}
      data-demo-desc={dataDemoDesc}
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
      <Watermark data-testid={getTestId('watermark')} size={100} opacity={0.03} />

      {/* Message History */}
      <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        {messages.length === 0 && thinking.phase === 'idle' && !agentRun && (
            renderWelcomeHero 
              ? renderWelcomeHero(() => {})
              : (
                <div className="flex flex-col items-center justify-center pt-24 pb-12 text-center opacity-30 pointer-events-none">
                  {/* Minimalist empty state - Watermark handles the background */}
                </div>
              )
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            <MessageCard data-testid={`message-card-${msg.id}`} msg={msg} />
          </div>
        ))}
      </div>




      {/* DAG node tracker */}
      <DagPipeline data-testid={getTestId('dag-pipeline')} />

      {/* Confirmation Phase Gate Overlay */}
      {phaseGate && (
        <div 
          className="absolute bottom-[20px] left-1/2 transform -translate-x-1/2 z-50 bg-[#18181b] border border-[#3f3f46] shadow-xl p-4 rounded-lg w-[90%] max-w-[400px] flex flex-col gap-3"
          data-testid="phase-gate-modal"
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--amber-400)' }}>{phaseGate.summary}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button data-testid={getTestId('button')} onClick={onPhaseGateConfirm} variant="primary" size="sm">
              Confirm & Advance
            </Button>
            <Button data-testid={getTestId('button-1')} onClick={onPhaseGateDismiss} variant="secondary" size="sm">
              Not Yet
            </Button>
          </div>
        </div>
      )}

      {sending && <ThinkingIndicator data-testid={getTestId('thinking-indicator')} state={thinking} sessionId={sessionId || undefined} />}

      <div ref={messagesEndRef} />
    </div>
  );
});
