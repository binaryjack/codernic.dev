import React from 'react';
import { IconSearch } from '../icons';
import { useTestId } from '../../hooks/useTestId';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onClickWrapper: (e: React.MouseEvent<HTMLDivElement>) => void;
  dataTestId?: string;
}

export function SearchInput({ dataTestId, 
  value, 
  onChange, 
  placeholder = "Search...",
  isFocused,
  onFocus,
  onBlur,
  onClickWrapper
}: SearchInputProps) {
  
  const { rootId, getTestId } = useTestId('search-input', dataTestId);
return (
    <div 
      data-testid={rootId}
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all duration-200 border ${
        isFocused ? 'bg-zinc-800 border-amber-500/50 w-32 md:w-48' : 'bg-transparent border-transparent hover:bg-zinc-800 w-8 md:w-32 cursor-pointer'
      }`}
      onClick={onClickWrapper}
    >
      <IconSearch data-testid={getTestId('icon-search')} size={12} className={isFocused || value ? 'text-amber-500' : 'text-zinc-500'} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={isFocused ? placeholder : ''}
        className={`bg-transparent border-none outline-none text-[10px] text-zinc-300 placeholder:text-zinc-600 transition-all ${
          isFocused || value ? 'w-full opacity-100' : 'w-0 opacity-0 md:w-full md:opacity-100'
        }`}
      />
    </div>
  );
}
