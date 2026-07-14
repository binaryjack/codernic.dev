import { useDispatch } from 'react-redux';
import { sendIntent } from '../../../../shared/store/intent';
import { Button } from '@ai-agencee/ui';
import type { PlanCtaMsg } from '../../../../entities/kernel/model/types';
import { useTestId } from '@ai-agencee/ui';

export interface PlanCtaCardProps {
  cta: PlanCtaMsg;
  dataTestId?: string;
}

export function PlanCtaCard({ dataTestId, cta }: PlanCtaCardProps) {
  
  const { rootId, getTestId } = useTestId('plan-cta-card', dataTestId);
const dispatch = useDispatch();

  return (
    <div
      data-testid={getTestId('plan-cta-card')}
      data-demo-desc="[CODER] Direct action prompt letting you approve and execute generated plans with one click."
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: 'var(--vscode-editor-background, #1e1e1e)',
        border: '1px solid var(--vscode-widget-border, #3f3f46)',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#10b981',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.06em',
          }}
        >
          PLAN READY
        </span>
        <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--mono)' }}>
          {cta.duration} · {cta.cost}
        </span>
      </div>

      <div style={{ fontSize: '11px', color: '#a1a1aa', fontStyle: 'italic', lineHeight: 1.5 }}>
        {cta.task.slice(0, 140)}{cta.task.length > 140 ? '…' : ''}
      </div>

      <Button data-testid={getTestId('button')}
        variant="primary"
        size="sm"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => {
          dispatch(
            sendIntent({
              type: 'codernic:run-dag-direct',
              payload: { plan: cta.text, task: cta.task },
            }),
          );
        }}
      >
        Start Implementation
      </Button>
    </div>
  );
}
