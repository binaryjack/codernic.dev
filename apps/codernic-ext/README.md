# Codernic for VS Code

**A lightweight bridge connecting your IDE to the Codernic Platform.**

**Version**: 0.6.237 | **Status**: Production-Ready | **Publisher**: binaryjack | **License**: MIT

---

## Table of Contents

- [What is Codernic for VS Code?](#what-is-codernic-for-vs-code)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Testing & Building](#testing--building)
- [Community & Contributing](#community--contributing)

---

## What is Codernic for VS Code?

Codernic for VS Code is the official IDE integration for the Codernic AI platform. Rather than running heavy AI processing or orchestration locally, this extension acts as a high-performance bridge. It securely connects your local workspace context to the central Codernic Engine, allowing you to leverage enterprise-grade AI orchestration directly within your editor.

---

## Key Features

- **Seamless IDE Integration** — Interact with the Codernic platform without leaving VS Code.
- **Lightweight Footprint** — The heavy lifting (orchestration, symbol indexing, model execution) is handled by the Codernic Engine, keeping your editor fast.
- **Real-time Synchronization** — Securely syncs your local file changes and context with your active Codernic workspace.
- **Secure Bridge** — Connects via encrypted WebSocket/HTTP protocols to ensure your code remains secure during transit.

---

## Quick Start

### Installation

**From Visual Studio Code Marketplace**:

1. Open VS Code
2. Navigate to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Codernic"
4. Click Install

**From VSIX (Development Release)**:

1. Download the latest `.vsix` file from the repository releases.
2. Run in terminal:
   ```bash
   code --install-extension codernic-ext-0.6.237.vsix --force
   ```

### System Requirements

- **VS Code**: `>= 1.95.0`
- **Network**: Active connection to your Codernic Hub/Engine.

---

## Architecture

The extension acts strictly as a proxy client. 

1. **Client Layer**: VS Code Extension (captures user intent, provides UI views).
2. **Bridge Layer**: Syncs current file state, selections, and workspace context to the platform.
3. **Engine Layer (Remote)**: The central Codernic Engine executes agents, builds the context graph, and coordinates changes, streaming the results back to the IDE.

---

## Configuration

Configure the connection to your Codernic Engine in your `settings.json`:

```json
{
  "codernic.endpoint": "https://api.codernic.dev",
  "codernic.workspaceToken": "<your-secure-token>",
  "codernic.debugMode": false
}
```

### Configuration Reference

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `codernic.endpoint` | string | `""` | The URL of your Codernic Engine / Hub. |
| `codernic.workspaceToken` | string | `""` | Authentication token for your workspace. |
| `codernic.debugMode` | boolean | `false` | Enable verbose logging for bridge connectivity. |

---

## Testing & Building

### Run Tests

```bash
cd apps/codernic-ext
pnpm test
```

### Build Extension

```bash
pnpm build
```

---

## Community & Contributing

Codernic for VS Code is part of the larger Codernic ecosystem. For information on contributing, code of conduct, licensing, and support, please refer to the main repository documents:

- [Main Repository](https://github.com/binaryjack/ai-agencee)
- [Contributing Guidelines](../../CONTRIBUTING.md)
- [License Information](../../LICENSE)
