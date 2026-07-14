import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import logoUrl from '../../../assets/ai-agencee-logo-dark.svg';

export function AgnosticModalProvider() {
  const modalState = useSelector((state: RootState) => state.modal);
  const [inputValue, setInputValue] = useState('');

  // Reset input value when a new prompt opens
  React.useEffect(() => {
    if (modalState.config?.type === 'prompt') {
      setInputValue('');
    }
  }, [modalState.config?.type]);

  if (!modalState.isOpen || !modalState.config) {
    return null;
  }

  const { config, deferred } = modalState;

  const handleResolve = (result: any) => {
    if (deferred?.resolve) {
      deferred.resolve(result);
    }
  };

  const handleCancel = () => {
    if (deferred?.resolve) {
      deferred.resolve(false);
    }
  };

  if (config.type === 'spinner') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
        <div className="flex flex-col items-center">
          <img 
            src={logoUrl} 
            alt="Codernic Loading" 
            className="w-24 h-24 animate-pulse"
            style={{ filter: 'drop-shadow(0 0 15px theme("colors.codernic.amber.500"))' }}
          />
          {config.title && (
            <div className="mt-4 text-white text-lg font-medium">{config.title}</div>
          )}
          <div className="mt-4 flex space-x-1 items-center">
            <div className="w-2 h-2 rounded-full bg-codernic-amber-500 animate-[bounce_1s_infinite_-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-codernic-amber-500 animate-[bounce_1s_infinite_-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-codernic-amber-500 animate-[bounce_1s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-white mb-2">{config.title}</h2>
        
        {config.message && (
          <p className="text-zinc-400 mb-6">{config.message}</p>
        )}

        {config.type === 'prompt' && (
          <div className="mb-6">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500/50"
              placeholder="Enter value..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleResolve(inputValue);
                if (e.key === 'Escape') handleCancel();
              }}
            />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          {config.type !== 'alert' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              {config.cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={() => handleResolve(config.type === 'prompt' ? inputValue : true)}
            className="px-4 py-2 rounded bg-amber-600 text-white hover:bg-amber-500 transition-colors font-medium"
          >
            {config.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
