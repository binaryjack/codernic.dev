import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SearchInput } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

interface WidgetSearchInputProps {
  widgetId?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dataTestId?: string;
}

export function WidgetSearchInput({ dataTestId, widgetId, value, onChange, placeholder = "Search..." }: WidgetSearchInputProps) {
  const { rootId, getTestId } = useTestId('widget-search-input', dataTestId);
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (widgetId && typeof document !== 'undefined') {
      setTargetNode(document.getElementById(`search-portal-placeholder-${widgetId}`));
    }
  }, [widgetId]);

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const input = e.currentTarget.querySelector('input');
    if (input) input.focus();
  };

  const searchInput = (
    <SearchInput 
      data-testid={rootId}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isFocused={isFocused}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClickWrapper={handleWrapperClick}
    />
  );

  if (targetNode) {
    return createPortal(searchInput, targetNode);
  }

  return searchInput;
}
