import { useState } from 'react';

interface AccordionProps {
  label: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ label, actions, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="shared-accordion"
      style={{
        border: `1px solid ${isOpen ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: isOpen ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.025)',
        margin: '3px 0',
        transition: 'border-color 0.2s ease, background 0.2s ease',
        flexShrink: 0,
      }}
    >
      {/* Header — uses <div> throughout to avoid invalid block-in-inline HTML */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isOpen ? '1px solid rgba(245,158,11,0.15)' : 'none',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {/* Left: chevron + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
          {/* Chevron */}
          <div
            style={{
              width: '12px',
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s ease',
              color: isOpen ? 'var(--amber-400)' : 'var(--text-muted)',
            }}
          >
            {/* Inline chevron SVG — avoids font size issues */}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 1 6 4 2 7" />
            </svg>
          </div>

          {/* Label — rendered as a div, NOT a span, so ReactNode block content is valid */}
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isOpen ? 'var(--amber-400)' : 'var(--text-primary)',
              minWidth: 0,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {label}
          </div>
        </div>

        {/* Right: action buttons */}
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>

      {/* Body */}
      {isOpen && (
        <div
          style={{
            padding: '8px 10px',
            fontSize: '11px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
