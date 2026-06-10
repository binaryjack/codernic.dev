# Cheatsheet

## CLI Commands

| Command                                       | Description                                           |
| --------------------------------------------- | ----------------------------------------------------- |
| `agencee agent --run <dag.json>`              | Execute a DAG agent plan                              |
| `agencee code:index --path .`                 | Index the codebase (Ragtime L2) for semantic search   |
| `agencee daemon start`                        | Start the AI Agencee background daemon                |
| `agencee daemon stop`                         | Stop the background daemon                            |
| `cargo build --release`                       | Build the full Rust workspace                         |
| `cargo test`                                  | Run unit and integration tests                        |

## VS Code Shortcuts

| Shortcut                | Action                              |
| ----------------------- | ----------------------------------- |
| `Ctrl+Shift+P`         | Open Command Palette                |
| `Ctrl+P`               | Quick file navigation               |
| ``Ctrl+` `` (backtick)  | Open integrated terminal            |
| `Ctrl+Shift+E`         | Toggle Explorer panel               |
| `Ctrl+Shift+F`         | Global search                       |
| `Ctrl+Space`           | Trigger IntelliSense suggestions     |
| `Alt+Click`            | Multi‑cursor selection              |

## Common Workflows

- **Initialize Project**
  ```bash
  git clone https://github.com/binaryjack/ai-agencee.git
  cd ai-agencee
  pnpm install
  cargo build --release
  ```
- **Start the Daemon**
  ```bash
  agencee daemon start
  # Logs: /tmp/ai_agencee_daemon.log
  ```
- **Run a DAG Agent**
  ```bash
  agencee agent --run path/to/dag.json
  ```
- **Index your Codebase**
  ```bash
  agencee code:index --path .
  ```

---

*Refer to the [Architecture](ARCHITECTURE.md) for system overview and the [README](README.md) for detailed setup.*
