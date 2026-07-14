import React from 'react';
import { Button } from '../atoms/button';
import { useTestId } from '../hooks/useTestId';

interface ConfirmModalProps {
  title: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  dataTestId?: string;
}

export function ConfirmModal({ dataTestId,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
}: ConfirmModalProps) {
  
  const { rootId, getTestId } = useTestId('confirm-modal', dataTestId);
return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg-surface)',
          border: `1px solid ${danger ? 'var(--border-danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: danger
            ? '0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(248,113,113,0.1)'
            : 'var(--shadow-lg)',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: 'var(--text-primary)',
          boxSizing: 'border-box',
        }}
      >
        {/* Top gradient accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            background: danger
              ? 'linear-gradient(90deg, var(--status-error), transparent)'
              : 'linear-gradient(90deg, var(--amber-500), transparent)',
          }}
        />

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {danger && (
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
          )}
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'var(--text-heading)',
              margin: 0,
              fontFamily: 'var(--heading)',
            }}
          >
            {title}
          </h2>
        </div>

        {/* Divider */}
        <div className="divider-gradient" />

        {/* Message */}
        <div style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.6 }}>
          {message}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <Button data-testid={getTestId('button')} onClick={onCancel} variant="secondary" size="sm">
            {cancelText}
          </Button>
          <Button data-testid={getTestId('button-1')} onClick={onConfirm} variant={danger ? 'danger' : 'primary'} size="sm">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
