import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { BaseInput } from '../atoms/base-input';

export interface DropdownProps {
  /** The element that toggles the dropdown */
  trigger: ReactNode;
  /** The content of the dropdown */
  children: ReactNode;
  /** Whether to show a search input at the top of the dropdown */
  withSearch?: boolean;
  /** Value for the search input */
  searchValue?: string;
  /** Callback when search input changes */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Default width of the dropdown content */
  width?: string;
  /** Additional classes for the dropdown content wrapper */
  contentClassName?: string;
  /** Playwright testing ID */
  'data-testid'?: string;
  /** Force the dropdown to open upwards or downwards */
  forceDirection?: 'up' | 'down';
  /** Demo description for sequencer */
  'data-demo-desc'?: string;
}

export function Dropdown({
  trigger,
  children,
  withSearch,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  width = 'w-64',
  contentClassName = '',
  'data-testid': testId,
  forceDirection,
  'data-demo-desc': dataDemoDesc,
}: DropdownProps) {
  
const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const [align, setAlign] = useState<'left' | 'right'>('left');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Smart positioning logic
  useEffect(() => {
    if (isOpen && containerRef.current && contentRef.current) {
      if (forceDirection) {
        setDirection(forceDirection);
      } else {
        const containerRect = containerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // Vertical positioning
        const spaceBelow = windowHeight - containerRect.bottom;
        const spaceAbove = containerRect.top;
        
        // If there's not enough space below AND there's more space above, flip it up
        if (spaceBelow < contentRect.height + 10 && spaceAbove > spaceBelow) {
          setDirection('up');
        } else {
          setDirection('down');
        }
      }
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      
      // Horizontal positioning
      const spaceRight = windowWidth - containerRect.left;
      
      // If it would overflow the right edge, align it to the right of the trigger
      if (spaceRight < contentRect.width + 10) {
        setAlign('right');
      } else {
        setAlign('left');
      }
    }
  }, [isOpen, children, forceDirection]); // Re-calculate if children change while open

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const verticalClass = direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2';
  const horizontalClass = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div 
      className="relative inline-block" 
      ref={containerRef}
      data-testid={testId}
      data-demo-desc={dataDemoDesc}
    >
      {/* Trigger */}
      <div 
        onClick={toggleDropdown} 
        className="cursor-pointer inline-block"
        data-testid={testId ? `${testId}-trigger` : undefined}
      >
        {trigger}
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          ref={contentRef}
          className={`absolute z-[9999] ${width} bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[60vh] ${verticalClass} ${horizontalClass} ${contentClassName}`}
          data-testid={testId ? `${testId}-content` : undefined}
        >
          {withSearch && (
            <div className="p-2 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10 flex-shrink-0">
              <BaseInput
                value={searchValue || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-sm bg-zinc-950/50"
                autoFocus
                data-testid={testId ? `${testId}-search` : undefined}
              />
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
