import { addNotificationRequest } from '../../../entities/notifications/model/notifications-slice';
import { appendMessage } from './chat.slice';
import workflowRules from '../config/chat-workflow.rules.json';

export interface ValidationContext {
  command: string;
  mode: string;
  isPlanFrozen: boolean;
}

export interface ValidationResult {
  allowed: boolean;
  message?: string;
  vector?: string[];
}

// ── Vector Strategies (Strategy Pattern) ──
export interface VectorStrategy {
  supports(type: string): boolean;
  output(message: string, dispatch: any): void;
}

class ToastStrategy implements VectorStrategy {
  public supports(type: string) { return type === 'toast'; }
  public output(message: string, dispatch: any) {
    dispatch(addNotificationRequest({ message, level: 'warning' }));
  }
}

class LogStrategy implements VectorStrategy {
  public supports(type: string) { return type === 'log'; }
  public output(message: string) {
    console.warn(`[WorkflowEngine] Command Blocked: ${message}`);
  }
}

class ChatFeedStrategy implements VectorStrategy {
  public supports(type: string) { return type === 'chat-feed'; }
  public output(message: string, dispatch: any) {
    dispatch(appendMessage({
      id: `sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      role: 'system',
      text: message
    }));
  }
}

// ── Validation Links (Chain of Responsibility) ──
export interface Handler {
  setNext(handler: Handler): Handler;
  handle(context: ValidationContext): ValidationResult;
}

abstract class BaseHandler implements Handler {
  private nextHandler?: Handler;

  public setNext(handler: Handler): Handler {
    this.nextHandler = handler;
    return handler;
  }

  public handle(context: ValidationContext): ValidationResult {
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
    return { allowed: true };
  }
}

class ModeRulesHandler extends BaseHandler {
  public handle(context: ValidationContext): ValidationResult {
    const { command, mode, isPlanFrozen } = context;
    const modeConfig = (workflowRules.modes as any)[mode];
    if (!modeConfig) return super.handle(context);

    // If plan mode, check sub-state refinement vs frozen
    let rules = modeConfig;
    if (mode === 'plan') {
      rules = isPlanFrozen ? modeConfig.frozen : modeConfig.refinement;
    }

    const cmdRule = rules.commands?.[command];
    if (cmdRule) {
      if (cmdRule.invokable === false) {
        return {
          allowed: false,
          message: cmdRule.onBlocked?.message || `Command ${command} is not allowed in current state.`,
          vector: cmdRule.onBlocked?.vector || ['toast']
        };
      }
    }

    return super.handle(context);
  }
}

// ── Workflow Engine Facade ──
export class WorkflowEngine {
  private static chain: Handler = new ModeRulesHandler();
  private static strategies: VectorStrategy[] = [
    new ToastStrategy(),
    new LogStrategy(),
    new ChatFeedStrategy()
  ];

  public static validateCommand(context: ValidationContext): ValidationResult {
    return this.chain.handle(context);
  }

  public static executeBlockedVectors(result: ValidationResult, dispatch: any) {
    if (result.allowed || !result.message) return;
    const vectors = result.vector || ['toast'];
    vectors.forEach(v => {
      const strategy = this.strategies.find(s => s.supports(v));
      if (strategy) {
        strategy.output(result.message!, dispatch);
      }
    });
  }

  public static isElementVisible(elementId: string, mode: string, isPlanFrozen: boolean): boolean {
    const modeConfig = (workflowRules.modes as any)[mode];
    if (!modeConfig) return true;

    let rules = modeConfig;
    if (mode === 'plan') {
      rules = isPlanFrozen ? modeConfig.frozen : modeConfig.refinement;
    }

    const elementRule = rules.elements?.[elementId];
    if (elementRule && elementRule.visible !== undefined) {
      return elementRule.visible;
    }
    return true;
  }
}
