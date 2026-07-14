# Architecture Overview

Codernic is designed as a distributed, high-performance, and secure AI engineering environment. It is structured to run primarily as a headless daemon on local infrastructure, orchestrating autonomous AI workflows without compromising intellectual property.

## Core Philosophy

1. **Local-First & Sovereign**: The primary engines (Ragtime, Pirsig, Galileus) all run on local hardware or within internal enterprise VPCs. We prioritize local LLM inference (via GGUF/Safetensors) before delegating to external cloud providers.
2. **Deterministic Governance**: AI agents are chaotic by nature. Codernic enforces structural behavior using Directed Acyclic Graphs (DAG) and AST Guardrails.
3. **Enterprise Zero-Trust**: All traffic and state are gated via token limits, OIDC authentication, and strict license checks.

## The Engines

Codernic is composed of specialized internal engines:

- **Deming (Inference Engine)**: A high-throughput Rust/Vulkan runtime designed for continuous batching and multi-tenant scalability without cloud APIs.
- **Galileus (The Actor System)**: Manages concurrent autonomous tasks and CI/CD pipelines.
- **Pirsig (AST Firewall)**: Parses source code mathematically, enforcing structural constraints and anonymizing sensitive data (PII) before it leaves the machine.
- **Ragtime (Context Engine)**: A blazing-fast Rust implementation of Corrective RAG (CRAG), integrating LanceDB and BM25 to feed the most relevant context to the LLM.
- **Erathos (Visual Grounding)**: Processes UI/UX screenshots and integrates Vision models for pixel-perfect AI feedback.

## Deployment Topology

The core `codernic-enterprise` daemon acts as the orchestrator. Clients, such as the `codernic-ui` dashboard or the VSCode Extension, connect to this daemon via a local WebSocket stream (CRDT sync) or Unix Sockets.

```mermaid
graph TD
    UI[Codernic UI / VSCode] <-->|WebSocket (CRDT)| Daemon(Codernic Enterprise Daemon)
    Daemon -->|Local Weights| LocalLLM[Local Infer Engine]
    Daemon -->|Proxy Guard| Shield(Pirsig Shield Proxy)
    Shield --> Cloud[OpenAI / Anthropic]
    Daemon -->|AST Analysis| Codebase[(Local Git Repository)]
```
