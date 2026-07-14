# Lexical Glossary & Terminology

Codernic sits at the intersection of hardcore backend AI engineering and user-friendly product design. To ensure our engineering teams, sales teams, and end-users all speak the same language, we maintain a strict mapping between our internal "Real Names" (the actual Rust/Architectural components) and the "Marketing Names" (how they are presented in the UI and Adopters Guide).

## Engine Name Mapping

| Real Name (Architecture) | Marketing Name (UI / Adopters) | Description |
| :--- | :--- | :--- |
| **Pirsig AST Firewall** | **Codernic Shield** | The engine that mathematically parses code to prevent hallucinated imports, syntax errors, and securely anonymizes PII before it hits the network. |
| **Ragtime Context Engine** | **Smart Workspace Memory** | The embedded LanceDB vector database that smartly fetches the right files and documentation when the AI needs context. |
| **Galileus CI Gatekeeper** | **Workflow Manager** | The actor system that manages file locks and prevents multiple background AI agents from corrupting the same file. |
| **DAG (Directed Acyclic Graph)** | **Visual Workflow** | The schema used in the UI's drag-and-drop editor to wire multiple AI agents together in a sequence. |
| **CRDT (Yjs/y-rs)** | **Real-Time Team Sync** | The underlying mathematical protocol that allows autonomous agents and human developers to edit the same file simultaneously without conflicts. |
| **TeamLoraTrainer** | **AI Team Hub** | The engine that trains and manages custom LoRA adapters to enforce company-specific coding standards. |
| **Erathos** | **Atomos Structura** | The Visual Schema Designer used in the UI to draw Directed Acyclic Graphs (DAGs) and build agent workflows. |
| **Visual Grounding** | **UX/UI Specialist** | A specialized AI capability that allows specific agents to "see" UI screenshots and fix CSS/layout bugs automatically. |

---

## Technical Terminology Explained

For adopters new to the AI engineering space, here are simple explanations for the underlying technology that powers Codernic:

### LoRA (Low-Rank Adaptation)
Instead of training a massive AI model from scratch (which costs millions of dollars), a LoRA is a small "adapter" or "plugin" that is trained on your company's specific codebase. When you plug a LoRA into a generic AI, it suddenly codes exactly like your senior engineers, using your internal libraries and respecting your specific architecture.

### GGUF & Safetensors
These are file formats used to package AI models so they can run locally on your laptop's CPU or GPU. When you click "Download" in the **Models Hub**, you are downloading a GGUF file.

### AST (Abstract Syntax Tree)
A way for computers to mathematically understand code structure. When Codernic uses an AST, it's not just "reading text"—it understands that a specific word is a `function` and another is a `variable`. This is how the **Codernic Shield** catches errors before they happen.

### Token Window / Context Limit
The maximum amount of text an AI can "remember" at one time. If you dump a massive project into an AI, it exceeds this window and forgets things. **Smart Workspace Memory** solves this by only feeding the AI the exact code blocks it needs.

### Quantization
The process of compressing a massive AI model so it can fit into the limited memory (RAM/VRAM) of a standard MacBook or developer laptop without losing too much intelligence.
