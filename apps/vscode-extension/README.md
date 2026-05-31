# AI Agencee for VS Code

> **Enterprise-grade multi-agent orchestration directly in your IDE** — Commander mode for workflows, Codernic intelligence (ASK/PLAN/AGENT), visual editors, and FTS5-powered code intelligence.

**Version**: 0.6.57 | **Status**: Production-Ready | **Publisher**: binaryjack

---

## 🎯 What is this?

The AI Agencee extension transforms VS Code into a complete multi-agent orchestration environment. Execute DAG workflows, manage agents visually, and leverage Codernic's codebase-aware intelligence — all without leaving your IDE.

**Two core capabilities:**

### 1. Commander Mode 🎮
Chat interface for running DAG workflows and managing agents.

- **Run DAGs visually** — Select, configure, execute with real-time progress
- **Create agents** — One-click scaffolding from templates
- **Execute ai-kit commands** — Full CLI integration with live output
- **Track costs in real-time** — Per-run budget monitoring
- **View execution history** — Clickable audit logs

### 2. Codernic Intelligence 🧠
Three-mode codebase assistant that understands your project structure.

- **ASK mode** — Answer questions about the codebase (architecture, patterns, symbols)
- **PLAN mode** — Design features and generate DAG specifications without execution
- **AGENT mode** — Execute commands and write code grounded in real symbol signatures

**What makes it unique**: Hybrid context strategy combines FTS5 index (<10ms queries) with real-time fallback (always-current results) — you get speed AND accuracy.

---

## ✨ Key Features

### Commander Mode
- 🎛️ **Visual DAG execution** — No terminal commands required
- 📊 **Real-time streaming** — Token-by-token output, cost accumulation, lane status
- 📁 **Agent management** — Create, edit, delete agents via chat
- 📜 **Execution history** — Full audit trail with clickable runs
- 🔌 **CLI integration** — Run any `ai-kit` command with live feedback

### Codernic Assistant
- 🔍 **ASK mode** — Query codebase structure, tech stack, architecture
- 📝 **PLAN mode** — Generate implementation plans and DAG specifications
- ⚡ **AGENT mode** — Execute changes with supervisor checkpoints
- 🗃️ **FTS5 indexing** — 449 files in 1.03s, 100% symbol accuracy
- 🔄 **Hybrid context** — Index when fresh, real-time when stale
- 🌐 **Polyglot** — TypeScript, JavaScript, Python, Go support

### Visual Editors
- 🎨 **Agent Editor** — Form-based `.agent.json` editing (no JSON required)
- 📚 **Tech Catalog Editor** — Manage technology definitions
- 🌳 **Asset Tree Views** — Browse agents, rules, techs with context menu actions

### Code Intelligence
- 🔎 **Symbol Explorer** — Hierarchical view of classes, functions, interfaces
- 📂 **Indexed Files Tree** — Real-time indexing status
- 💡 **Hover Tooltips** — Signature info on hover
- 🔗 **Call Hierarchy** — Find all usages, dependency graphs
- ⚡ **Incremental Indexing** — <100ms single-file updates

### Chat Participants
- `@ai-kit` — DAG orchestration in Copilot Chat
  - `/create-agent`, `/create-dag`, `/run`, `/dag`, `/index`
- `@codernic` — Codebase-aware assistance in Copilot Chat
  - `/ask`, `/plan`, `/agent`

---

## 🚀 Quick Start

### Installation

**From VSIX (Development)**:
```bash
code --install-extension ai-agencee-ext-0.6.57.vsix --force
```

**From Marketplace** (Coming Soon):
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search "AI Agencee"
4. Click Install

### Requirements
- **VS Code**: ≥1.95.0
- **Node.js**: ≥20
- **pnpm**: ≥10 (recommended)
- **@ai-agencee/cli**: Installed globally or in workspace

### First Run

1. **Open a workspace** with your code
2. **Extension auto-activates** and creates `.agencee/` folder
3. **Index your codebase**:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `AI Agencee: Index Codebase`
4. **Open Commander**:
   - Secondary sidebar → Commander panel
   - Or press `Ctrl+Shift+C`
5. **Try Codernic**:
   - Type `@codernic /ask What's the project structure?` in Copilot Chat
   - Or use the Codernic panel in secondary sidebar

---

## 📖 Usage Examples

### Example 1: Analyze Your Codebase

**Using Codernic ASK mode**:
```
@codernic /ask What's the authentication flow in this project?
@codernic /ask Show me all TypeScript interfaces related to users
@codernic /ask What's the test coverage of the API layer?
```

**Result**: Codernic queries the FTS5 index, finds relevant symbols, and provides accurate answers grounded in your actual code structure.

---

### Example 2: Plan a New Feature

**Using Codernic PLAN mode**:
```
@codernic /plan Add rate limiting to the API with Redis backend
```

**Result**: Codernic generates:
- Step-by-step implementation plan
- DAG JSON specification
- File changes required
- Cost estimate
- Risk analysis

You can review the plan, save it, then execute via Commander.

---

### Example 3: Execute a Workflow

**Using Commander**:
1. Open Commander panel
2. Select "Security Audit DAG" from available workflows
3. Click "Run DAG"
4. Watch real-time execution:
   - Backend lane: ✅ Complete ($0.12, 2m 30s)
   - Frontend lane: ✅ Complete ($0.08, 1m 45s)
   - Barrier: Sync complete
   - Testing lane: 🔄 Running...

**Result**: Full security audit with live cost tracking and supervisor verdicts.

---

### Example 4: Generate Code

**Using Codernic AGENT mode**:
```
@codernic /agent Create UserRepository with CRUD operations using Prisma
```

**Result**: Codernic:
1. Queries index for existing database models
2. Finds Prisma schema definitions
3. Generates UserRepository with correct import paths
4. Creates tests with proper mocking
5. All code compiles on first try (no hallucinated imports)

---

### Example 5: Create a Custom Agent

**Using Commander chat**:
```
Create a new agent for database migrations
```

**Result**: Commander opens the agent creation wizard:
- Template: Database Migration
- Tech stack: Auto-detected (PostgreSQL, Prisma)
- Model tier: Sonnet (schema analysis)
- Checks: `run-command`, `file-exists`, `grep`
- Saves to `.agencee/config/agents/database-migration.agent.json`

---

## 🏗️ Architecture

```
AI Agencee Extension
│
├─ 🎮 Commander Mode (Secondary Sidebar)
│  ├─ DAG Execution Engine
│  ├─ Agent Management
│  ├─ CLI Integration
│  └─ Execution History
│
├─ 🧠 Codernic (Secondary Sidebar + Chat Participant)
│  ├─ ASK Mode   → Query codebase
│  ├─ PLAN Mode  → Design features
│  └─ AGENT Mode → Execute changes
│
├─ 🌳 Asset Management (Primary Sidebar)
│  ├─ Agents Tree      → .agencee/config/agents/
│  ├─ Rules Tree       → .agencee/config/codernic/rules/
│  ├─ Techs Tree       → .agencee/config/techs/
│  ├─ Indexed Files    → Real-time indexing status
│  └─ Symbol Explorer  → Hierarchical code structure
│
├─ 🎨 Visual Editors
│  ├─ Agent Editor (AIE)  → Form-based agent.json editing
│  └─ Tech Editor (TIE)   → Technology catalog management
│
└─ 🔍 Code Intelligence Engine
   ├─ FTS5 Indexer     → 435 files/second
   ├─ Symbol Extractor → TypeScript/Python/Go
   ├─ Dependency Graph → Import tracking
   └─ Hybrid Context   → Index + real-time fallback
```

---

## ⚙️ Configuration

### Extension Settings

```json
{
  // Enable/disable features
  "ai-agencee.enableCommander": true,
  "ai-agencee.enableCodernic": true,
  
  // Indexing
  "ai-agencee.autoIndex": true,
  "ai-agencee.indexRefreshInterval": 300000,  // 5 minutes
  
  // UI
  "ai-agencee.showTokens": true,
  "ai-agencee.showCost": true,
  "ai-agencee.maxHistory": 50,
  
  // Logging
  "ai-agencee.logLevel": "info"
}
```

### Workspace Configuration

Create `.agencee/config.json`:

```json
{
  "commander": {
    "defaultDAGPath": "agents/dags",
    "defaultAgentPath": "agents",
    "enableNotifications": true,
    "costWarningThreshold": 0.50
  },
  "codernic": {
    "indexPath": ".agencee/code-index.db",
    "enableHybridContext": true,
    "preferredMode": "ask"
  }
}
```

---

## 📊 Performance

### Indexing Performance
- **Speed**: 449 TypeScript files in 1.03 seconds
- **Accuracy**: 100% symbol extraction (vs 70% with ctags)
- **Symbols**: 975 extracted (classes, functions, interfaces, types)
- **Dependencies**: 970 import relationships tracked
- **Incremental**: <100ms for single file update

### Query Performance
- **Symbol lookup**: <10ms (FTS5 index)
- **Full-text search**: <50ms (10 results)
- **Dependency graph**: <200ms (full project)
- **Real-time fallback**: <500ms (30 file scan)

### Resource Usage
- **Memory**: ~20 MB steady-state, ~50 MB peak during indexing
- **CPU**: <5% idle, <15% during streaming
- **Database**: ~500 KB (449 files)

---

## 🔐 Enterprise Features

### Security
- **RBAC Enforcement**: All operations tagged with principal
- **Audit Logging**: Immutable SHA-256 hash-chained logs
- **PII Scrubbing**: Automatic redaction before LLM calls
- **Prompt Injection Detection**: 10 signature families

### Compliance
- **GDPR Commands**: `data:export`, `data:delete` via Commander
- **SOC2-Ready**: Full audit trail, access control
- **Multi-Tenant**: Per-tenant workspace scoping

### Cost Control
- **Budget Caps**: Per-run and per-lane limits
- **Cost Tracking**: Real-time accumulation in Commander
- **Model Routing**: Automatic tier downgrade to stay within budget

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Open Commander |
| `Ctrl+Shift+K` | Open Codernic |
| `Ctrl+Enter` | Send message in Commander |
| `Ctrl+K` | Clear chat |
| `Esc` | Cancel running DAG |
| `↑` / `↓` | Navigate command history |

---

## 🆚 Comparison with Other Tools

| Feature | AI Agencee | Cursor | GitHub Copilot | Cline |
|---------|------------|--------|----------------|-------|
| **DAG Orchestration** | ✅ Native | ❌ | ❌ | ❌ |
| **Multi-mode Assistant** | ✅ ASK/PLAN/AGENT | ❌ | ❌ | ⚠️ Limited |
| **Code Indexing** | ✅ FTS5 SQLite | ⚠️ Basic | ⚠️ Cloud | ❌ |
| **Audit Logging** | ✅ Hash-chained | ❌ | ❌ | ❌ |
| **RBAC** | ✅ Principal-tagged | ❌ | ❌ | ❌ |
| **Budget Enforcement** | ✅ Per-run caps | ❌ | ❌ | ❌ |
| **Local-first** | ✅ Ollama support | ⚠️ Partial | ❌ Cloud-only | ⚠️ Partial |
| **Visual DAG Editor** | ✅ React-based | ❌ | ❌ | ❌ |
| **Chat Participants** | ✅ @ai-kit + @codernic | ❌ | ✅ @workspace | ❌ |
| **Hybrid Context** | ✅ Index + real-time | ❌ | ⚠️ Cloud | ❌ |

---

## 🐛 Troubleshooting

### Extension not activating
1. Check VS Code version: `code --version` (need ≥1.95.0)
2. Check extension is enabled: Extensions panel
3. Reload window: `Ctrl+Shift+P` → "Reload Window"

### Codernic not responding
1. Check index exists: `.agencee/code-index.db`
2. Run indexing: `AI Agencee: Index Codebase`
3. Check output channel: "AI Agencee" logs

### Commander DAG execution fails
1. Verify `ai-kit` CLI installed: `ai-kit --version`
2. Check DAG JSON valid: `ai-kit check dag.json`
3. Review output channel for errors

### Index out of date
1. Manually trigger: `AI Agencee: Index Codebase`
2. Enable auto-refresh: `"ai-agencee.autoIndex": true`
3. Adjust interval: `"ai-agencee.indexRefreshInterval": 300000`

### Chat participants not showing
1. Ensure GitHub Copilot extension installed
2. Check Copilot is active subscription
3. Reload window
4. Verify `@ai-kit` and `@codernic` appear in chat

---

## 📚 Documentation

- **Full Documentation**: [docs/features/40-vscode-extension.md](../../docs/features/40-vscode-extension.md)
- **Commander Mode Guide**: [docs/features/vscode-extension/commander-mode.md](../../docs/features/vscode-extension/commander-mode.md)
- **Codernic Guide**: [docs/features/28-code-assistant.md](../../docs/features/28-code-assistant.md)
- **CLI Reference**: [docs/features/15-cli-commands.md](../../docs/features/15-cli-commands.md)
- **Feature Index**: [docs/features/INDEX.md](../../docs/features/INDEX.md)

---

## 🗺️ Roadmap

### v0.7 (Q2 2026)
- [ ] Marketplace publication
- [ ] Inline diff preview for Agent mode changes
- [ ] Multi-workspace support
- [ ] Extension settings UI

### v0.8 (Q3 2026)
- [ ] Remote SSH support
- [ ] GitHub Codespaces integration
- [ ] Team settings sync
- [ ] Custom theme support

### v0.9 (Q4 2026)
- [ ] DAG debugger with breakpoints
- [ ] Time-travel debugging for runs
- [ ] Performance profiler
- [ ] AI-assisted refactoring tools

---

## 🤝 Contributing

This extension is part of the AI Agencee monorepo. Contributions welcome!

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes following [coding standards](../../_private/docs/copilot/copilot-instructions.md)
4. Run tests: `pnpm test`
5. Build extension: `pnpm build`
6. Package VSIX: `pnpm package`
7. Submit pull request

**Coding Standards**:
- kebab-case file names
- One item per file
- Prototype pattern for constructors
- ≥95% test coverage
- Zero `any` types

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🔗 Links

- **Website**: [ai-agencee.dev](https://ai-agencee.dev)
- **GitHub**: [github.com/binaryjack/ai-agencee](https://github.com/binaryjack/ai-agencee)
- **Documentation**: [docs/features/INDEX.md](../../docs/features/INDEX.md)
- **Issues**: [GitHub Issues](https://github.com/binaryjack/ai-agencee/issues)
- **Discussions**: [GitHub Discussions](https://github.com/binaryjack/ai-agencee/discussions)

---

## 💡 Support

- **Documentation**: [docs/features/40-vscode-extension.md](../../docs/features/40-vscode-extension.md)
- **Troubleshooting**: See section above
- **Issues**: [GitHub Issues](https://github.com/binaryjack/ai-agencee/issues)
- **Community**: [GitHub Discussions](https://github.com/binaryjack/ai-agencee/discussions)

---

**Built with ❤️ by the AI Agencee team**

> Transform VS Code into an enterprise-grade multi-agent orchestration environment.  
> **One interface. Full orchestration. Zero context-switching.**
