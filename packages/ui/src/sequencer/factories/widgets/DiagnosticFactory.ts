import { createDagState } from '@binaryjack/state-factories';

export class DiagnosticFactory {
  static createMockAnalysis() {
    return {
      symbolsParsed: 1542,
      score: 98.5,
      checks: [
        { name: "Clean Architecture", passed: true },
        { name: "Low Complexity", passed: true },
        { name: "No Memory Leaks", passed: true }
      ]
    };
  }

  static createDispatchAction() {
    const state = createDagState({
      pirsigMetrics: {
        symbols_count: 1542,
        kpi_score: 98.5,
        qualitative_flags: [
          "Clean Architecture",
          "Low Complexity",
          "No Memory Leaks",
          "Security Warning: Hardcoded Cryptographic Key",
          "Ast Auditing Error: File Mismatch",
          "Performance Bad Allocation Ratio"
        ]
      }
    });

    return {
      type: 'dag/setPirsigMetrics',
      payload: state.pirsigMetrics
    };
  }
}
