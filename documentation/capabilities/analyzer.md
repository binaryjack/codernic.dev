# Project Analyzer

**Subsystem:** `crates/engines/agent/src/analyzer.rs`
**Role:** Automated technical stack discovery and best-practice grounding.

## Mechanism

Before an autonomous agent begins generating code, it must understand not just the existing codebase, but the broader ecosystem rules for the project's specific technologies.

The Analyzer module performs a pre-flight discovery sequence:
1. **Stack Detection:** It scans the project root for key configuration files (`Cargo.toml`, `package.json`, `tsconfig.json`) to accurately identify the primary technologies (e.g., Rust, TypeScript, Next.js, React, Vue).
2. **Web Search Grounding:** It uses `fetch_duckduckgo_lite` to query the web for the official documentation and best practices of the detected technologies. It extracts a clean text snippet to serve as external ground truth.
3. **Sandbox Configuration:** Instead of polluting the global state, the Analyzer generates a `.agencee/analysis_sandbox` directory within the project. It saves the detected stack and external best practices into this sandbox.
4. **Agent Integration:** When the agent executes, it loads this sandbox context. This ensures the agent's output aligns with external industry standards for the specific framework being used, not just its general pre-training.

## Why it matters (Our Philosophy)

LLMs often suffer from "framework drift," mixing paradigms (e.g., using outdated React class components in a modern Next.js App Router project). 

By programmatically forcing the agent to detect the exact stack and pull current, official best practices via web search *before* starting, we apply another layer of deterministic guidance. We don't rely on the user to prompt the AI with "Use Next.js 14 App Router best practices." The engine discovers it automatically, reducing cognitive load on the human.
