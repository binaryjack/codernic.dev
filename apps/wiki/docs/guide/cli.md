# CLI Cheatsheet

The `agencee` Command Line Interface provides direct access to the Codernic Engine. While the UI offers a rich visual experience, power users can control the entire framework directly from the terminal.

## Core Commands

| Command | Description |
|---|---|
| `agencee init` | Initializes a new Codernic workspace in the current directory, creating `.codernic` and default config. |
| `agencee status` | Displays the current status of the Codernic daemon, connected IDEs, and active autonomous agents. |
| `agencee task "<desc>"` | Queues a new task for the AI to execute autonomously (e.g., `agencee task "Refactor auth"`). |
| `agencee daemon start` | Starts the Codernic inference background engine. This must be running for UI or CLI operations. |
| `agencee daemon stop` | Stops the background engine cleanly. |
| `agencee code:index --path .` | Scans the specified directory and builds the semantic memory index (Ragtime Context Engine). |
| `agencee ask --prompt "<text>"` | Sends a one-off question to the LLM. It automatically retrieves relevant context if the project is indexed. |
| `agencee analyze --file <path>` | Runs a deep Pirsig AST Firewall audit on a specific file to identify architectural flaws. |
| `agencee agent --run <dag.json>` | Executes a complex, multi-step Agent Plan (DAG). This kicks off automated autonomous coding. |

## Model Management (HuggingFace)

Codernic has built-in tools to download and manage local GGUF models directly from HuggingFace.

| Command | Description |
|---|---|
| `agencee hfs <name>` | Searches HuggingFace for a specific model (e.g., `agencee hfs qwen2.5-coder`). |
| `agencee hfd <repo/file.gguf> --provider <path>` | Downloads the model and automatically configures it in your `.codernic/llms/` provider list. |

## Profiles and Routing

If you have multiple AI routes configured (e.g., a fast local model for coding, and a large cloud model for planning), you can temporarily override the active profile during a chat session:

1. Start a chat: `agencee chat`
2. Inside the chat, type `/clp: <profile_name>` to instantly switch the backend LLM engine.

## Advanced Usage

### Strict Mode
To enforce strict type-checking and testing before a task is marked as complete, use the `--strict` flag:

```bash
agencee task "Implement new feature" --strict
```

### Verbosity
You can control the logging output level using the `-v` (verbose) or `-q` (quiet) flags.

```bash
agencee daemon start -vvv
```

---

[Next: Architecture Overview](../architecture/ragtime.md)
