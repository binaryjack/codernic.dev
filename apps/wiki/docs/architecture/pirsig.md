# Pirsig (AST Firewall)

One of the largest threats in modern AI development is "hallucinated syntax." Standard AI coding assistants act as intelligent auto-completers. They output code directly to your files. If the AI hallucinates a non-existent function, imports a deprecated library, or writes a syntax error, that error immediately contaminates your project.

**Pirsig** is Codernic's AST Firewall and Zero-Trust Code Redactor. It enforces software engineering rigor over probabilistic AI.

## How Pirsig Works

Pirsig operates as a real-time semantic firewall between the AI model and your file system or external network. 

1. **Generation:** The AI proposes a code patch in a secure memory buffer.
2. **Analysis:** Pirsig intercepts the patch and parses the Abstract Syntax Tree (AST) of the code. It cross-references the proposed variables, imports, and classes against your project's existing structure.
3. **Verification:** If the code contains syntax errors or calls non-existent functions, Pirsig immediately issues a strict rejection flag. 
4. **Execution:** The AI is informed of the specific error and forced to rewrite the logic until it passes the quality gate. Only mathematically sound, verified syntax is ever allowed to be written to your disk.

## The Benefit

With Pirsig, bad code never reaches your disk. You no longer have to spend hours debugging hallucinated bugs introduced by your AI assistant. You can confidently execute automated agents knowing that the code they write is structurally sound and compliant with your project's conventions.

## Running Audits

You can manually trigger the Pirsig engine to audit an existing file in your project for architectural flaws:

```bash
agencee analyze --file src/main.rs
```
