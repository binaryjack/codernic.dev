import { useState } from 'react';

import { ModelsTab } from './models-tab';
import { ProvidersTab } from './providers-tab';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'providers' | 'models'>('providers');

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    padding: '8px 4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: isActive ? '#60a5fa' : '#71717a',
    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'var(--vscode-editor-background)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          System Settings
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#71717a';
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #27272a)',
          gap: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('providers')}
          style={tabButtonStyle(activeTab === 'providers')}
        >
          Providers
        </button>
        <button
          onClick={() => setActiveTab('models')}
          style={tabButtonStyle(activeTab === 'models')}
        >
          Models
        </button>
      </div>

      <div className="settings-scroll-container" style={{ overflowY: 'auto' }}>
        {activeTab === 'providers' && <ProvidersTab />}
        {activeTab === 'models' && <ModelsTab />}
      </div>
    </div>
  );
}
