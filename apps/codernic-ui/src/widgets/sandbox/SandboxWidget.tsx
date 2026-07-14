import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSandboxMode, setSandboxMode } from '../../entities/app/model/app-slice';

export function SandboxWidget() {
  const dispatch = useDispatch();
  const sandboxMode = useSelector(selectSandboxMode);

  return (
    <div className="flex flex-col p-6 h-full w-full bg-zinc-950 border border-amber-500/20 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0"></div>
      
      <h2 className="text-xl font-bold text-zinc-100 mb-4 flex items-center gap-2">
        <span className="text-amber-500 filter drop-shadow-md">🛡️</span> 
        Sandbox Control
      </h2>
      
      <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
        Toggle the global sandbox mode. When active, all destructive actions, layout overlays, and sequencer popups are strictly disabled for safety during autonomous execution.
      </p>
      
      <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
        <span className="text-sm font-medium text-zinc-200">
          Enforce Sandbox Constraints
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={sandboxMode} 
            onChange={(e) => dispatch(setSandboxMode(e.target.checked))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
        </label>
      </div>
      
      {sandboxMode && (
        <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-in fade-in zoom-in duration-300">
          <p className="text-xs text-amber-400 font-medium text-center">
            ⚠️ Execution is currently restricted.
          </p>
        </div>
      )}
    </div>
  );
}
