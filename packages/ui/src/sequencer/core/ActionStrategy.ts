import { StepAction } from './StateMachine';
import { DOMWaiter } from '../../introspection/core/DOMWaiter';
import { getIntrospectionRegistry } from '../../introspection/core/IntrospectionRegistry';

import { SequencerLogger } from './SequencerLogger';

export interface ActionStrategyResult {
  // Can contain side-effects cleanup or return status
  cleanup?: () => void;
}

export interface ActionStrategy {
  canHandle(actionType: string): boolean;
  execute(step: StepAction, element: HTMLElement | null): Promise<ActionStrategyResult>;
}

export class HighlightStrategy implements ActionStrategy {
  canHandle(actionType: string): boolean {
    return actionType === 'highlight' || actionType === 'focusOn';
  }

  async execute(step: StepAction, element: HTMLElement | null): Promise<ActionStrategyResult> {
    if (!element) return {};
    
    // Smoothly scroll to the element if it's not fully visible
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // A CSS class will handle the actual visual highlighting
    element.classList.add('sequencer-highlighted-element');

    // Warning: Widget is empty and no data were provided
    // Check if element has virtually no inner content and no visible children
    const textContent = (element.textContent || '').trim();
    if (element.children.length === 0 && textContent.length === 0) {
      SequencerLogger.warning(step, `Highlighted widget [${Array.isArray(step.target) ? step.target.join(', ') : step.target}] is entirely empty.`);
    }

    // Execute Assertions if present with a retry loop
    if (step.asserts) {
      let failed = false;
      let errors: string[] = [];
      let warnings: string[] = [];
      
      const maxRetries = 10;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        failed = false;
        errors = [];
        warnings = [];
        const content = element.textContent || '';

        if (step.asserts.text) {
          for (const t of step.asserts.text) {
            if (!content.includes(t)) {
              failed = true;
              errors.push(`Missing expected text: "${t}"`);
            }
          }
        }

        if (step.asserts.selector) {
          for (const s of step.asserts.selector) {
            if (!element.querySelector(s)) {
              failed = true;
              errors.push(`Missing expected child element selector: "${s}"`);
            } else {
               // Checking if child elements are rendered but might be buggy/empty
               const child = element.querySelector(s) as HTMLElement;
               if (child.children.length === 0 && (child.textContent || '').trim() === '') {
                 warnings.push(`Child element "${s}" is present but empty. Possible bug?`);
               }
            }
          }
        }

        if (!failed) break; // Assertions passed
        
        // Wait and retry
        await new Promise(r => setTimeout(r, 300));
      }

      if (warnings.length > 0) {
        SequencerLogger.warning(step, `Warnings during verification: ${warnings.join(' | ')}`);
      }

      if (failed) {
        SequencerLogger.error(step, `UI Verification Failed for target [${step.target}]. Reasons: ${errors.join(', ')}`);
        step.content = `❌ VERIFICATION FAILED: ${errors.join(', ')}\n\n` + (step.content || '');
      } else {
        SequencerLogger.info(step, `UI Verification Passed for target [${step.target}].`);
      }
    }
    
    return {
      cleanup: () => {
        element.classList.remove('sequencer-highlighted-element');
      }
    };
  }
}

export class TypewriterStrategy implements ActionStrategy {
  canHandle(actionType: string): boolean {
    return actionType === 'typewriter';
  }

  async execute(step: StepAction, element: HTMLElement | null): Promise<ActionStrategyResult> {
    if (!element) return {};
    
    const textToType = step.payload as string || '';
    
    // Use the robust DOMWaiter typing simulation
    await DOMWaiter.simulateType(element, textToType);
    
    return {};
  }
}

export class ClickStrategy implements ActionStrategy {
  canHandle(actionType: string): boolean {
    return actionType === 'click';
  }

  async execute(step: StepAction, element: HTMLElement | null): Promise<ActionStrategyResult> {
    if (!element) return {};
    
    // Small delay to allow user to see what is about to be clicked
    await new Promise(r => setTimeout(r, 500));
    
    // Use robust DOMWaiter click simulation (handles mouse down/up/click + scrolling)
    await DOMWaiter.simulateClick(element);
    
    return {};
  }
}

export class IntrospectionStrategy implements ActionStrategy {
  canHandle(actionType: string): boolean {
    return actionType === 'introspection';
  }

  async execute(step: StepAction, element: HTMLElement | null): Promise<ActionStrategyResult> {
    const registry = getIntrospectionRegistry();
    const targetString = Array.isArray(step.target) ? step.target[0] : step.target;
    const widget = registry.get(targetString);
    
    if (!widget) {
      SequencerLogger.error(step, `No registered introspection schema found for target: ${targetString}`);
      return {};
    }

    const { method, args = [] } = step.payload || {};
    
    if (!method || typeof widget.methods[method] !== 'function') {
      SequencerLogger.error(step, `Method "${method}" not found on widget schema for target: ${targetString}`);
      return {};
    }

    // Small interaction delay to make it visible
    await new Promise(r => setTimeout(r, 500));
    
    SequencerLogger.info(step, `Executing ${method} on ${targetString}`);
    await widget.methods[method](...args);

    return {};
  }
}

export class GoToPageStrategy implements ActionStrategy {
  canHandle(actionType: string): boolean {
    return actionType === 'goToPage';
  }

  async execute(step: StepAction, _element: HTMLElement | null): Promise<ActionStrategyResult> {
    const layout = step.payload || step.target;
    if (!layout) {
      SequencerLogger.error(step, 'GoToPageStrategy missing payload or target layout name.');
      return {};
    }
    
    SequencerLogger.info(step, `Switching layout to [${layout}]...`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('codernic:switch-layout', { detail: { layout } }));
    }
    
    // Give layout engine a short delay to load the new views/blocks
    await new Promise(r => setTimeout(r, 800));
    return {};
  }
}

export class InjectDataStrategy implements ActionStrategy {
  private dispatchHandler?: (action: any) => void;

  constructor(handler?: (action: any) => void) {
    this.dispatchHandler = handler;
  }

  public setHandler(handler: (action: any) => void) {
    this.dispatchHandler = handler;
  }

  canHandle(actionType: string): boolean {
    return actionType === 'injectData';
  }

  async execute(step: StepAction, _element: HTMLElement | null): Promise<ActionStrategyResult> {
    if (!this.dispatchHandler) {
      SequencerLogger.error(step, 'InjectDataStrategy cannot execute: No onDispatch handler was provided.');
      return {};
    }

    const widget = step.target;
    const payload = step.payload;

    SequencerLogger.info(step, `Injecting data into widget [${widget}]...`);
    
    // Dispatch action to the reserved channel
    this.dispatchHandler({
      type: 'sequencer/executeStep',
      payload: {
        widget,
        data: payload
      }
    });

    return {};
  }
}
