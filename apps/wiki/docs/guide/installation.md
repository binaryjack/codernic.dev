# Installation & Setup

Codernic is distributed as a highly optimized, pre-compiled Rust binary wrapped inside an IDE extension. Because the heavy lifting is done by the standalone native engine, it won't bloat your Node.js or Python environment.

## 1. Visual Studio Code Extension

The fastest way to start using Codernic is via the VSIX package. This package bundles the Codernic Daemon and CLI, so you don't need to manually install any external dependencies.

1. Go to the [Releases](https://github.com/binaryjack/codernic.dev/releases) page.
2. Download the latest `codernic-ext-x.x.x.vsix` file.
3. Open your terminal and run:

```bash
code --install-extension codernic-ext-x.x.x.vsix --force
```

4. Restart VS Code. You will now see the Codernic Sidebar icon.

## 2. Setting Up Your AI Brain (Models)

When you first launch Codernic, it will automatically generate a `.codernic/llms/` folder in your project. This folder holds the settings for the AI models you want to use.

### Local AI (Running on your machine)

Codernic champions local-first privacy. If you have a local model running (like Ollama), ensure your `ollama.provider.json` looks like this:

```json
{
  "type": "openai",
  "apiKey": "ollama",
  "baseUrl": "http://127.0.0.1:11434/v1",
  "models": [
    { "id": "llama3.1", "name": "Llama 3.1", "contextWindow": 8192 }
  ]
}
```

### Commercial APIs (OpenAI / Anthropic)

To use cloud models, update the respective provider file (e.g., `openai.provider.json`) with your API key:

```json
{
  "type": "openai",
  "apiKey": "sk-your-api-key-here",
  "baseUrl": "https://api.openai.com/v1",
  "models": [
    { "id": "gpt-4o", "name": "GPT-4o", "contextWindow": 128000 }
  ]
}
```

## 3. Initializing Your Workspace

Before Codernic can help you, it needs to read and understand your current project files. Open your terminal in the root of your project and run:

```bash
codernic code:index --path .
```

This tells the **Smart Workspace Memory** to scan your code and create a highly efficient map of your project. Depending on the size of your project, this may take a few seconds to a minute.

---

[Next: Quick Start (Your First Prompt)](./quick-start.md)
