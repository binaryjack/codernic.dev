# Competitive Feature Matrix

This document provides a strict, fact-based feature comparison between **Codernic** and the major AI coding agents and orchestrators on the market (as of mid-2026). 

It also explains *why* Codernic intentionally lacks certain popular features (like inline autocomplete or unbounded cloud execution) in alignment with our philosophy of **supervised determinism** and **sustainable token efficiency**.

---

## 1. Major Commercial Actors

| Feature / Platform | Codernic | Windsurf (Cascade) | Zed (AI) | GitHub Copilot | Claude Code | Cursor | Devin | Antigravity | Jules | Spark | Cody | Codex (API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Execution Paradigm** | Supervised Runtime | AI-Native IDE | High-Perf Editor + AI Agents | Inline Autocomplete | Conversational CLI | IDE Fork (Chat) | Autonomous Cloud | Autonomous Workspace | Background Asynchronous | Autonomous App Builder | IDE Chat / Autocomplete | Raw API |
| **AST Quality Gates (Pre-disk)** | **Yes (Pirsig)** | No (LSP Post-disk) | No (LSP Post-disk) | No | No | No | No (Post-run tests) | No | Yes (Critic layer) | No | No | No |
| **Parallel File Arbitration** | **Yes (Galileus)** | No | No (Manual conflict res) | N/A | No | No | No | Yes (Subagents) | No | No | No | No |
| **Visual Architecture Grounding** | **Yes (Erathos)** | No | No | No | No | No | No | No | No | No | No | No |
| **Codebase Context Strategy** | **Surgical (Ragtime)** | Deep Context Search | File references + MCP | Heuristic Tabs | Full Context Dump | Heuristic RAG | Full Sandbox Search | Semantic RAG | Full Repo Clone | Full Stack Context | Semantic RAG | None |
| **Privacy / Execution** | **Local-First / API-Ready**| Cloud | Local via Ollama / Cloud | Cloud (Telemetry) | Cloud | Cloud | Cloud / API | Cloud (Google VM) | Cloud | Cloud / API | Cloud |

---

## 2. Open Source & GitHub Ecosystem Orchestrators

| Project / Framework | Primary Language | Paradigm | Parallel Actor Arbitration | AST Validation | Visual Grounding | Status / Focus |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Codernic** | Rust | **DAG Supervised Runtime** | **Yes (Galileus)** | **Yes (Pirsig)** | **Yes (Erathos)** | Production / Local IDE Engine |
| **Aider** | Python | CLI Autonomous Diffs | No | No | No | Production / CLI Git Assistant |
| **Helix / Neovim (Plugins)** | Rust / C | Terminal Editor | No | No | No | Production / Keyboard Editors |
| **LangGraph** | Python / JS | State Machine Orchestration | No | No | No | Production / General Purpose LLM Flows |
| **CrewAI** | Python | Role-based Agent Swarms | No (Sequential) | No | No | Production / Research & Task Automation |
| **OpenHands (OpenDevin)** | Python / TS | Autonomous Sandbox | No | No | No | Production / Open Source Devin Clone |
| **MiroFlow** | TS / Python | Visual Node Editor | No | No | Yes (Flow UI) | Production / Workflow Automation |
| **Qualixar OS** | Rust / TS | Agentic Operating System | Partial | No | No | Alpha / OS-level integration |
| **open-multi-agent** | TypeScript | Multi-Agent Framework | No | No | No | Alpha / Early Stage Framework |
| **Agent-Orchestration** | Python / React | Orchestration Platform | No | No | No | Early Proof-of-Concept |
| **loki-mode** | Python / Bash | Autonomous SDLC | No | No | No | Early Phase SDLC Automation |
| **multi-agent-shogun** | Bash (tmux) | Parallel Runner | Yes (tmux pane level) | No | No | Experimental CLI Runner |
| **agentic-ai-future-factory** | Python | Academic Incubator | No | No | No | Research Prototype |

---

## 3. Our Philosophy: Why we build what we build (and what we don't)

### Why we don't build inline autocomplete (vs. Copilot / Cody)
Inline autocomplete treats developers as exhausted reviewers of probabilistically generated code. It is a "machine gun for technical debt" that hallucinates imports and ignores export rules. **Codernic** acts as a runtime. It generates atomic patches but runs them through the **Pirsig** AST gate first. If the LLM hallucinates an import, the engine rejects it. *Bad code never reaches the disk.*

### Why we don't build a massive new IDE (vs. Zed / Cursor)
Zed is a phenomenal, high-performance Rust editor that recently introduced "Agentic Editing" and parallel agent threads. Cursor is a highly successful VS Code fork. However, forcing developers to abandon their heavily customized IDEs (Neovim, VS Code, IntelliJ) to get AI features creates massive friction. 
Furthermore, while Zed allows running multiple agents in parallel, it relies on the Language Server Protocol (LSP) to catch errors *after* the agent mutates the text, and it lacks strict actor-based file locking. **Codernic** is a headless orchestrator. We use **Galileus** to mathematically prevent parallel file collisions, and **Pirsig** to block bad ASTs *before* disk mutation. We bring the deterministic AI to *your* editor, rather than forcing you into ours.

### Why we don't rely on massive context windows (vs. Claude Code)
The current industry trend is to feed 200,000+ tokens of a codebase into an LLM. This is fundamentally counterproductive. 
1. **Financial Waste:** Firing hundreds of thousands of tokens per prompt quickly drains API budgets.
2. **Ecological Disaster:** Massive token processing wastes electricity and compute resources, severely ballooning the carbon footprint of AI development.
3. **Attention Degradation:** LLMs suffer from the "Lost in the Middle" phenomenon; the more context they have, the worse their reasoning becomes on specific files.

**Codernic** uses **Ragtime** to perform surgical semantic extraction (Blake3 hashing + Tree-sitter + FTS5/BERT). It loads only the 2-5 files strictly necessary for the task. **Saving tokens saves your wallet, saves the planet, and yields more deterministic, focused AI output.**

### Why we don't build unbounded cloud agents (vs. Devin / Jules / Antigravity)
Software engineering is deterministic. Unbounded autonomous agents operating in cloud sandboxes tend to drift from intended architecture because they rely entirely on probabilistic reasoning.
**Codernic** uses **supervised determinism**. We wrap the AI in strict programmatic rails (Pirsig for quality, Galileus for file locks). Furthermore, we run 100% locally on your hardware. Humans + AI is the perfect combo. The AI provides the speed; the local Rust engine provides the deterministic safety.

### Why we built Visual Grounding (Erathos)
Language is ambiguous. Prompt engineering complex architectures is difficult. Diagrams are explicit. **Erathos** allows developers to pass UML or DAG diagrams directly to the agent as context. This closes the "intent gap" and ensures the AI builds exactly what the architect designed. None of our major competitors offer native visual-to-code architecture grounding.
