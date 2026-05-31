import { useState } from 'react';

interface AccordionProps {
  label: string;
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
        borderRadius: '6px',
        overflow: 'hidden',
        background: '#161618',
        margin: '8px 0',
        transition: 'border-color 0.2s ease',
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
          background: '#1e1e20',
          fontWeight: 600,
          fontSize: '11px',
          color: 'var(--text-h)',
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
            }}
          >
            ▶
          </span>
          <span>{label}</span>
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
            background: 'var(--vscode-editor-background)',
            fontSize: '12px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
