# Codernic for VS Code

> **Deterministic multi-agent orchestration and codebase-aware AI directly in your IDE** — Edit code visually, run automated DAG workflows, design features offline, and audit quality against your own standards.

**Version**: 0.6.237 | **Status**: Production-Ready | **Publisher**: binaryjack | **License**: MIT

---

## 📖 Table of Contents

- [What is Codernic?](#-what-is-codernic)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [Contributing](#-contributing)
- [License & Legal](#-license--legal)
- [Support](#-support)

---

## 🎯 What is Codernic?

Codernic transforms VS Code into a complete local-first AI development environment. Write code, design specifications, and run multi-agent workflows with direct access to your codebase symbol structure — all local, offline, and secure.

### 🧠 Codebase-Aware Assistant

Three-mode codebase assistant that is fully grounded in your real symbols and dependencies:

- **ASK mode** — Query codebase structure, relationships, tech stack, and patterns with semantic understanding.
- **PLAN mode** — Design features and generate atomic specs without execution; preview changes before applying them.
- **AGENT mode** — Execute changes, run terminal actions, and write patches with supervisor checkpoints for safety.

### 🎮 Workflow Commander

A visual interface for running task workflows and executing multi-agent DAGs:

- **Visual execution** — Trigger, configure, and monitor DAG progress lanes in real-time.
- **Agent management** — Create and configure agents visually using templates; no JSON editing needed.
- **Audit logs** — Access immutable logs of every run with cost and token tracking for accountability.

### 🔒 Privacy-First Architecture

- **100% offline indexing** — Your code never leaves your machine.
- **Hybrid context** — Combines SQLite FTS5 with real-time file scans for accuracy.
- **No telemetry** — Complete control over your data and computation.

---

## ✨ Key Features

| Feature                        | Description                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 🔍 **Local Code Intelligence** | Indexes your codebase (450+ files in ~1 second) using a high-performance Rust indexing engine.                 |
| 🔄 **Hybrid Context Strategy** | Combines fast SQLite FTS5 symbol index with real-time file system scans for always-current results.            |
| 🎨 **Visual Form Editors**     | Manage agents (`.agent.json` files) and technology catalogs using structured visual forms instead of raw JSON. |
| 🌳 **Symbol Explorer**         | Hierarchical view of classes, interfaces, and functions directly in the sidebar with search.                   |
| 🌐 **Polyglot Support**        | TypeScript, JavaScript, Python, Go, Rust, and more languages supported.                                        |
| ⚡ **Fast Indexing**           | 450+ files indexed in ~1 second with Rust performance.                                                         |
| 🎯 **DAG Workflows**           | Visual orchestration of multi-step AI agent tasks.                                                             |
| 📊 **Cost Tracking**           | Monitor token usage and API costs per run.                                                                     |

---

## 🚀 Quick Start

### Installation

**From Visual Studio Code Marketplace**:

1. Open VS Code
2. Navigate to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Codernic"
4. Click Install

**From VSIX (Development Release)**:

1. Download the latest `.vsix` file from [Releases](https://github.com/binaryjack/ai-agencee/releases)
2. Run in terminal:
   ```bash
   code --install-extension codernic-ext-0.6.237.vsix --force
   ```

### System Requirements

- **VS Code**: `≥ 1.95.0`
- **Node.js**: `≥ 20` (for AI model execution)
- **pnpm**: `≥ 10` (package management)
- **Rust Toolchain**: 2024 edition (to compile local engine binaries)
- **RAM**: ≥ 4GB (8GB+ recommended for large codebases)
- **Disk**: ≥ 500MB free space

### First Run Walkthrough

1. **Open a Workspace** containing your project code
2. **Auto-Activation**: The extension activates and creates a local `.agencee/` folder for runtime configs
3. **Index Your Codebase**:
   ```
   Ctrl+Shift+P → "AI Agencee: Index Codebase"
   ```
4. **Explore with Symbol Explorer**:
   - Click the Codernic sidebar icon to view indexed symbols
   - Browse classes, functions, and type definitions
5. **Start with ASK Mode**:
   ```
   Type in Copilot Chat: @codernic /ask What is the entry point of this project?
   ```
6. **Create Your First Workflow**:
   - Open Workflow Commander panel
   - Create a new `.agent.json` workflow
   - Use visual editor to design agent steps

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Codernic VS Code Extension (TypeScript)         │
└─────────────────────────────────────────────────────────┘
          ↑
          │
    ┌─────┴─────┬─────────────┬──────────────┐
    │           │             │              │
    ▼           ▼             ▼              ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
│ 🧠 ASK │ │ 📋 PLAN  │ │ 🚀 AGENT │ │ 🎮 Commander│
│ Mode   │ │ Mode     │ │ Mode     │ │ (DAG Viz)   │
└────────┘ └──────────┘ └──────────┘ └─────────────┘
    │           │             │              │
    └─────┬─────┴─────────────┴──────────────┘
          │
          ▼
    ┌──────────────────────┐
    │ Code Intelligence    │
    │ Engine (Rust Core)   │
    ├──────────────────────┤
    │ • FTS5 Indexer       │
    │ • Symbol Extractor   │
    │ • AST Parser         │
    │ • Dependency Graph   │
    └──────────────────────┘
          │
          ▼
    ┌──────────────────────┐
    │ File System Watcher  │
    │ & SQLite Index DB    │
    └──────────────────────┘
```

---

## ⚙️ Configuration

### VS Code Settings

Configure in your workspace or user `settings.json`:

```json
{
  "ai-agencee.model": "copilot-gpt-4o",
  "ai-agencee.mcpPath": "",
  "aiAgencee.indexing.languages": ["typescript", "javascript", "python"],
  "ai-agencee.preferLocalModels": false,
  "ai-agencee.debugMode": false,
  "ai-agencee.maxContextTokens": 8000
}
```

### Configuration Reference

| Setting                        | Type    | Default                        | Description                                            |
| ------------------------------ | ------- | ------------------------------ | ------------------------------------------------------ |
| `ai-agencee.model`             | string  | `"copilot-gpt-4o"`             | LLM model to use (copilot-gpt-4o, local, claude, etc.) |
| `ai-agencee.mcpPath`           | string  | `""`                           | Path to MCP server binary (auto-detect if empty)       |
| `aiAgencee.indexing.languages` | array   | `["typescript", "javascript"]` | Languages to index                                     |
| `ai-agencee.preferLocalModels` | boolean | `false`                        | Use local models if available                          |
| `ai-agencee.debugMode`         | boolean | `false`                        | Enable verbose logging                                 |
| `ai-agencee.maxContextTokens`  | number  | `8000`                         | Maximum tokens for context window                      |

---

## 📚 Usage Guide

### ASK Mode: Query Your Codebase

Ask questions about your code structure, patterns, and dependencies:

```
@codernic /ask What are the main entry points in this project?
@codernic /ask Show me how authentication is handled across the codebase
@codernic /ask What's the relationship between these two modules?
@codernic /ask Find all error handlers and exception patterns
```

### PLAN Mode: Design Features

Create detailed specifications without code changes:

```
@codernic /plan Design a new API endpoint for user profile updates with validation
@codernic /plan Refactor the authentication module to support OAuth2
@codernic /plan Add caching layer to database queries
```

### AGENT Mode: Execute Changes

Run automated transformations with supervisor approval:

```
@codernic /agent Update all TypeScript files to use strict mode
@codernic /agent Refactor class components to functional components
@codernic /agent Generate tests for uncovered code paths
```

### Workflow Commander: Visual DAG Execution

1. Open Workflow Commander from sidebar
2. Load or create a `.agent.json` workflow
3. Configure agent parameters visually
4. Execute with real-time monitoring
5. Review audit logs and costs

---

## 🧪 Testing & Building

### Run Tests

```bash
cd apps/codernic-ext
pnpm test
```

### Build Extension

```bash
pnpm build
```

### Run in Development

```bash
pnpm dev
```

### Generate VSIX Package

```bash
pnpm package
```

---

## 🤝 Contributing

We welcome contributions to Codernic! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for complete guidelines.

**Quick Start for Contributors**:

1. Fork: [github.com/binaryjack/ai-agencee](https://github.com/binaryjack/ai-agencee)
2. Clone and install dependencies:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-agencee.git
   cd ai-agencee
   pnpm install
   ```
3. Create feature branch: `git checkout -b feat/your-feature`
4. Make changes and test:
   ```bash
   pnpm test
   pnpm build
   ```
5. Submit Pull Request with description

**Code Standards**:

- ✅ kebab-case file names
- ✅ TypeScript strict mode (no `any`)
- ✅ One exported item per file
- ✅ 95%+ test coverage for new code
- ✅ ESLint compliance

---

## 📄 License & Legal

- **License**: MIT — See [LICENSE](../../LICENSE)
- **Contributing**: [CONTRIBUTING.md](../../CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md)
- **Security**: [SECURITY.md](../../SECURITY.md)
- **Legal Framework**: Swiss law (FADP, URG/LDA, OR)

**For AI-based technology concerns**: See [DATA_PRIVACY_AI.md](../../apps/legal/DATA_PRIVACY_AI.md) for privacy and data handling practices.

---

## 💬 Support & Community

- **Issues**: [github.com/binaryjack/ai-agencee/issues](https://github.com/binaryjack/ai-agencee/issues)
- **Discussions**: [github.com/binaryjack/ai-agencee/discussions](https://github.com/binaryjack/ai-agencee/discussions)
- **Website**: [codernic.dev](https://codernic.dev)
- **Sponsorship**: [github.com/sponsors/binaryjack](https://github.com/sponsors/binaryjack)

---

**Built with ❤️ by the AI Agencee team**
