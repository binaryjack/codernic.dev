import type { SequenceConfig } from '../core/StateMachine';
import { PageStrategy } from './pages/PageStrategy';

export class DemoEngine {
  private strategies: PageStrategy[] = [];
  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Appends a page strategy to the end of the demo pipeline.
   */
  addPage(strategy: PageStrategy) {
    this.strategies.push(strategy);
    return this; // For chaining
  }

  /**
   * Compiles the dynamic SequenceConfig by stitching all strategies together.
   */
  build(): SequenceConfig {
    if (this.strategies.length === 0) {
      throw new Error("DemoEngine: No strategies added.");
    }

    const config: SequenceConfig = {
      id: this.id,
      name: this.name,
      initial: this.strategies[0].getEntryKey(),
      states: {}
    };

    for (let i = 0; i < this.strategies.length; i++) {
      const currentStrategy = this.strategies[i];
      const nextStrategy = this.strategies[i + 1];

      const sequence = currentStrategy.getSequence();
      
      // Merge states
      Object.assign(config.states, sequence);

      // Patch the last step of this sequence to point to the next strategy's entry
      if (nextStrategy) {
        // Find the step in this sequence that has no 'next'
        const leafKeys = Object.keys(sequence).filter(key => !sequence[key].next);
        if (leafKeys.length === 1) {
          sequence[leafKeys[0]].next = nextStrategy.getEntryKey();
        } else if (leafKeys.length > 1) {
          console.warn(`DemoEngine: Found multiple leaf nodes in strategy ${currentStrategy.constructor.name}. Auto-linking might fail.`);
        }
      }
    }

    return config;
  }
}
