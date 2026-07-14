import { useSelector } from 'react-redux';
import { selectDiffModalOpen, selectIsErathosDirty } from '../../../features/dag/store/dag.slice';
import { resolveUnsavedChanges } from '../../../features/dag/store/confirmUnsavedChanges';

export function ErathosDiffModal() {
  const isOpen = useSelector(selectDiffModalOpen);
  const isDirty = useSelector(selectIsErathosDirty);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '500px',
          background: '#131316',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.15)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          color: '#e4e4e7',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 10px #f59e0b',
            }}
          />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fafafa', margin: 0 }}>
            Unsaved Changes in Canvas
          </h2>
        </div>

        <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#d4d4d8' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            You have unsaved modifications in your Erathos visual schema.
            If you leave now, you will lose your progress.
          </p>
          {isDirty && (
            <div style={{ marginTop: '10px', padding: '12px', background: '#1c1c22', border: '1px solid #27272a', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--mono)', color: '#a1a1aa' }}>
              ℹ️ A diff summary would go here if we implemented a visual diff. The schema JSON has changed since the last snapshot.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button
            onClick={() => resolveUnsavedChanges('approve')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            Save & Continue
          </button>
          
          <button
            onClick={() => resolveUnsavedChanges('discard')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fafafa',
              background: '#3f3f46',
              border: '1px solid #52525b',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#52525b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#3f3f46'; }}
          >
            Discard Changes
          </button>

          <button
            onClick={() => resolveUnsavedChanges('cancel')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#f87171',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
