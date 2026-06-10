# The Latent Supervisor

The **Latent Supervisor** is Codernic’s orchestration safety net. While individual Coder agents are hyper-focused on fulfilling their prompts and modifying files, the Latent Supervisor acts as the "Adult in the Room." It hovers above the agentic workflow, monitoring telemetry, enforcing token/time budgets, and dynamically rewriting the execution graph when failures occur.

This module fundamentally solves two of the most critical flaws in autonomous AI agents: **Infinite Death Loops** and **Rigid Execution Workflows**.

---

## 1. Dynamic DAG Mutation (`AgentSupervisor`)

In traditional orchestrators, a Directed Acyclic Graph (DAG) is static. If Step 3 fails, the engine either aborts the entire workflow or blindly retries Step 3 until a hard-coded limit is reached. 

Codernic uses a **Dynamic DAG**. When the `AgentSupervisor` detects that a Coder node has failed (e.g., due to a compilation error or unresolvable Pirsig AST violation), it invokes the `handle_failure` routine:

```rust
pub fn handle_failure(&mut self, node_id: &str, error: String) -> Result<(String, Vec<String>)> {
    if let Some(node) = self.dag.get_node_mut(node_id) {
        node.status = NodeStatus::Failed(error);
    }
    
    // Dynamically mutates the execution graph in real-time
    self.dag.inject_correction_node(node_id)
}
```

Instead of aborting, the Supervisor dynamically injects a specific "Correction Node" (a Reviewer Agent) directly into the DAG. This new node inherits the context of the failure, fixes the localized issue, and bridges back to the main workflow. This allows the system to auto-heal without manual human intervention.

---

## 2. Telemetry-Driven Circuit Breaking (`SupervisorEngine`)

To prevent agents from burning through tokens in an infinite loop, the `SupervisorEngine` actively monitors the telemetry of the execution lane.

### Dynamic Task Estimation
Instead of hard-coded retry limits (e.g., "max 10 retries"), the `TaskEstimator` calculates a dynamic buffer based on the complexity of the prompt:

```rust
pub fn estimate_iterations(&self, prompt_len: usize) -> usize {
    let base = 800; 
    let scale = prompt_len / 100;
    base + scale
}
```
A simple prompt gets a tight leash. A massive refactoring prompt gets breathing room.

### Telemetry Evaluation
The engine constantly evaluates the current iteration against the dynamic limit and the Pirsig (AST) error count:

1. **Context Injection:** If the agent triggers more than 5 Pirsig AST errors, the Supervisor interrupts the LLM and forces a `SupervisorDecision::InjectContext`. This dynamically feeds the error patterns back into the LLM's prompt window, explicitly instructing it to review coding guidelines and correct its syntax.
2. **Circuit Breaking:** If the agent exceeds the `max_estimate_buffer`, the Supervisor triggers a `SupervisorDecision::CircuitBreak`. The DAG lane is forcefully aborted. This guarantees that Codernic will never silently burn through your hardware resources or API credits in a death loop.

---

## Summary
The Latent Supervisor completes the triad of Codernic's deterministic engine:
1. **Galileus** guarantees File-Level safety (Locking).
2. **Pirsig** guarantees Syntax-Level safety (AST Parsing).
3. **The Supervisor** guarantees Workflow-Level safety (Circuit Breaking and Auto-Healing).
