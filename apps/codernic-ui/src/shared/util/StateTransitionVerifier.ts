export class StateTransitionVerifier {
  /**
   * Deterministic mathematical validation of state transition: S(t+1) = f(S_t, C).
   * Validates if a state mutation is legal according to strict finite state machine boundaries.
   */
  static verify<S>(
    prevState: S,
    nextState: S,
    transitionName: string,
    predicate: (prev: S, next: S) => boolean | { valid: boolean; reason?: string }
  ): void {
    const result = predicate(prevState, nextState);
    const isValid = typeof result === 'boolean' ? result : result.valid;
    
    if (!isValid) {
      const reason = typeof result === 'object' && result.reason ? result.reason : 'Illegal state transition boundary violation';
      console.error(`[StateTransitionVerifier] SECURITY FAULT in ${transitionName}: ${reason}`, {
        S_t: prevState,
        S_t_plus_1: nextState
      });
      // Throw error to strictly block the Redux reducer execution, preventing corruption of the state machine
      throw new Error(`[StateTransitionVerifier] ${transitionName}: ${reason}`);
    }
  }
}
