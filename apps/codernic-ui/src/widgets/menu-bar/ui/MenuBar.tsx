import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { sendIntent } from '../../../entities/kernel';
import { AboutModal } from './AboutModal';

export interface IMenuBarProps {
  title: string;
  onToggleLeft?: () => void;
  onOpenLeft?: () => void;
  onToggleRight?: () => void;
  onNewSession?: () => void;
}

export function MenuBar({ title, onToggleLeft, onOpenLeft, onToggleRight, onNewSession }: IMenuBarProps) {
  const dispatch = useDispatch();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const executeAction = (action: () => void) => {
    setActiveMenu(null);
    action();
  };

  type MenuItem = { label: string; action: () => void; disabled?: boolean };

  const Menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Session', action: () => onNewSession && onNewSession() },
      { label: 'Recent Sessions', action: () => onOpenLeft && onOpenLeft() },
      { label: 'Export Session', action: () => dispatch(sendIntent({ type: 'codernic:export-session' })) },
      { label: 'Refresh', action: () => window.location.reload() },
    ],
    View: [
      { label: 'Toggle Left Panel', action: () => onToggleLeft && onToggleLeft() },
      { label: 'Toggle Right Panel', action: () => onToggleRight && onToggleRight() },
    ],
    Agent: [
      { label: 'Stop current Run', action: () => dispatch(sendIntent({ type: 'codernic:stop-run' })) },
      { label: 'Clear Introspection', action: () => dispatch(sendIntent({ type: 'codernic:clear-introspection' })) },
    ],
    Help: [
      { label: 'Documentation', action: () => window.open('https://codernic.dev', '_blank') },
      { label: 'About', action: () => setIsAboutOpen(true) },
    ],
  };

  return (
    <>
      <div className="flex items-center px-3 py-1 bg-[#09090b] border-b border-[#27272a] text-[var(--vscode-foreground)] text-xs select-none relative z-50">
        <div className="flex-shrink-0 flex items-center space-x-4">
          <span className="font-bold text-[13px] text-cyan-400 mr-4 tracking-tight drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
            {title}
          </span>
          
          <div className="flex items-center space-x-1" ref={menuRef}>
            {Object.entries(Menus).map(([key, items]) => (
              <div key={key} className="relative">
                <div 
                  className={`px-2 py-1 cursor-pointer rounded transition-colors ${activeMenu === key ? 'bg-[#27272a] text-cyan-400' : 'hover:bg-[#18181b]'}`}
                  onClick={() => handleMenuClick(key)}
                >
                  {key}
                </div>
                {activeMenu === key && (
                  <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-[#18181b] border border-[#27272a] shadow-2xl rounded-md py-1 flex flex-col z-50">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`px-4 py-1.5 cursor-pointer ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#27272a] hover:text-cyan-400'}`}
                        onClick={() => !item.disabled && executeAction(item.action)}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
