# Workspace Configuration Tree (`.codernic/`)

Codernic is designed around a strictly deterministic file system structure. While the global daemon settings reside in `~/.codernicapp/`, every local git repository is augmented with a `.codernic/` directory.

This folder serves as the local brain, persistent memory, and security sandbox for your project.

## Directory Structure

```text
.codernic/
├── config/
│   ├── engine.json                  # Local compute/network overrides
│   ├── mcp.json                     # MCP Tool registry (e.g., Jira, AWS hooks)
│   ├── llms/                        # Project-specific routing and LLM targets
│   └── intelligence/
│       ├── conventions.json         # Strict coding standards (e.g., FSD layout)
│       ├── agent-hints.json         # Directives forced upon all sub-agents
│       └── project-memory.md        # Persistent append-only memory log for agents
├── agents/                          # Project-specific Structural Agents (*.agent.json)
├── dags/                            # Saved visual workflow schemas (Structura)
├── sessions/                        # Tracks the `current-plan.json` for active UI chats
├── ragtime.db/                      # Local LanceDB vector store for Context (CRAG)
├── datasets/                        # Tracing logs used by the LoRA Trainer
└── audit/                           # Local SIEM logs outputted by the MockAuditLogger
```

## Purposes & Mechanics

### The Intelligence Subtree (`config/intelligence/`)
This is the most critical folder for steering AI behavior. 
- **`conventions.json` & `agent-hints.json`:** These files are automatically injected into the system prompt of every agent spun up by the daemon in this workspace. If your project uses a strict architecture (like Feature-Sliced Design), defining it here ensures the AI will *never* deviate from it.
- **`project-memory.md`:** A persistent log where agents record major architectural decisions. It prevents the AI from forgetting context across long-running sessions.

### Structural Definitions (`agents/` & `dags/`)
Instead of relying on vague prompts, Codernic utilizes structural engineering. Custom agents and workflows tailored exclusively to your repository's needs are stored here. They are version-controllable, allowing your team to commit AI-workflows to `git`.

### Vector Sandboxing (`ragtime.db`)
The `Ragtime` engine embeds your codebase locally into LanceDB. This database lives entirely within your project. If you delete the folder, the index is destroyed. It is entirely sovereign.

## ⚠️ Disclaimers & Security

1. **Never commit `.codernic/config/engine.json` if it contains plain-text keys:** While we encourage BYOK (Bring Your Own Key) via `SecretsManager` or Environment Variables, if you hardcode keys into the local JSON, ensure it is added to `.gitignore`.
2. **Deterministic Corruption:** The files in `.codernic/config/intelligence/` control the fundamental behavior of the autonomous agents. **Modifying these files manually with conflicting instructions may lead to deterministic hallucination, infinite loops, or total deviation from standard coding practices.**
3. **Database Locks:** The `ragtime.db` is locked by the active `codernic-enterprise` daemon. If you force-kill the daemon ungracefully, you may leave a stale lock file inside the DB directory, requiring manual deletion.
4. **Git Inclusion:** We recommend committing `conventions.json`, `agents/`, and `dags/` to your team's repository so all developers share the same AI structural context. However, you **must** `.gitignore` the `sessions/`, `ragtime.db/`, and `audit/` folders, as they are volatile and local to the developer's specific machine state.
