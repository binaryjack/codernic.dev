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
        border: '1px solid var(--border, #27272a)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(8px)',
        margin: '8px 0',
        transition: 'all 0.2s ease',
        boxShadow: isOpen ? '0 -10px 20px rgba(0,0,0,0.4), 0 0 10px rgba(34,211,238,0.05)' : 'none',
      }}
    >
      <div
        className="accordion-header cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          fontWeight: 600,
          fontSize: '11px',
          color: isOpen ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)',
          borderBottom: isOpen ? '1px solid var(--border, #27272a)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              fontSize: '8px',
              opacity: 0.6,
              color: 'var(--vscode-textLink-foreground)',
            }}
          >
            ▶
          </span>
          <span className="tracking-wide">{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {actions}
        </div>
      </div>
      {isOpen && (
        <div
          className="accordion-content"
          style={{
            padding: '12px',
            fontSize: '12px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
