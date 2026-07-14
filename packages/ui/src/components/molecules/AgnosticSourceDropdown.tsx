import React from 'react';
import { useTestId } from '../../hooks/useTestId';

export interface AgnosticSourceItem {
  id: string;
  name: string;
  type: string;
}

export interface AgnosticSourceDropdownProps {
  sources: AgnosticSourceItem[];
  selectedId: string;
  onChange: (id: string, type: string) => void;
  dataTestId?: string;
}

export function AgnosticSourceDropdown({ sources, selectedId, onChange, dataTestId }: AgnosticSourceDropdownProps) {
  const rootId = dataTestId || 'agnostic-source-dropdown';
  
  return (
    <div className="flex items-center gap-3" data-testid={rootId}>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
        <span className="text-amber-500">⚡</span>
        Data Source
      </label>
      <div className="relative">
        <select 
          value={selectedId || ''} 
          onChange={(e) => {
            const selected = sources.find(s => s.id === e.target.value);
            if (selected) onChange(selected.id, selected.type);
          }}
          className="appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-100 text-sm font-medium rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-[240px] px-3 py-2 transition-colors cursor-pointer pr-8"
        >
          <option value="" disabled>Select a configuration source...</option>
          {sources.map(s => (
            <option key={`${s.type}-${s.id}`} value={s.id}>
              {s.name} [{s.type}]
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}
