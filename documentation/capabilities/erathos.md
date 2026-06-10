# Erathos: Visual Grounding Layer

**Subsystems:** UI components (`WorkspaceLayout.tsx`, `ErathosCanvas.tsx`, `AnalyzerPanel.tsx`) and the MCP Bridge.
**Role:** Closing the intent gap by using visual architecture as primary context.

## Mechanism

Language is inherently ambiguous. Explaining a complex microservice architecture or a state-machine flow to an LLM via a text prompt often results in misunderstandings, leading the LLM to write code that solves the wrong problem. Diagrams, on the other hand, are structurally explicit.

Erathos acts as the visual grounding layer for Codernic:
1. **Canvas Input:** The new UI provides an `ErathosCanvas` where users can construct or upload diagrams (UML, data flows, DAG architectures).
2. **Context Mapping:** Erathos parses these visual structures and maps the diagram nodes to actual symbols in the `Ragtime` index. If a box is labeled `UserService`, Erathos links it to `src/services/UserService.ts`.
3. **Intent Injection:** When a prompt is issued, the structural relationships defined in the diagram are injected into the LLM's context alongside the code.
4. **Execution Tracking:** The UI also utilizes the Erathos engine to provide real-time visual representations of DAG execution lanes and Galileus file locks, allowing developers to visually monitor the autonomous system.

## Why it matters (Our Philosophy)

The "Intent Gap" is the space between what a developer wants and what the AI thinks they want. Current tools try to bridge this gap by asking the developer to write massive, detailed text documents (PRDs). 

We believe that **a picture is worth a thousand tokens**. By allowing developers to express intent visually, we drastically reduce prompt engineering overhead, eliminate architectural ambiguity, and provide the LLM with deterministic structural guidelines before it generates a single line of code.
