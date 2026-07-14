import { StepAction } from './StateMachine';

export type LogLevel = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export interface SequencerLogEntry {
  level: LogLevel;
  stepId: string;
  message: string;
  timestamp: number;
}

export class SequencerLogger {
  private static _report: SequencerLogEntry[] = [];

  /** Returns the full accumulated log report. */
  static getReport(): SequencerLogEntry[] {
    return SequencerLogger._report;
  }

  /** Returns a structured summary: counts by level and all non-INFO entries. */
  static getSummary() {
    const counts = { CRITICAL: 0, ERROR: 0, WARNING: 0, INFO: 0 };
    for (const entry of SequencerLogger._report) {
      counts[entry.level]++;
    }
    const issues = SequencerLogger._report.filter(e => e.level !== 'INFO');
    return { counts, issues, passed: counts.CRITICAL === 0 && counts.ERROR === 0 };
  }

  /** Clears the in-memory report. Call before starting a new demo run. */
  static clearReport() {
    SequencerLogger._report = [];
    if (typeof window !== 'undefined') {
      (window as any).__sequencerReport = SequencerLogger._report;
    }
  }

  private static _record(level: LogLevel, stepId: string, message: string) {
    const entry: SequencerLogEntry = { level, stepId, message, timestamp: Date.now() };
    SequencerLogger._report.push(entry);
    // Keep the window reference live so Playwright can read it any time
    if (typeof window !== 'undefined') {
      if (!(window as any).__sequencerReport) {
        (window as any).__sequencerReport = SequencerLogger._report;
      }
    }
    
    // Asynchronous non-intrusive telemetry injection
    Promise.resolve().then(() => {
      // Future analytics reporting could be securely attached here
    }).catch(() => {});
  }

  static critical(step: StepAction | null, message: string) {
    const stepId = step ? (step as any).id || step.action : 'unknown';
    console.error(`%c[SEQUENCER CRITICAL ERROR] [Step: ${stepId}] ${message}`, 'color: #ff4444; font-weight: bold; font-size: 14px;');
    SequencerLogger._record('CRITICAL', stepId, message);
    
    // Optionally fire toast
    window.dispatchEvent(new CustomEvent('codernic:toast', {
      detail: { 
        title: 'Sequencer Critical Error', 
        description: `[Step: ${stepId}] ${message}`, 
        type: 'error' 
      }
    }));
  }

  static error(step: StepAction | null, message: string) {
    const stepId = step ? (step as any).id || step.action : 'unknown';
    console.error(`%c[SEQUENCER ERROR] [Step: ${stepId}] ${message}`, 'color: #ff8800; font-weight: bold; font-size: 13px;');
    SequencerLogger._record('ERROR', stepId, message);
    
    window.dispatchEvent(new CustomEvent('codernic:toast', {
      detail: { 
        title: 'Sequencer Error', 
        description: `[Step: ${stepId}] ${message}`, 
        type: 'error' 
      }
    }));
  }

  static warning(step: StepAction | null, message: string) {
    const stepId = step ? (step as any).id || step.action : 'unknown';
    console.warn(`%c[SEQUENCER WARNING] [Step: ${stepId}] ${message}`, 'color: #ffcc00; font-weight: bold;');
    SequencerLogger._record('WARNING', stepId, message);
  }

  static info(step: StepAction | null, message: string) {
    const stepId = step ? (step as any).id || step.action : 'unknown';
    console.info(`%c[SEQUENCER INFO] [Step: ${stepId}] ${message}`, 'color: #44aaff;');
    SequencerLogger._record('INFO', stepId, message);
  }
}

