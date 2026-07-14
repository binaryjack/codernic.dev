import React, { useState, useEffect } from 'react';
import { Button } from '@ai-agencee/ui';

interface ProviderCardHeaderProps {
  providerName: string;
  providerId: string;
  initialApiKey?: string;
  initialBaseUrl?: string;
  onSave: (apiKey: string, baseUrl: string) => void;
}

export function ProviderCardHeader({
  providerName,
  providerId,
  initialApiKey = '',
  initialBaseUrl = '',
  onSave
}: ProviderCardHeaderProps) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (initialApiKey && initialApiKey.startsWith('vault://')) {
      setApiKey('•••••••••••••••• [SECURE VAULT]');
    } else {
      setApiKey(initialApiKey);
    }
    setBaseUrl(initialBaseUrl);
  }, [initialApiKey, initialBaseUrl]);

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSave = () => {
    const keyToSave = apiKey === '•••••••••••••••• [SECURE VAULT]' ? initialApiKey : apiKey;
    onSave(keyToSave, baseUrl);
  };

  return (
    <div className="flex items-start gap-2 flex-1 pt-1" onClick={handleStopPropagation}>
      <div className="flex-1 min-w-0 mt-1">
        <span className="text-xs font-semibold text-[var(--text-main)] truncate">{providerName}</span>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key"
          className="px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[10px] text-[var(--text-main)] w-48 focus:outline-none focus:border-[var(--amber-400)] transition-colors"
        />
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="Base URL (optional)"
          className="px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[10px] text-[var(--text-main)] w-48 focus:outline-none focus:border-[var(--amber-400)] transition-colors"
        />
      </div>
      <div className="flex flex-shrink-0 mt-0.5 ml-1">
        <Button
          size="xs"
          variant="accent"
          onClick={handleSave}
          className="text-[10px] uppercase font-bold"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
