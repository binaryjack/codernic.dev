# Codernic Protocol Crate

This crate defines the core communication protocol and shared JSON schemas used by the Codernic ecosystem. It is designed to act as a stable boundary between different components (e.g., the IDE webview, language servers, and MCP extensions) while remaining entirely decoupled from the internal engine execution logic.

## Overview

The `ai_agencee_protocol` crate provides:
1. **Strongly-typed data structures:** Enums and structs for agents, workflows, execution states, and telemetry.
2. **JSON Schemas:** Automatically derived schemas that ensure strict validation across the network and language boundaries (Rust <-> TypeScript).
3. **MCP Definitions:** Foundation types for building Model Context Protocol plugins for the Codernic framework.

## Usage

Add this to your `Cargo.toml`:

```toml
[dependencies]
ai_agencee_protocol = "0.6.343"
```

### Extending Codernic

If you are a contributor building third-party tools, plugins, or alternative webviews for Codernic, you should depend **only** on this crate. It provides the necessary `serde` models to deserialize agent configurations (`.agent.json`) and interpret workflow DAG responses.

**Example: Deserializing an Agent Configuration**

```rust
use ai_agencee_protocol::AgentConfig;

fn load_agent(json_data: &str) -> Result<AgentConfig, serde_json::Error> {
    let config: AgentConfig = serde_json::from_str(json_data)?;
    println!("Loaded Agent: {}", config.name);
    Ok(config)
}
```

## Security & Privacy

This crate contains **zero** execution logic, no access to the underlying FTS5 / indexing engine, and no file-system arbitration code. It is simply a shared vocabulary.

By open-sourcing this boundary, we empower developers to write custom visualizers, analytics tools, or enterprise plugin adapters without exposing the proprietary deterministic engine.

## License

MIT License. See the root `LICENSE` file for more details.
