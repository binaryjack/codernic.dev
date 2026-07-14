# Configuration Manager

In Codernic Enterprise, hardcoded paths and fragmented `.env` files are strictly forbidden. Instead, we use the unified `ConfigurationManager` crate. This ensures that every engine, proxy, and UI module pulls from a single, deterministic source of truth.

## Cascading Architecture

The Configuration Manager resolves settings through a strict, cascading hierarchy (highest priority overrides lower priority):

1. **CLI Arguments** (e.g., `--port 8080`)
2. **Environment Variables** (e.g., `CODERNIC_PORT=8080`)
3. **Workspace Configuration** (`<project_root>/.codernic/engine.json`)
4. **Global System Configuration** (`~/.codernicapp/config/engine.json`)
5. **Hardcoded Sensible Defaults** (Built-in fallbacks)

## Key Configuration Files

### `engine.json` (The Core Settings)
This file defines the network ports, compute targets, and engine toggles.
```json
{
  "network": {
    "inference_port": 11434,
    "daemon_ws_port": 49152
  },
  "compute": {
    "target": "cuda",
    "vram_limit_gb": 24
  },
  "features": {
    "enable_crdt_sync": true,
    "enable_telemetry": true
  }
}
```

### `anonymizer.json` (AST Guardrails)
For teams dealing with proprietary algorithms or PII, the AST Anonymizer intercepts all code blocks before they hit an external LLM.

```json
{
  "strip_comments": true,
  "mask_strings": true,
  "regex_patterns": [
    "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
    "AKIA[0-9A-Z]{16}"
  ]
}
```

## Cloud Extensibility
Because Codernic integrates with GCP, AWS, and Azure, the `ConfigurationManager` initializes dynamic abstractions (like `CloudBlobStorage` and `SecretsManager`). These are configured via environment variables depending on your infrastructure:
- **AWS**: Standard `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
- **Azure**: `AZURE_CLIENT_ID` and `AZURE_CLIENT_SECRET`.

> [!TIP]
> Always prefer modifying the project-local `.codernic/engine.json` for repository-specific behaviors (like enabling a specific test runner) and keep global hardware constraints in `~/.codernicapp/config/engine.json`.
