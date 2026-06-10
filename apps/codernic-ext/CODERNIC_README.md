# Codernic for VS Code

> **Deterministic multi-agent orchestration and codebase-aware AI directly in your IDE** — Edit code visually, run automated DAG workflows, design features offline, and audit quality against your own standards.

**Version**: 1.0.0-rc1 (0.6.342) | **Status**: Production-Ready | **Publisher**: binaryjack | **License**: MIT

---

## What is Codernic?

Codernic transforms VS Code into a complete Local-First, Cloud-Ready AI development environment. Write code, design specifications, and run multi-agent workflows with direct access to your codebase symbol structure. Connect securely to your favorite local models (Ollama, LM Studio) or commercial APIs (OpenAI, Anthropic).

### Codebase-Aware Assistant

Three-mode codebase assistant that is fully grounded in your real symbols and dependencies:

- **ASK mode** — Query codebase structure, relationships, tech stack, and patterns.
- **PLAN mode** — Design features and generate atomic specs without execution.
- **AGENT mode** — Execute changes, run terminal actions, and write patches with supervisor checkpoints.

### Workflow Commander

A visual interface for running task workflows and executing multi-agent DAGs:

- **Visual execution** — Trigger, configure, and monitor DAG progress lanes.
- **Agent management** — Create and configure agents visually using templates.
- **Audit logs** — Access immutable logs of every run with cost and token tracking.

---

## Key Features

- **Local Code Intelligence** — Indexes your codebase (450+ files in ~1 second) using a high-performance Rust indexing engine.
- **Ecological Token Efficiency** — surgical context extraction loads only 2-5 files per prompt, generating massive financial savings and reducing your carbon footprint when using commercial cloud APIs.
- **Hybrid Context Strategy** — Combines a fast SQLite FTS5 symbol index with real-time file system scans for always-current results.
- **Visual Form Editors** — Manage agents (`.agent.json` files) and technology catalogs using structured visual forms instead of raw JSON.
- **Symbol Explorer** — Hierarchical view of classes, interfaces, and functions directly in the sidebar.
- **Polyglot Symbol Support** — Supports TypeScript, JavaScript, Python, Go, and more.

---

## Quick Start

### Installation

**From VSIX (Zero-Friction Local Deployment)**:

1. Download the latest `.vsix` file from the [Releases](https://github.com/binaryjack/codernic.dev/releases) page.
2. The VSIX payload is bundled with **all native Rust binaries** (Daemon, Ragtime FTS5, CLI). No external scripts or compilation required.
3. Run the following command in your terminal:
   ```bash
   code --install-extension codernic-ext-0.6.342.vsix --force
   ```

### Requirements

- **VS Code**: `≥ 1.95.0`
- **Node.js**: `≥ 20`
- **pnpm**: `≥ 10`
- **Rust Toolchain**: 2024 edition (to compile the local engine binaries)

### First Run

1. **Open a Workspace** containing your project code.
2. **Auto-Activation**: The extension automatically activates and creates a local `.agencee/` folder to store runtime configurations.
3. **Index Your Codebase**:
   - Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
   - Select **AI Agencee: Index Codebase**.
4. **Open the Sidebars**:
   - Navigate to the **Codernic** sidebar icon to access symbol trees, index status, and visual panels.
   - Try typing `@codernic /ask What is the entry point of this project?` in Copilot Chat, or run commands from the side panels.

---

## Architecture

```
Codernic VS Code Extension
│
├─ 🧠 Assistant Interface (Chat & Sidebar Panel)
│  ├─ ASK Mode   → Code Q&A
│  ├─ PLAN Mode  → Specification design
│  └─ AGENT Mode → Execution & supervisor approval
│
├─ 🎮 Commander Panel (Visual DAG Workflows)
│  ├─ DAG Execution Engine
│  ├─ Cost/Token Tracker
│  └─ Execution Logs
│
├─ 🎨 Visual Editors
│  ├─ Agent Form Editor (AIE)
│  └─ Tech catalog Form Editor (TIE)
│
└─ 🔍 Code Intelligence Engine (Rust Core)
   ├─ FTS5 Indexer     → High-speed symbol mapping
   ├─ Symbol Extractor → AST signature parsing
   └─ Hybrid Context   → Sync check on save
```

---

## Configuration

### Extension Settings

Configure Codernic in your user/workspace `settings.json` to point to your preferred endpoint:

**Example: Commercial API (OpenAI)**
```json
{
  "ai-agencee.model": "gpt-4o",
  "ai-agencee.apiKey": "sk-...",
  "ai-agencee.endpoint": "https://api.openai.com/v1"
}
```

**Example: Local First (Ollama / LM Studio)**
```json
{
  "ai-agencee.model": "deepseek-coder",
  "ai-agencee.endpoint": "http://localhost:11434/v1"
}
```

You can also adjust the core Rust engine parameters:
```json
{
  "ai-agencee.mcpPath": "", // Detects binary automatically from workspace if blank
  "aiAgencee.indexing.languages": ["typescript", "javascript", "rust"]
}
```

---

## Roadmap (V2 Upcoming)

While V1 strictly focuses on deterministic, offline codebase editing, our V2 roadmap expands Codernic's capabilities safely:
- **Hybrid Search Context**: Upgrading Ragtime to combine BM25 exact-keyword lexical search with mathematical Vector embeddings.
- **The Adversarial Web Scraper**: An isolated "Hermetic SAS" subagent that fetches external framework docs from the internet, which the strict offline deterministic engine evaluates before applying.
- **MCP Hub**: A secure plugin ecosystem for connecting tools like Jira, AWS, and Stripe via the Model Context Protocol.

---

## Contributing

We welcome contributions to Codernic!

1. Fork the repository: [github.com/binaryjack/codernic.dev](https://github.com/binaryjack/codernic.dev)
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Run tests locally:
   ```bash
   pnpm test
   ```
4. Build the extension package:
   ```bash
   pnpm build
   ```
5. Submit a Pull Request.

**Coding Guidelines**:

- kebab-case file names.
- Clean separation: One main component per file.
- Strictly type everything (Zero `any` types).
- Maintain test coverage for codebase tools and views.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Links

- **Website**: [codernic.dev](https://codernic.dev)
- **GitHub**: [binaryjack/codernic.dev](https://github.com/binaryjack/codernic.dev)
- **Issues**: [Submit Bug / Request Feature](https://github.com/binaryjack/codernic.dev/issues)
