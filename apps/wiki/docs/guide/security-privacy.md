# Security, Privacy & Data Loss Prevention

For enterprise adopters, the biggest friction point with AI coding assistants is Data Loss Prevention (DLP). Standard cloud-based AI tools blindly ingest proprietary intellectual property into opaque vendor clouds.

Codernic is built from the ground up for strict digital sovereignty.

## 1. 100% Local-First Guarantee

Out of the box, Codernic operates entirely on your local machine. 
* Local LLMs downloaded from the Model Hub run securely on your local GPU/CPU.
* Your codebase never leaves your hard drive.
* **Ragtime Context Engine** extraction and **Pirsig AST Firewall** analysis all happen locally in the compiled Rust daemon.

## 2. Shield DLP Firewall

If you opt into using Cloud Models (like OpenAI or Anthropic) for complex reasoning tasks, Codernic utilizes the **Shield DLP Firewall** to protect your code.

* The Shield acts as an interception layer for all outbound logic.
* Before sending an API request, it cryptographically strips out API keys, hardcoded passwords, and defined PII.
* It verifies all requests against your enterprise policies.

## 3. Role-Based Access Control (RBAC)

In **Codernic Architect / Enterprise**, Codernic supports strict RBAC integration via Microsoft Entra ID / OAuth.
* Developers can be restricted from pushing AI-generated code directly to `main` without Pirsig approval.
* Cloud model usage can be restricted to specific developer tiers.
* Read/Write permissions for the AI agents map exactly to the developer's permissions, ensuring the AI cannot bypass system access controls.
