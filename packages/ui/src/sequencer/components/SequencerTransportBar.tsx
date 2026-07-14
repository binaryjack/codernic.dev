import React from 'react';
import { useSequencer } from './SequencerProvider';

export function SequencerTransportBar() {
  const { machine, status, isAutoPlay, currentStep } = useSequencer();

  if (status === 'IDLE' || status === 'COMPLETED' || !currentStep) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] pointer-events-auto">
      <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-900/90 backdrop-blur border border-zinc-700/50 shadow-2xl">
        <button
          onClick={() => status === 'RUNNING' ? machine.pause() : machine.resume()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          title={status === 'RUNNING' ? 'Pause Sequence' : 'Resume Sequence'}
        >
          {status === 'RUNNING' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <button
          onClick={() => machine.toggleAutoPlay()}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
            isAutoPlay 
              ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
          title="Toggle Auto-Play"
        >
          {isAutoPlay ? 'Auto-Play ON' : 'Auto-Play OFF'}
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <button
          onClick={() => machine.stop()}
          className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          title="Exit Demo"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
