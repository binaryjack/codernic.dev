import React, { useState, useEffect } from 'react';

export interface BannerProps {
  id: string; // Used for localStorage key of "do not show again" preference
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  dismissible?: boolean;
  allowDoNotShowAgain?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({
  id,
  message,
  type = 'info',
  dismissible = true,
  allowDoNotShowAgain = true,
  onDismiss,
  className = ''
}: BannerProps) {
  const storageKey = `codernic_banner_dismissed_${id}`;
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(storageKey) === 'true';
      setVisible(!isDismissed);
    }
  }, [storageKey]);

  if (!visible) return null;

  const handleDismiss = (permanent: boolean) => {
    if (permanent && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const typeStyles = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
  }[type];

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b text-xs font-medium backdrop-blur-sm transition-all duration-300 ${typeStyles} ${className}`}>
      <div className="flex items-center gap-2">
        <span>{type === 'warning' ? '⚠️' : type === 'error' ? '🚫' : type === 'success' ? '✅' : 'ℹ️'}</span>
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-3">
        {allowDoNotShowAgain && (
          <label className="flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 select-none">
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            <span className="text-[10px]">Don't show again</span>
          </label>
        )}
        {dismissible && (
          <button 
            onClick={() => handleDismiss(dontShowAgain)}
            className="hover:text-white font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded border border-current/30 hover:bg-white/5 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
