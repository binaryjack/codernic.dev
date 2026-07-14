import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { SequencerStateMachine, StateStatus, StepAction, SequenceConfig } from '../core/StateMachine';
import { ActionChain } from '../core/ActionChain';
import { useTestId } from '../../hooks/useTestId';

interface SequencerContextValue {
  machine: SequencerStateMachine;
  chain: ActionChain;
  currentStep: StepAction | null;
  status: StateStatus;
  isAutoPlay: boolean;
}

const SequencerContext = createContext<SequencerContextValue | null>(null);

export const useSequencer = () => {
  const context = useContext(SequencerContext);
  if (!context) throw new Error('useSequencer must be used within SequencerProvider');
  return context;
};

interface SequencerProviderProps {
  children: React.ReactNode;
  config?: SequenceConfig;
  dataTestId?: string;
  onDispatch?: (action: any) => void;
}

export function SequencerProvider({ dataTestId, children, config, onDispatch }: SequencerProviderProps) {
  
  const { rootId, getTestId } = useTestId('sequencer-provider', dataTestId);
const machine = useMemo(() => new SequencerStateMachine(), []);
  const chain = useMemo(() => new ActionChain(), []);
  
  const [currentStep, setCurrentStep] = useState<StepAction | null>(null);
  const [status, setStatus] = useState<StateStatus>('IDLE');
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  useEffect(() => {
    if (onDispatch) {
      chain.setDispatchHandler(onDispatch);
    }
  }, [chain, onDispatch]);

  useEffect(() => {
    const unsubscribe = machine.subscribe((_, newStatus) => {
      setStatus(newStatus);
      setCurrentStep(machine.getCurrentStep());
      setIsAutoPlay(machine.getIsAutoPlay());
    });
    
    if (config) {
      machine.load(config);
    }
    
    return unsubscribe;
  }, [machine, config]);

  // Expose to window for debugging and easy triggering
  useEffect(() => {
    (window as any).__sequencer = machine;
    return () => {
      delete (window as any).__sequencer;
    };
  }, [machine]);

  return (
    <SequencerContext.Provider data-testid={`${rootId}-sequencer-context.provider`} value={{ machine, chain, currentStep, status, isAutoPlay }}>
      {children}
    </SequencerContext.Provider>
  );
}
