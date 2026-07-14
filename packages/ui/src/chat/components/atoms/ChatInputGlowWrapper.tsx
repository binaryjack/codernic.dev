import React from 'react';

export interface ChatInputGlowWrapperProps {
  children: React.ReactNode;
  sending: boolean;
}

export function ChatInputGlowWrapper({ children, sending }: ChatInputGlowWrapperProps) {
  return (
    <div
      className={`chat-input-container ${sending ? 'sending' : ''}`}
      style={{
        '--chat-border-accent': 'var(--amber-500, #f59e0b)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        background: `linear-gradient(to bottom, var(--bg-primary, #131316), color-mix(in srgb, var(--bg-panel, #18181b) 80%, black)) padding-box, ${
          sending 
            ? `linear-gradient(60deg, transparent, var(--chat-border-accent), transparent, var(--chat-border-accent), transparent) border-box`
            : `var(--chat-border-accent) border-box`
        }`,
        border: '1px solid transparent',
        backgroundSize: sending ? '100% 100%, 200% 200%' : '100% 100%, 100% 100%',
        animation: sending ? 'borderDance 3s linear infinite' : 'none',
        zIndex: 1,
      } as React.CSSProperties}
    >
      <style>{`
        .chat-input-container.sending::before {
          content: "";
          position: absolute;
          top: -1px; left: -1px; right: -1px; bottom: -1px;
          border-radius: 9px;
          background: linear-gradient(60deg, transparent 30%, var(--chat-border-accent) 50%, transparent 70%);
          background-size: 200% 200%;
          animation: borderDance 2s linear infinite;
          filter: blur(3px);
          opacity: 0.6;
          pointer-events: none;
          
          /* Restrict the glow solely to the border edge */
          border: 2px solid transparent;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
        }
        @keyframes borderDance {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }
        @keyframes pulseSlow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes pulseFast {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .send-btn-circle {
          transition: all 0.2s ease;
          transform-origin: center;
          animation: pulseSlow 2s infinite ease-in-out;
        }
        .send-btn:hover:not(:disabled) .send-btn-circle {
          transform: scale(1.15) !important;
          animation: none;
          opacity: 1;
        }
        .send-btn:active:not(:disabled) .send-btn-circle {
          animation: pulseFast 0.4s infinite ease-in-out;
        }
      `}</style>
      {children}
    </div>
  );
}
