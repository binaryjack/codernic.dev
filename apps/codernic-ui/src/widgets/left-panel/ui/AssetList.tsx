import React from 'react';
import { IconX } from '@ai-agencee/ui';

const rowBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '11px',
  color: 'var(--text-body)',
  cursor: 'default',
  userSelect: 'none',
  transition: 'background 0.12s ease, color 0.12s ease',
  flexShrink: 0,
};

const iconBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  padding: '2px',
  borderRadius: 'var(--radius-xs)',
  flexShrink: 0,
  opacity: 0,
  transition: 'opacity 0.12s ease, color 0.12s ease',
};

export interface AssetListProps {
  items: { id: string; name: string }[];
  onOpen: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export function AssetList({ items, onOpen, onDelete, icon: Icon }: AssetListProps) {
  if (items.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic', padding: '2px 6px' }}>
        None defined
      </div>
    );
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {items.map((item) => (
        <li
          key={item.id}
          className="group/row"
          style={rowBase}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[data-action]')
              .forEach(el => { el.style.opacity = '1'; });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-body)';
            (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[data-action]')
              .forEach(el => { el.style.opacity = '0'; });
          }}
        >
          <Icon data-testid={`${typeof currentId !== 'undefined' ? currentId : 'items-item'}-icon`} size={11} color="var(--text-muted)" />
          <span
            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={() => onOpen(item.id)}
          >
            {item.name}
          </span>
          <button
            data-action="delete"
            title="Delete"
            style={iconBtn}
            onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.name); }}
          >
            <IconX data-testid={`${typeof currentId !== 'undefined' ? currentId : 'items-item'}-icon-x`} size={10} />
          </button>
        </li>
      ))}
    </ul>
  );
}
