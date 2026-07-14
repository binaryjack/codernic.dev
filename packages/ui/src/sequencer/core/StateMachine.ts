import { SequencerLogger } from './SequencerLogger';

export type StateStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR';

export type ActionType = 'highlight' | 'typewriter' | 'simulate_chat' | 'click' | 'dispatch' | string;

export interface StepAsserts {
  text?: string[]; // Array of strings that MUST be present in the element's textContent
  selector?: string[]; // Array of CSS selectors that MUST be found inside the element
}

export interface StepAction {
  id?: string; // Assigned dynamically by the loader
  target: string | string[]; // data-testid(s) or selector(s)
  action: ActionType;
  content?: string; // Text for tooltip
  payload?: any; // Additional data for action (e.g. text to type)
  next?: string; // Next state key, omit to end sequence
  autoAdvance?: boolean; // If true, automatically advances to 'next' state when action completes
  asserts?: StepAsserts; // Assertions to verify the UI rendered correctly
}

export interface SequenceConfig {
  id: string;
  name?: string;
  initial: string;
  states: Record<string, StepAction>;
}

export class SequencerStateMachine {
  private config: SequenceConfig | null = null;
  private currentStateKey: string | null = null;
  private status: StateStatus = 'IDLE';
  private autoPlay: boolean = false;
  private listeners: Array<(stateKey: string | null, status: StateStatus) => void> = [];

  constructor() {}

  public load(config: SequenceConfig) {
    this.config = config;
    
    // Auto-assign the key as the ID for each step if not provided
    if (this.config && this.config.states) {
      Object.entries(this.config.states).forEach(([key, step]) => {
        (step as any).id = key;
      });
    }

    this.currentStateKey = config.initial;
    this.status = 'IDLE';
    this.notify();
  }

  public start() {
    if (this.config && this.currentStateKey) {
      SequencerLogger.clearReport();
      this.status = 'RUNNING';
      this.notify();
    }
  }

  public next() {
    if (!this.config || !this.currentStateKey || this.status !== 'RUNNING') return;
    
    const currentState = this.config.states[this.currentStateKey];
    if (currentState && currentState.next && this.config.states[currentState.next]) {
      this.currentStateKey = currentState.next;
    } else {
      this.status = 'COMPLETED';
    }
    this.notify();
  }

  public pause() {
    if (this.status === 'RUNNING') {
      this.status = 'PAUSED';
      this.notify();
    }
  }
  
  public resume() {
    if (this.status === 'PAUSED' && this.config && this.currentStateKey) {
      this.status = 'RUNNING';
      this.notify();
    }
  }

  public stop() {
    this.status = 'COMPLETED';
    this.currentStateKey = null;
    this.notify();
  }

  public getCurrentStep(): StepAction | null {
    if (!this.config || !this.currentStateKey) return null;
    return this.config.states[this.currentStateKey] || null;
  }

  public getStatus(): StateStatus {
    return this.status;
  }

  public getIsAutoPlay(): boolean {
    return this.autoPlay;
  }

  public toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    this.notify();
  }

  public setAutoPlay(val: boolean) {
    if (this.autoPlay !== val) {
      this.autoPlay = val;
      this.notify();
    }
  }

  public subscribe(listener: (stateKey: string | null, status: StateStatus) => void) {
    this.listeners.push(listener);
    // return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentStateKey, this.status);
    }
  }
}
