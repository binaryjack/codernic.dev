import React, { useState, ReactNode } from 'react';
import { Dropdown } from './dropdown';

export interface SelectOption {
  value: string;
  label: ReactNode;
}

export interface SelectDropdownProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  withSearch?: boolean;
  searchPlaceholder?: string;
  width?: string;
  className?: string;
  'data-testid'?: string;
  forceDirection?: 'up' | 'down';
  'data-demo-desc'?: string;
}

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  withSearch = false,
  searchPlaceholder = 'Search options...',
  width = 'w-full',
  className = '',
  'data-testid': testId,
  forceDirection,
  'data-demo-desc': dataDemoDesc,
}: SelectDropdownProps) {
  
const [searchValue, setSearchValue] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    if (!searchValue) return true;
    if (typeof opt.label === 'string') {
      return opt.label.toLowerCase().includes(searchValue.toLowerCase());
    }
    return opt.value.toLowerCase().includes(searchValue.toLowerCase());
  });

  const trigger = (
    <div className={`flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors ${width} ${className}`}>
      <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
      <svg className="w-4 h-4 ml-2 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <Dropdown
      trigger={trigger}
      withSearch={withSearch}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder={searchPlaceholder}
      width={width}
      data-testid={testId}
      forceDirection={forceDirection}
      data-demo-desc={dataDemoDesc}
    >
      {filteredOptions.length > 0 ? (
        filteredOptions.map((opt) => (
          <div
            key={opt.value}
            onClick={() => {
              onChange(opt.value);
              setSearchValue(''); // Reset search on select
            }}
            className={`px-3 py-2 text-sm cursor-pointer rounded transition-colors ${
              opt.value === value
                ? 'bg-amber-500/20 text-amber-500 font-medium'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
            data-testid={testId ? `${testId}-option-${opt.value}` : undefined}
          >
            {opt.label}
          </div>
        ))
      ) : (
        <div className="p-3 text-sm text-zinc-500 text-center">No options found.</div>
      )}
    </Dropdown>
  );
}
