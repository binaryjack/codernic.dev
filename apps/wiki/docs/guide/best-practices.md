# Market Best Practices

Codernic is designed to align strictly with modern enterprise engineering standards. We reject "Vibe Coding" and unreliable prompt-engineering hacks in favor of deterministic, verifiable software practices.

Here are the best practices for using Codernic and how they align with the broader market:

## 1. Shift-Left Security & Zero-Trust
**Market Standard:** Security should be enforced as early in the development lifecycle as possible, ideally before code is even committed.
**Codernic Practice:** Do not rely on LLMs to "promise" they won't write vulnerable code. Enable the **Pirsig AST Anonymizer** to physically strip proprietary variables before the prompt hits the network. Use the **Galileus CI Gatekeeper** to run SARIF vulnerability audits on Pull Requests autonomously.

## 2. Stateless Gateways & BYOK (Bring Your Own Key)
**Market Standard:** Centralized API key management prevents developer leaks and budget exhaustion.
**Codernic Practice:** Never distribute `OPENAI_API_KEY` to your developers' local `.env` files. Route all traffic through the **Pirsig Shield Proxy**, which holds the master keys in its `SecretsManager` and enforces strict Token Bucket rate limits across the organization.

## 3. CRDTs over Operational Transformation (OT)
**Market Standard:** Real-time collaboration requires mathematically guaranteed conflict resolution. Modern tools (like Figma and local-first software) have moved away from centralized OT in favor of CRDTs.
**Codernic Practice:** Codernic Enterprise uses the `y-rs` (Yjs Rust port) to synchronize code modifications between autonomous agents and human VSCode extensions. This guarantees deterministic merges without requiring a central "locking" server, ensuring your code stays within your VPC.

## 4. Deterministic State & "Hierarchical Configuration"
**Market Standard:** 12-Factor Apps mandate strict configuration management, prioritizing environment variables and avoiding hardcoded paths.
**Codernic Practice:** Codernic strictly relies on its `ConfigurationManager`. Paths are never hardcoded. Settings cascade predictably from CLI Arguments → Environment Variables → Local `.codernic/engine.json` → Global `~/.codernicapp/engine.json`.

## 5. Structural Agents over Prompts
**Market Standard:** "Prompt Engineering" is fragile. Software engineering requires structural schemas and API contracts.
**Codernic Practice:** Use the Structura Visual Editor to draw DAGs (Directed Acyclic Graphs). Break complex AI tasks down into isolated, single-responsibility Agents (e.g., one agent writes tests, another writes documentation). This is far more reliable than asking a single LLM to perform 5 tasks in one prompt.
