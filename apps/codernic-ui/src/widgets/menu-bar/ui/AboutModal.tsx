import { useSelector } from 'react-redux';
import { selectAppVersion } from '../../../features/system/store/system.slice';
import { Button } from '@ai-agencee/ui';
import { IconX, IconCodernic } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export interface IAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataTestId?: string;
}

export function AboutModal({ dataTestId, isOpen, onClose }: IAboutModalProps) {
  
  const { rootId, getTestId } = useTestId('about-modal', dataTestId);
const version = useSelector(selectAppVersion) || 'unknown';

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          width: '340px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
            About Codernic
          </span>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center' }}
          >
            <IconX data-testid={getTestId('icon-x')} size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Logo mark */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--amber-glow)',
              border: '1px solid var(--border-active)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-amber)',
            }}
          >
            <IconCodernic data-testid={getTestId('icon-codernic')} size={32} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>
              Codernic UI
            </p>
            <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--amber-400)', marginTop: '4px' }}>
              v{version}
            </p>
          </div>

          <div className="divider-gradient" style={{ width: '100%' }} />

          <p style={{ fontSize: '11px', color: 'var(--text-body)', textAlign: 'center', lineHeight: 1.6 }}>
            The Sovereign AI Agency.
            <br />Built for engineers, by engineers.
          </p>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, marginTop: '-4px' }}>
            Erathos powered by <a href="https://binaryjack.github.io/atomos-monorepo/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--amber-400)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Atomos Structura</a>
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-panel)',
          }}
        >
          <Button data-testid={getTestId('button')} onClick={onClose} variant="primary" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
