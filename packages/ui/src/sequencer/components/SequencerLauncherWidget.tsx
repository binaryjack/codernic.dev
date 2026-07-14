import React from 'react';
import { useSequencer } from './SequencerProvider';
import { SequenceConfig } from '../core/StateMachine';
import { Button } from '../../atoms/button';
import { useTestId } from '../../hooks/useTestId';

export interface SequencerLauncherWidgetProps {
  sequences: SequenceConfig[];
  onDismiss?: () => void;
  dataTestId?: string;
}

export function SequencerLauncherWidget({ dataTestId, sequences, onDismiss }: SequencerLauncherWidgetProps) {
  
  const { rootId, getTestId } = useTestId('sequencer-launcher-widget', dataTestId);
const { machine } = useSequencer();

  const handleLaunch = (config: SequenceConfig) => {
    machine.load(config);
    machine.start();
    if (onDismiss) onDismiss();
  };

  return (
    <div className="flex flex-col items-center justify-center pt-12 pb-10 w-full max-w-5xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700 relative z-10">
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
        <span className="text-3xl filter drop-shadow-lg">🎬</span>
      </div>
      
      <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">Interactive Demos</h2>
      <p className="text-zinc-400 max-w-lg text-center text-sm mb-12 leading-relaxed">
        Experience the power of autonomous AI engineering. Select a guided tour below to see how our agents work in real-time.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4">
        {sequences.map(seq => {
          // Pretty print the ID
          const title = seq.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return (
            <div 
              key={seq.id} 
              data-testid={`demo-card-${seq.id}`}
              className="flex flex-col p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-800/60 hover:border-zinc-700/80 transition-all duration-300 backdrop-blur-md group cursor-pointer relative overflow-hidden" 
              onClick={() => handleLaunch(seq)}
            >
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                    <span className="text-amber-400 text-lg">✨</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Guided Tour
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-zinc-100 mb-2">{title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-8 flex-grow">
                  Step-by-step interactive simulation demonstrating core capabilities, UI interactions, and autonomous behaviors.
                </p>
                
                <Button data-testid={getTestId('button')} 
                  variant="primary"
                  onClick={(e) => { e.stopPropagation(); handleLaunch(seq); }}
                  className="w-full !py-2.5 !text-xs !font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                >
                  Launch Demo
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {onDismiss && (
        <div className="mt-12">
          <Button data-testid={getTestId('button')} 
            variant="secondary"
            onClick={onDismiss}
            className="!px-6 !py-2 !text-xs text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-zinc-700/50"
          >
            Skip to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
