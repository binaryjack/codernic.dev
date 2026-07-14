# Pages & Views

The Codernic Frontend is built as a single-page application (SPA) featuring specialized views for different phases of the AI-assisted engineering lifecycle. Each page serves a dedicated purpose to prevent UI clutter and ensure focus.

## 1. The Chat & Engineering View (`/chat`)
**Purpose:** This is the primary daily driver for developers.
- **Main Interface:** A threaded conversation view where you assign tasks to the AI daemon.
- **Artifact Viewer:** Located on the right or split horizontally. When the AI writes code, it generates structured "Artifacts" here. You can manually tweak the code and click **Apply to Workspace** to patch your local filesystem.
- **Context Status:** Displays what files and context the `Ragtime` engine has actively loaded into the LLM prompt.

## 2. Structura DAG Editor (`/structura`)
**Purpose:** High-level architectural planning and agent orchestration.
- **Visual Node Editor:** Allows you to visually draw Directed Acyclic Graphs (DAG). Each node represents a specific AI sub-agent (e.g., "Research Node", "Refactoring Node", "Security Audit Node").
- **Workflow Execution:** You can wire these nodes together and trigger execution. The UI highlights which node is actively running, allowing you to debug complex, multi-step agent workflows visually.

## 3. Models Hub (`/models`)
**Purpose:** Managing the brain of Codernic.
- **Local Models:** Search, download, and hot-swap quantized GGUF models directly to your machine. It displays a progress bar and size for each download.
- **Cloud Providers:** Configure your commercial API keys (OpenAI, Anthropic) securely into the `SecretsManager`.
- **Routing Thresholds:** Define rules like "Always use Local Llama 3 8B for autocompletion, but use GPT-4o for Architecture DAGs."

## 4. Team & Agents (`/team`)
**Purpose:** Managing your autonomous AI team and CRDT synchronizations.
- **LoRA Hubs:** View custom fine-tuned adapters pushed by your enterprise MLOps team. You can manually pull the latest company standards here.
- **Agent Roles:** Inspect the system prompts and "Agent Hints" stored in your `.codernic` directory. You can edit an agent's specific instruction set (e.g., forcing a React agent to only use Feature-Sliced Design).
- **Collaboration Sync:** View the health of the `y-rs` WebSocket connection merging your workspace with your human peers and AI agents.

## 5. System Metrics & Telemetry (`/metrics`)
**Purpose:** Debugging the Codernic Daemon.
- **VRAM Monitor:** A live chart showing your GPU memory footprint, crucial when training LoRAs or running heavy inference.
- **Pirsig Logs:** The proxy audit log showing exactly what requests the AI made and what payloads were stripped by the AST Anonymizer.
