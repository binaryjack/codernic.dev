import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resolveApproval, selectApprovalRequest } from '../../../entities/kernel';

export function ApprovalModal() {
  const dispatch = useDispatch();
  const request = useSelector(selectApprovalRequest);
  const [feedback, setFeedback] = useState('');

  if (!request) return null;

  const handleApprove = () => {
    dispatch(resolveApproval({ id: request.id, verdict: 'approve', feedback }));
    setFeedback('');
  };

  const handleReject = () => {
    dispatch(resolveApproval({ id: request.id, verdict: 'reject', feedback }));
    setFeedback('');
  };

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
          maxWidth: '480px',
          background: '#131316',
          border: '1px solid #f59e0b', // Amber alert border
          borderRadius: '8px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.15)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#e4e4e7',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 8px #f59e0b',
            }}
          />
          <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em', color: '#fafafa', margin: 0 }}>
            ✋ Validation Approval Gate
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
            Node ID: {request.id}
          </div>
          <div
            style={{
              background: '#1c1c22',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #27272a',
              fontSize: '11.5px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: '#d4d4d8',
            }}
          >
            {request.prompt}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa' }}>
            Optional Instructions / Feedback for Agent
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Type feedback to steer the agent or specify manual correction rules..."
            style={{
              width: '100%',
              minHeight: '80px',
              maxHeight: '150px',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '6px',
              color: '#fafafa',
              padding: '10px',
              fontSize: '11.5px',
              fontFamily: 'var(--sans)',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={handleApprove}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '11px',
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
            Approve & Continue
          </button>
          <button
            onClick={handleReject}
            style={{
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#f87171',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Reject Step
          </button>
        </div>
      </div>
    </div>
  );
}
