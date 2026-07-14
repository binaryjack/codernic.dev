import React, { useEffect } from 'react';
import './toast.css';

export type ToastLevel = 'info' | 'success' | 'error';

export interface ToastProps {
  id?: string;
  level: ToastLevel;
  message: string;
  duration?: number; // Duration in ms before auto-close
  onClose: () => void;
  className?: string;
}

const levelColors: Record<ToastLevel, string> = {
  info: 'border-blue-500 bg-blue-500/10 text-blue-200',
  success: 'border-green-500 bg-green-500/10 text-green-200',
  error: 'border-red-500 bg-red-500/10 text-red-200',
};

const barColors: Record<ToastLevel, string> = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

export function Toast({ level, message, duration = 4000, onClose, className = '' }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`ai-toast relative overflow-hidden mb-2 rounded shadow-lg border p-3 w-72 backdrop-blur-sm transition-all duration-300 transform translate-y-0 opacity-100 ${levelColors[level]} ${className}`}>
      <div className="flex justify-between items-start">
        <p className="text-sm">{message}</p>
        <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Close toast">&times;</button>
      </div>
      {duration > 0 && (
        <div 
          className={`absolute bottom-0 left-0 h-1 ${barColors[level]}`} 
          style={{ width: '100%', animation: `ai-toast-shrink ${duration}ms linear forwards` }} 
        />
      )}
    </div>
  );
}
